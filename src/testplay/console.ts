import * as vscode from 'vscode';
import { CdpClient, getDebuggerWsUrl } from '../cdp/client';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

const RECONNECT_INTERVAL_MS = 3000;

interface ConsoleCallArgs {
  type?: string;
  value?: string;
  description?: string;
  preview?: { properties?: Array<{ name: string; value: string }> };
}

let outputChannel: vscode.OutputChannel | null = null;
let cdpClient: CdpClient | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel(t('console.channelName'));
  }
  return outputChannel;
}

function timestamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function formatArg(arg: ConsoleCallArgs): string {
  if (arg.value !== undefined) return String(arg.value);
  if (arg.description !== undefined) return arg.description;
  if (arg.preview?.properties) {
    const props = arg.preview.properties
      .map(p => `${p.name}: ${p.value}`)
      .join(', ');
    return `{ ${props} }`;
  }
  return String(arg.type ?? 'undefined');
}

function onConsoleAPICalled(params: Record<string, unknown>): void {
  const channel = getOutputChannel();
  const type = (params.type as string) ?? 'log';
  const args = (params.args as ConsoleCallArgs[]) ?? [];
  const content = args.map(formatArg).join(' ');

  const level = type.toUpperCase().padEnd(5);
  channel.appendLine(`[${timestamp()}] ${level} ${content}`);
}

function onExceptionThrown(params: Record<string, unknown>): void {
  const channel = getOutputChannel();
  const detail = params.exceptionDetails as Record<string, unknown> | undefined;
  let text = 'Unknown exception';
  if (detail) {
    const exc = detail.exception as ConsoleCallArgs | undefined;
    text = exc?.description ?? exc?.value ?? detail.text as string ?? text;
  }
  channel.appendLine(`[${timestamp()}] ERROR ${text}`);
}

async function connectAndListen(): Promise<void> {
  // Clean up previous connection
  if (cdpClient) {
    cdpClient.removeAllListeners();
    cdpClient.disconnect();
    cdpClient = null;
  }

  try {
    const wsUrl = await getDebuggerWsUrl();
    const client = new CdpClient();
    await client.connect(wsUrl);
    cdpClient = client;

    // Enable Runtime domain to receive console events
    client.send('Runtime.enable');

    client.on('Runtime.consoleAPICalled', onConsoleAPICalled);
    client.on('Runtime.exceptionThrown', onExceptionThrown);

    client.on('close', () => {
      getOutputChannel().appendLine(`[${timestamp()}] ${t('console.disconnected')}`);
      scheduleReconnect();
    });

    getOutputChannel().appendLine(`[${timestamp()}] ${t('console.connected')}`);
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (!listening) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (listening) {
      connectAndListen();
    }
  }, RECONNECT_INTERVAL_MS);
}

function startListening(): void {
  if (listening) return;
  listening = true;
  getOutputChannel().appendLine(`[${timestamp()}] ${t('console.listening')}`);
  connectAndListen();
}

function stopListening(): void {
  listening = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  if (cdpClient) {
    cdpClient.removeAllListeners();
    cdpClient.disconnect();
    cdpClient = null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.showConsole', () => {
      if (!requirePro('Testplay Console')) return;
      const channel = getOutputChannel();
      channel.show(true);
      startListening();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.clearConsole', () => {
      const channel = getOutputChannel();
      channel.clear();
      channel.appendLine(`[${timestamp()}] ${t('console.cleared')}`);
    })
  );

  context.subscriptions.push({
    dispose() {
      stopListening();
      if (outputChannel) {
        outputChannel.dispose();
        outputChannel = null;
      }
    },
  });
}
