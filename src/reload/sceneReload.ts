import * as vscode from 'vscode';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import * as crypto from 'crypto';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

const CDP_PORT = 9222;
const RELOAD_DEBOUNCE_MS = 300;

/** Minimal CDP (Chrome DevTools Protocol) client over raw WebSocket. */
class CdpClient {
  private socket: net.Socket | null = null;
  private msgId = 0;
  private buffer = '';
  private pendingFrameData = Buffer.alloc(0);
  private connected = false;

  async connect(wsUrl: string): Promise<void> {
    const url = new URL(wsUrl);
    const host = url.hostname;
    const port = parseInt(url.port, 10);
    const pathStr = url.pathname + url.search;

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        // Send WebSocket upgrade request
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
              // Process any remaining data after the handshake
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

  /** Parse incoming WebSocket frames (text frames only, no fragmentation). */
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
        // For simplicity, read lower 32 bits only
        payloadLength = this.pendingFrameData.readUInt32BE(6);
        offset = 10;
      }

      if (masked) offset += 4;

      if (this.pendingFrameData.length < offset + payloadLength) return;

      if (opcode === 0x08) {
        // Close frame
        this.disconnect();
        return;
      }

      if (opcode === 0x09) {
        // Ping — send pong
        this.sendFrame(0x0a, this.pendingFrameData.subarray(offset, offset + payloadLength));
      }

      // Consume frame
      this.pendingFrameData = this.pendingFrameData.subarray(offset + payloadLength);
    }
  }

  /** Send a masked WebSocket frame. */
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

  /** Send a CDP command and return immediately (fire-and-forget). */
  send(method: string, params: Record<string, unknown> = {}): number {
    const id = ++this.msgId;
    const msg = JSON.stringify({ id, method, params });
    this.sendFrame(0x01, Buffer.from(msg, 'utf-8'));
    return id;
  }

  isConnected(): boolean {
    return this.connected && this.socket !== null && !this.socket.destroyed;
  }

  disconnect(): void {
    this.connected = false;
    if (this.socket) {
      try { this.socket.destroy(); } catch { /* ignore */ }
      this.socket = null;
    }
  }
}

/** Discover the first page's WebSocket debugger URL from CDP. */
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

/** Build the JS expression that re-evaluates a plugin file and reloads the scene. */
function buildReloadExpression(pluginFileName: string, fileContent: string): string {
  // Escape the file content for embedding in a JS string
  const escaped = JSON.stringify(fileContent);
  return [
    `(function() {`,
    `  try {`,
    `    // Re-evaluate the plugin code`,
    `    (0, eval)(${escaped});`,
    `    // Reload the current scene`,
    `    if (typeof SceneManager !== 'undefined' && SceneManager._scene) {`,
    `      var ctor = SceneManager._scene.constructor;`,
    `      SceneManager.goto(ctor);`,
    `      return 'Reloaded scene after updating ' + ${JSON.stringify(pluginFileName)};`,
    `    } else {`,
    `      return 'Plugin re-evaluated but no active scene to reload';`,
    `    }`,
    `  } catch(e) {`,
    `    return 'Scene reload error: ' + e.message;`,
    `  }`,
    `})()`,
  ].join('\n');
}

// ── Public API ──────────────────────────────────────────────────────────

let enabled = false;
let cdpClient: CdpClient | null = null;
let fileWatcher: vscode.FileSystemWatcher | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function updateStatusBar(): void {
  if (!statusBarItem) return;
  if (!enabled) {
    statusBarItem.text = t('reload.statusOff');
    statusBarItem.tooltip = t('reload.tooltipOff');
    statusBarItem.backgroundColor = undefined;
  } else if (cdpClient?.isConnected()) {
    statusBarItem.text = t('reload.statusConnected');
    statusBarItem.tooltip = t('reload.tooltipConnected');
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = t('reload.statusWaiting');
    statusBarItem.tooltip = t('reload.tooltipWaiting');
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  statusBarItem.show();
}

async function connectToGame(): Promise<boolean> {
  if (cdpClient?.isConnected()) return true;

  cdpClient?.disconnect();
  cdpClient = null;

  try {
    const wsUrl = await getDebuggerWsUrl();
    const client = new CdpClient();
    await client.connect(wsUrl);
    cdpClient = client;
    updateStatusBar();
    return true;
  } catch {
    cdpClient = null;
    updateStatusBar();
    return false;
  }
}

async function reloadScene(filePath: string): Promise<void> {
  // Try to connect if not already connected
  if (!cdpClient?.isConnected()) {
    const ok = await connectToGame();
    if (!ok) return; // Game not running, silently skip
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const expression = buildReloadExpression(fileName, content);

    cdpClient!.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });

    vscode.window.setStatusBarMessage(t('reload.reloadedScene', fileName), 3000);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showWarningMessage(t('reload.failed', msg));
    // Connection may be stale
    cdpClient?.disconnect();
    cdpClient = null;
    updateStatusBar();
  }
}

function startWatching(): void {
  if (fileWatcher) return;

  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;

  // Watch js/plugins/*.js across all workspace folders
  fileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(folders[0], 'js/plugins/**/*.js')
  );

  const onPluginSaved = (uri: vscode.Uri) => {
    if (!enabled) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => reloadScene(uri.fsPath), RELOAD_DEBOUNCE_MS);
  };

  fileWatcher.onDidChange(onPluginSaved);
  fileWatcher.onDidCreate(onPluginSaved);
}

function stopWatching(): void {
  if (fileWatcher) {
    fileWatcher.dispose();
    fileWatcher = null;
  }
  cdpClient?.disconnect();
  cdpClient = null;
}

export function activate(context: vscode.ExtensionContext): void {
  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  statusBarItem.command = 'rmmz.toggleSceneReload';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.toggleSceneReload', () => {
      if (!requirePro('Quick Scene Reload')) return;
      enabled = !enabled;
      if (enabled) {
        startWatching();
        // Try to connect immediately so the user sees feedback
        connectToGame();
        vscode.window.showInformationMessage(t('reload.enabled'));
      } else {
        stopWatching();
        vscode.window.showInformationMessage(t('reload.disabled'));
      }
      updateStatusBar();
    })
  );

  // Cleanup on deactivation
  context.subscriptions.push({
    dispose() {
      stopWatching();
      if (debounceTimer) clearTimeout(debounceTimer);
    },
  });
}
