import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Regex for direct prototype assignment:
 *   Something.prototype.methodName = function
 */
const DIRECT_ASSIGN_RE = /^[ \t]*(\w+)\.prototype\.(\w+)\s*=\s*function/;

/**
 * Regex for alias capture:
 *   const _alias = Something.prototype.methodName;
 */
const ALIAS_CAPTURE_RE =
  /^[ \t]*(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\.prototype\.(\w+)\s*;/;

/** A single override found in a plugin file. */
interface OverrideInfo {
  plugin: string;
  isAlias: boolean;
}

/**
 * Scans all plugin files in the workspace to build a map of
 * prototype method -> list of overriding plugins.
 */
function scanPluginOverrides(
  workspaceFolders: readonly vscode.WorkspaceFolder[]
): Map<string, OverrideInfo[]> {
  const overrideMap = new Map<string, OverrideInfo[]>();

  for (const folder of workspaceFolders) {
    const pluginsDir = path.join(folder.uri.fsPath, 'js', 'plugins');
    if (!fs.existsSync(pluginsDir)) continue;

    let files: string[];
    try {
      files = fs.readdirSync(pluginsDir)
        .filter(f => f.endsWith('.js'))
        .map(f => path.join(pluginsDir, f));
    } catch {
      continue;
    }

    for (const filePath of files) {
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      // Skip minified files
      const lines = content.split('\n');
      if (lines.length <= 1 && content.length > 500) continue;
      if (content.length / lines.length > 200) continue;

      const pluginName = path.basename(filePath, '.js');

      // Collect alias variables
      const aliasVars = new Map<string, string>();
      for (const line of lines) {
        const aliasMatch = line.match(ALIAS_CAPTURE_RE);
        if (aliasMatch) {
          const [, varName, className, methodName] = aliasMatch;
          aliasVars.set(varName, `${className}.prototype.${methodName}`);
        }
      }

      // Find direct assignments
      for (const line of lines) {
        const directMatch = line.match(DIRECT_ASSIGN_RE);
        if (!directMatch) continue;

        const [, className, methodName] = directMatch;
        const key = `${className}.prototype.${methodName}`;

        let isAlias = false;
        for (const [, target] of aliasVars) {
          if (target === key) {
            isAlias = true;
            break;
          }
        }

        let list = overrideMap.get(key);
        if (!list) {
          list = [];
          overrideMap.set(key, list);
        }
        list.push({ plugin: pluginName, isAlias });
      }
    }
  }

  return overrideMap;
}

class RmmzOverrideCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private overrideMap: Map<string, OverrideInfo[]> = new Map();

  /**
   * Refreshes the override map by rescanning workspace plugin files.
   */
  refresh(): void {
    const folders = vscode.workspace.workspaceFolders;
    if (folders) {
      this.overrideMap = scanPluginOverrides(folders);
    } else {
      this.overrideMap = new Map();
    }
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const currentPlugin = path.basename(document.fileName, '.js');

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      const match = lineText.match(DIRECT_ASSIGN_RE);
      if (!match) continue;

      const [, className, methodName] = match;
      const key = `${className}.prototype.${methodName}`;

      const overrides = this.overrideMap.get(key);
      if (!overrides || overrides.length < 2) continue;

      // Build the display text
      const otherPlugins = overrides
        .filter(o => o.plugin !== currentPlugin)
        .map(o => o.plugin);

      if (otherPlugins.length === 0) continue;

      const allAliased = overrides.every(o => o.isAlias);
      let title: string;

      if (allAliased) {
        const chain = overrides.map(o => o.plugin).join(' \u2192 ');
        title = `Alias chain: ${chain}`;
      } else {
        title = `Override: also modified by [${otherPlugins.join(', ')}]`;
      }

      const range = new vscode.Range(i, 0, i, lineText.length);
      const lens = new vscode.CodeLens(range, {
        title,
        command: 'rmmz.showConflicts',
        tooltip: 'Show full conflict report',
      });
      lenses.push(lens);
    }

    return lenses;
  }
}

/**
 * Activates the CodeLens provider for prototype override detection.
 */
export function activate(context: vscode.ExtensionContext): void {
  const provider = new RmmzOverrideCodeLensProvider();

  // Initial scan
  provider.refresh();

  const selector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, provider)
  );

  // Refresh when plugin files change
  const watcher = vscode.workspace.createFileSystemWatcher('**/js/plugins/*.js');
  const onFileChange = () => { provider.refresh(); };
  watcher.onDidChange(onFileChange);
  watcher.onDidCreate(onFileChange);
  watcher.onDidDelete(onFileChange);
  context.subscriptions.push(watcher);
}
