import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

const BUILD_DEBOUNCE_MS = 500;

let enabled = false;
let fileWatcher: vscode.FileSystemWatcher | null = null;
let fileWatchers: vscode.FileSystemWatcher[] = [];
let statusBarItem: vscode.StatusBarItem | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let diagnosticCollection: vscode.DiagnosticCollection | null = null;

type BuildState = 'off' | 'watching' | 'building' | 'ok' | 'error';

function updateStatusBar(state: BuildState): void {
  if (!statusBarItem) return;
  switch (state) {
    case 'off':
      statusBarItem.text = t('typescript.buildOff');
      statusBarItem.tooltip = t('typescript.buildOffTooltip');
      statusBarItem.backgroundColor = undefined;
      break;
    case 'watching':
      statusBarItem.text = t('typescript.buildWatching');
      statusBarItem.tooltip = t('typescript.buildWatchingTooltip');
      statusBarItem.backgroundColor = undefined;
      break;
    case 'building':
      statusBarItem.text = t('typescript.buildBuilding');
      statusBarItem.tooltip = t('typescript.buildBuildingTooltip');
      statusBarItem.backgroundColor = undefined;
      break;
    case 'ok':
      statusBarItem.text = t('typescript.buildOk');
      statusBarItem.tooltip = t('typescript.buildOkTooltip');
      statusBarItem.backgroundColor = undefined;
      break;
    case 'error':
      statusBarItem.text = t('typescript.buildError');
      statusBarItem.tooltip = t('typescript.buildErrorTooltip');
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      break;
  }
  statusBarItem.show();
}

/**
 * Finds the tsc executable: project node_modules first, then npx fallback.
 */
function findTsc(root: string): { cmd: string; args: string[] } | null {
  // Check project-local tsc
  const localTsc = path.join(root, 'node_modules', '.bin', 'tsc');
  const localTscCmd = process.platform === 'win32' ? localTsc + '.cmd' : localTsc;
  if (fs.existsSync(localTscCmd)) {
    return { cmd: localTscCmd, args: [] };
  }
  if (fs.existsSync(localTsc)) {
    return { cmd: localTsc, args: [] };
  }

  // Fallback to npx
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return { cmd: npxCmd, args: ['tsc'] };
}

/**
 * Parses tsc output into VS Code diagnostics.
 */
function parseTscOutput(output: string, root: string): Map<string, vscode.Diagnostic[]> {
  const diagnostics = new Map<string, vscode.Diagnostic[]>();
  // tsc output format: path(line,col): error TSxxxx: message
  const regex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    const [, filePath, lineStr, colStr, severity, code, message] = match;
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
    const line = parseInt(lineStr, 10) - 1;
    const col = parseInt(colStr, 10) - 1;

    const diag = new vscode.Diagnostic(
      new vscode.Range(line, col, line, col + 1),
      `${code}: ${message}`,
      severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning
    );
    diag.source = 'tsc';

    const uri = vscode.Uri.file(absPath).toString();
    if (!diagnostics.has(uri)) {
      diagnostics.set(uri, []);
    }
    diagnostics.get(uri)!.push(diag);
  }

  return diagnostics;
}

function runBuild(): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;

  const root = folders[0].uri.fsPath;
  const tsconfigPath = path.join(root, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return;

  const tsc = findTsc(root);
  if (!tsc) return;

  updateStatusBar('building');

  const allArgs = [...tsc.args, '--project', tsconfigPath];
  const proc = spawn(tsc.cmd, allArgs, {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
  proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

  proc.on('close', (code) => {
    if (!diagnosticCollection) return;
    diagnosticCollection.clear();

    const output = stdout + stderr;

    if (code === 0) {
      updateStatusBar('ok');
    } else {
      updateStatusBar('error');
      const parsed = parseTscOutput(output, root);
      for (const [uriStr, diags] of parsed) {
        diagnosticCollection.set(vscode.Uri.parse(uriStr), diags);
      }
    }
  });

  proc.on('error', (err) => {
    updateStatusBar('error');
    if (err.message.includes('ENOENT')) {
      vscode.window.showErrorMessage(t('typescript.tscNotFound'));
    }
  });
}

function startWatching(): void {
  if (fileWatcher) return;

  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;

  const pluginWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(folders[0], 'ts/plugins/**/*.ts')
  );
  const typingsWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(folders[0], 'ts/typings/**/*.d.ts')
  );

  const onFileSaved = () => {
    if (!enabled) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runBuild(), BUILD_DEBOUNCE_MS);
  };

  const onFileDeleted = (uri: vscode.Uri) => {
    if (!enabled) return;
    // Clean up corresponding .js and .js.map when a .ts file is deleted.
    // tsconfig maps ts/plugins/X.ts → js/plugins/X.js (rootDir: ts, outDir: js).
    const root = folders[0].uri.fsPath;
    const rel = path.relative(path.join(root, 'ts'), uri.fsPath);
    if (rel.startsWith('..')) return; // safety: file is outside ts/
    const jsPath = path.join(root, 'js', rel.replace(/\.ts$/, '.js'));
    const mapPath = jsPath + '.map';
    try { if (fs.existsSync(jsPath)) fs.unlinkSync(jsPath); } catch { /* ignore */ }
    try { if (fs.existsSync(mapPath)) fs.unlinkSync(mapPath); } catch { /* ignore */ }
    onFileSaved();
  };

  pluginWatcher.onDidChange(onFileSaved);
  pluginWatcher.onDidCreate(onFileSaved);
  pluginWatcher.onDidDelete(onFileDeleted);
  typingsWatcher.onDidChange(onFileSaved);
  typingsWatcher.onDidCreate(onFileSaved);
  typingsWatcher.onDidDelete(onFileSaved);

  fileWatcher = pluginWatcher;
  fileWatchers = [pluginWatcher, typingsWatcher];
}

function stopWatching(): void {
  for (const w of fileWatchers) {
    w.dispose();
  }
  fileWatcher = null;
  fileWatchers = [];
  if (diagnosticCollection) {
    diagnosticCollection.clear();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('rmmz-tsc');
  context.subscriptions.push(diagnosticCollection);

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 49);
  statusBarItem.command = 'rmmz.toggleTypeScriptBuild';
  context.subscriptions.push(statusBarItem);
  updateStatusBar('off');

  // Toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.toggleTypeScriptBuild', () => {
      if (!requirePro('TypeScript Auto-Build')) return;
      enabled = !enabled;
      if (enabled) {
        startWatching();
        updateStatusBar('watching');
        // Run an initial build
        runBuild();
        vscode.window.showInformationMessage(t('typescript.buildEnabled'));
      } else {
        stopWatching();
        updateStatusBar('off');
        vscode.window.showInformationMessage(t('typescript.buildDisabled'));
      }
    })
  );

  // Cleanup
  context.subscriptions.push({
    dispose() {
      stopWatching();
      if (debounceTimer) clearTimeout(debounceTimer);
    },
  });
}
