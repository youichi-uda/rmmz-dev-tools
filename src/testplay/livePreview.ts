import * as vscode from 'vscode';
import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import { requirePro } from '../license/gumroad';

const CDP_PORT = 9222;
const DEFAULT_INTERVAL_MS = 500;

// ---------------------------------------------------------------------------
// Minimal CDP client with response handling
// ---------------------------------------------------------------------------

type MessageCallback = (response: Record<string, unknown>) => void;

class CdpClient {
  private socket: net.Socket | null = null;
  private msgId = 0;
  private pendingFrameData = Buffer.alloc(0);
  private connected = false;
  private callbacks = new Map<number, MessageCallback>();
  private textBuffer = '';

  async connect(wsUrl: string): Promise<void> {
    const url = new URL(wsUrl);
    const host = url.hostname;
    const port = parseInt(url.port, 10);
    const pathStr = url.pathname + url.search;

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        const key = crypto.randomBytes(16).toString('base64');
        const request = [
          `GET ${pathStr} HTTP/1.1`,
          `Host: ${host}:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${key}`,
          'Sec-WebSocket-Version: 13',
          '', '',
        ].join('\r\n');
        socket.write(request);
      });

      let handshakeDone = false;

      socket.on('data', (data: Buffer) => {
        if (!handshakeDone) {
          const str = data.toString();
          if (str.includes('\r\n\r\n')) {
            if (str.includes('101')) {
              handshakeDone = true;
              this.socket = socket;
              this.connected = true;
              const idx = data.indexOf(Buffer.from('\r\n\r\n')) + 4;
              if (idx < data.length) {
                this.onSocketData(data.subarray(idx));
              }
              resolve();
            } else {
              socket.destroy();
              reject(new Error('WebSocket upgrade failed'));
            }
          }
          return;
        }
        this.onSocketData(data);
      });

      socket.on('error', (err) => {
        this.connected = false;
        if (!handshakeDone) reject(err);
      });

      socket.on('close', () => {
        this.connected = false;
        this.socket = null;
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });
  }

  private onSocketData(data: Buffer): void {
    this.pendingFrameData = Buffer.concat([this.pendingFrameData, data]);

    while (this.pendingFrameData.length >= 2) {
      const firstByte = this.pendingFrameData[0];
      const secondByte = this.pendingFrameData[1];
      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.pendingFrameData.length < 4) return;
        payloadLength = this.pendingFrameData.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.pendingFrameData.length < 10) return;
        payloadLength = this.pendingFrameData.readUInt32BE(6);
        offset = 10;
      }

      if (masked) offset += 4;
      if (this.pendingFrameData.length < offset + payloadLength) return;

      const payload = this.pendingFrameData.subarray(offset, offset + payloadLength);

      if (opcode === 0x08) {
        this.disconnect();
        return;
      }

      if (opcode === 0x09) {
        this.sendFrame(0x0a, payload);
      }

      if (opcode === 0x01) {
        // Text frame
        this.textBuffer += payload.toString('utf-8');

        // Check if this is the final frame (FIN bit set)
        if (firstByte & 0x80) {
          this.handleMessage(this.textBuffer);
          this.textBuffer = '';
        }
      }

      this.pendingFrameData = this.pendingFrameData.subarray(offset + payloadLength);
    }
  }

  private handleMessage(text: string): void {
    try {
      const msg = JSON.parse(text) as Record<string, unknown>;
      const id = typeof msg.id === 'number' ? msg.id : undefined;
      if (id !== undefined && this.callbacks.has(id)) {
        const cb = this.callbacks.get(id)!;
        this.callbacks.delete(id);
        cb(msg);
      }
    } catch {
      // ignore parse errors
    }
  }

  private sendFrame(opcode: number, payload: Buffer): void {
    if (!this.socket) return;
    const mask = crypto.randomBytes(4);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      masked[i] = payload[i] ^ mask[i % 4];
    }

    let header: Buffer;
    if (payload.length < 126) {
      header = Buffer.alloc(6);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | payload.length;
      mask.copy(header, 2);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(8);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
      mask.copy(header, 4);
    } else {
      header = Buffer.alloc(14);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(payload.length, 6);
      mask.copy(header, 10);
    }

    this.socket.write(Buffer.concat([header, masked]));
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, resolve);
      const msg = JSON.stringify({ id, method, params });
      this.sendFrame(0x01, Buffer.from(msg, 'utf-8'));

      // Timeout for response
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP response timeout for ${method}`));
        }
      }, 10000);
    });
  }

  isConnected(): boolean {
    return this.connected && this.socket !== null && !this.socket.destroyed;
  }

  disconnect(): void {
    this.connected = false;
    this.callbacks.clear();
    if (this.socket) {
      try { this.socket.destroy(); } catch { /* ignore */ }
      this.socket = null;
    }
  }
}

// ---------------------------------------------------------------------------
// CDP discovery
// ---------------------------------------------------------------------------

function getDebuggerWsUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          if (!Array.isArray(pages) || pages.length === 0) {
            reject(new Error('No debuggable pages found'));
            return;
          }
          const wsUrl = pages[0].webSocketDebuggerUrl;
          if (!wsUrl) {
            reject(new Error('No webSocketDebuggerUrl in page info'));
            return;
          }
          resolve(wsUrl);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timeout connecting to CDP'));
    });
  });
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function renderWebviewHtml(nonce: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
    width: 100%;
    max-width: 820px;
  }
  .toolbar .info {
    flex: 1;
    font-size: 12px;
    color: #a6adc8;
  }
  .toolbar .info .resolution {
    color: #89b4fa;
    font-weight: 500;
  }
  .toolbar .info .fps {
    color: #a6e3a1;
    margin-left: 12px;
  }
  button {
    background: #45475a;
    color: #cdd6f4;
    border: none;
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 13px;
    cursor: pointer;
  }
  button:hover { background: #585b70; }
  button.active {
    background: #89b4fa;
    color: #1e1e2e;
  }
  .preview-container {
    border: 1px solid #45475a;
    border-radius: 4px;
    overflow: hidden;
    background: #11111b;
  }
  #screenshot {
    display: block;
    max-width: 100%;
    image-rendering: pixelated;
  }
  .status {
    text-align: center;
    padding: 60px 20px;
    color: #6c7086;
    font-size: 14px;
  }
  .status h2 {
    color: #45475a;
    font-size: 18px;
    margin-bottom: 8px;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <div class="info">
      <span class="resolution" id="resolution">--</span>
      <span class="fps" id="fps"></span>
    </div>
    <button id="pauseBtn">Pause</button>
  </div>

  <div class="preview-container" id="previewContainer">
    <div class="status" id="statusMsg">
      <h2>Connecting...</h2>
      <p>Waiting for game on port ${CDP_PORT}</p>
    </div>
    <img id="screenshot" style="display:none;" alt="Game screenshot" />
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const img = document.getElementById('screenshot');
    const statusMsg = document.getElementById('statusMsg');
    const pauseBtn = document.getElementById('pauseBtn');
    const resolutionEl = document.getElementById('resolution');
    const fpsEl = document.getElementById('fps');
    let paused = false;

    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      pauseBtn.classList.toggle('active', paused);
      vscode.postMessage({ type: paused ? 'pause' : 'resume' });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'screenshot') {
        img.src = 'data:image/png;base64,' + msg.data;
        img.style.display = 'block';
        statusMsg.style.display = 'none';
        if (msg.width && msg.height) {
          resolutionEl.textContent = msg.width + ' x ' + msg.height;
        }
        if (msg.fps) {
          fpsEl.textContent = msg.fps + ' FPS';
        }
      } else if (msg.type === 'disconnected') {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = '<h2>Game Not Running</h2><p>Start the game with remote debugging on port ${CDP_PORT}</p>';
        resolutionEl.textContent = '--';
        fpsEl.textContent = '';
      } else if (msg.type === 'connecting') {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = '<h2>Connecting...</h2><p>Attempting to connect to game on port ${CDP_PORT}</p>';
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Live Preview management
// ---------------------------------------------------------------------------

let currentPanel: vscode.WebviewPanel | undefined;
let cdpClient: CdpClient | null = null;
let captureInterval: ReturnType<typeof setInterval> | undefined;
let paused = false;

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

async function connectAndCapture(): Promise<void> {
  if (!currentPanel) return;

  // Notify webview we're connecting
  currentPanel.webview.postMessage({ type: 'connecting' });

  try {
    const wsUrl = await getDebuggerWsUrl();
    const client = new CdpClient();
    await client.connect(wsUrl);
    cdpClient = client;
    startCapturing();
  } catch {
    cdpClient = null;
    if (currentPanel) {
      currentPanel.webview.postMessage({ type: 'disconnected' });
    }
    // Retry connection after a delay
    setTimeout(() => {
      if (currentPanel && !cdpClient?.isConnected()) {
        connectAndCapture();
      }
    }, 3000);
  }
}

function startCapturing(): void {
  if (captureInterval) clearInterval(captureInterval);

  const intervalMs = vscode.workspace.getConfiguration('rmmz').get<number>(
    'livePreviewInterval', DEFAULT_INTERVAL_MS
  );

  captureInterval = setInterval(async () => {
    if (paused || !currentPanel || !cdpClient?.isConnected()) {
      if (!cdpClient?.isConnected() && currentPanel) {
        stopCapturing();
        currentPanel.webview.postMessage({ type: 'disconnected' });
        // Try to reconnect
        setTimeout(() => {
          if (currentPanel) connectAndCapture();
        }, 3000);
      }
      return;
    }

    try {
      const response = await cdpClient.send('Page.captureScreenshot', {
        format: 'png',
        quality: 80,
      });

      const result = response.result as Record<string, unknown> | undefined;
      if (result && typeof result.data === 'string' && currentPanel) {
        // Try to get resolution info
        let width: number | undefined;
        let height: number | undefined;
        let fps: string | undefined;

        try {
          const metricsResponse = await cdpClient.send('Runtime.evaluate', {
            expression: 'JSON.stringify({w:Graphics.width,h:Graphics.height,fps:Math.round(Graphics._fpsMeter&&Graphics._fpsMeter.fps||0)})',
            returnByValue: true,
          });
          const metricsResult = metricsResponse.result as Record<string, unknown> | undefined;
          if (metricsResult) {
            const value = metricsResult.value as Record<string, unknown> | undefined;
            if (value && typeof value === 'object') {
              const parsed = typeof value === 'string' ? JSON.parse(value as string) : value;
              width = parsed.w as number;
              height = parsed.h as number;
              fps = String(parsed.fps || '');
            }
          }
        } catch {
          // metrics are optional
        }

        currentPanel.webview.postMessage({
          type: 'screenshot',
          data: result.data,
          width,
          height,
          fps,
        });
      }
    } catch {
      // Screenshot failed, connection may be lost
      if (cdpClient && !cdpClient.isConnected()) {
        stopCapturing();
        if (currentPanel) {
          currentPanel.webview.postMessage({ type: 'disconnected' });
          setTimeout(() => {
            if (currentPanel) connectAndCapture();
          }, 3000);
        }
      }
    }
  }, intervalMs);
}

function stopCapturing(): void {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = undefined;
  }
}

function cleanup(): void {
  stopCapturing();
  cdpClient?.disconnect();
  cdpClient = null;
  paused = false;
}

function showLivePreview(): void {
  if (!requirePro('Live Game Preview')) return;
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  const nonce = getNonce();

  currentPanel = vscode.window.createWebviewPanel(
    'rmmzLivePreview',
    'RMMZ Live Preview',
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  currentPanel.webview.html = renderWebviewHtml(nonce);

  currentPanel.webview.onDidReceiveMessage((msg: Record<string, unknown>) => {
    if (msg.type === 'pause') {
      paused = true;
    } else if (msg.type === 'resume') {
      paused = false;
    }
  });

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
    cleanup();
  });

  // Start connection
  connectAndCapture();
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the `rmmz.showLivePreview` command.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.showLivePreview', showLivePreview)
  );

  context.subscriptions.push({
    dispose() {
      cleanup();
    },
  });
}
