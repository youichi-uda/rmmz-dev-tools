import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

const CDP_PORT = 9222;

/**
 * Shared Chrome DevTools Protocol client over raw WebSocket.
 *
 * Extends EventEmitter so callers can subscribe to CDP events:
 *   client.on('Runtime.consoleAPICalled', (params) => { ... });
 *   client.on('Runtime.exceptionThrown', (params) => { ... });
 *   client.on('message', (msg) => { ... });  // all parsed messages
 *   client.on('close', () => { ... });
 */
export class CdpClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private msgId = 0;
  private pendingFrameData = Buffer.alloc(0);
  private connected = false;
  private pendingResolves = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

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
        this.emit('close');
      });

      socket.on('close', () => {
        this.connected = false;
        this.socket = null;
        this.emit('close');
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });
  }

  /** Parse incoming WebSocket frames (text frames only). */
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
        // Ping -> pong
        this.sendFrame(0x0a, payload);
      }

      if (opcode === 0x01) {
        // Text frame — parse as JSON CDP message
        try {
          const msg = JSON.parse(payload.toString('utf-8'));
          this.handleMessage(msg);
        } catch {
          // Ignore malformed messages
        }
      }

      this.pendingFrameData = this.pendingFrameData.subarray(offset + payloadLength);
    }
  }

  private handleMessage(msg: Record<string, unknown>): void {
    this.emit('message', msg);

    // CDP event (has "method" but no "id")
    if (typeof msg.method === 'string' && !('id' in msg)) {
      this.emit(msg.method, msg.params);
    }

    // CDP response (has "id")
    if (typeof msg.id === 'number') {
      const pending = this.pendingResolves.get(msg.id);
      if (pending) {
        this.pendingResolves.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error((msg.error as Record<string, string>).message ?? 'CDP error'));
        } else {
          pending.resolve(msg.result);
        }
      }
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

  /** Send a CDP command (fire-and-forget). Returns the message id. */
  send(method: string, params: Record<string, unknown> = {}): number {
    const id = ++this.msgId;
    const msg = JSON.stringify({ id, method, params });
    this.sendFrame(0x01, Buffer.from(msg, 'utf-8'));
    return id;
  }

  /** Send a CDP command and wait for the response. */
  sendAndWait(method: string, params: Record<string, unknown> = {}, timeoutMs = 5000): Promise<unknown> {
    const id = ++this.msgId;
    const msg = JSON.stringify({ id, method, params });
    this.sendFrame(0x01, Buffer.from(msg, 'utf-8'));

    return new Promise((resolve, reject) => {
      this.pendingResolves.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pendingResolves.has(id)) {
          this.pendingResolves.delete(id);
          reject(new Error('CDP response timed out'));
        }
      }, timeoutMs);
    });
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
    // Reject all pending requests
    for (const [, pending] of this.pendingResolves) {
      pending.reject(new Error('Connection closed'));
    }
    this.pendingResolves.clear();
  }
}

/** Discover the first page's WebSocket debugger URL from CDP. */
export function getDebuggerWsUrl(port = CDP_PORT): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/json`, (res) => {
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
