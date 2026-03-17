import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../i18n';

/** A single override of a prototype method found in a plugin file. */
interface OverrideEntry {
  plugin: string;
  filePath: string;
  line: number;
  isAlias: boolean;
}

/** Conflict detection result for a single prototype method. */
interface ConflictResult {
  method: string;
  overrides: OverrideEntry[];
  hasConflict: boolean;
}

// Regex for direct prototype assignment:
//   Something.prototype.methodName = function
const DIRECT_ASSIGN_RE =
  /^[ \t]*(\w+)\.prototype\.(\w+)\s*=\s*function/;

// Regex for alias capture:
//   const _alias = Something.prototype.methodName;
//   var _alias = Something.prototype.methodName;
//   let _alias = Something.prototype.methodName;
const ALIAS_CAPTURE_RE =
  /^[ \t]*(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\.prototype\.(\w+)\s*;/;

/**
 * Returns true if a file looks minified or obfuscated.
 *
 * Heuristic: average line length > 200, or the file has very few
 * newlines relative to its total size (< 1 newline per 500 bytes).
 */
function isMinified(content: string): boolean {
  if (content.length === 0) return false;

  const lines = content.split('\n');
  const lineCount = lines.length;

  if (lineCount <= 1 && content.length > 500) return true;

  const avgLineLength = content.length / lineCount;
  if (avgLineLength > 200) return true;

  const newlineRatio = content.length / lineCount;
  if (newlineRatio > 500) return true;

  return false;
}

/**
 * Scans a single plugin file for prototype overrides.
 * Returns a map of `ClassName.prototype.methodName` -> OverrideEntry.
 */
function scanFile(
  filePath: string,
  content: string
): Map<string, OverrideEntry> {
  const results = new Map<string, OverrideEntry>();
  const pluginName = path.basename(filePath, '.js');
  const lines = content.split('\n');

  // First pass: collect all alias captures so we know which
  // variable names correspond to which prototype methods.
  const aliasVars = new Map<string, string>(); // varName -> ClassName.prototype.method
  for (const line of lines) {
    const aliasMatch = line.match(ALIAS_CAPTURE_RE);
    if (aliasMatch) {
      const [, varName, className, methodName] = aliasMatch;
      aliasVars.set(varName, `${className}.prototype.${methodName}`);
    }
  }

  // Second pass: find direct assignments.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const directMatch = line.match(DIRECT_ASSIGN_RE);
    if (!directMatch) continue;

    const [, className, methodName] = directMatch;
    const key = `${className}.prototype.${methodName}`;

    // Check if there is an alias variable pointing to this exact method.
    // The alias capture would typically appear before the assignment.
    let isAlias = false;
    for (const [, target] of aliasVars) {
      if (target === key) {
        isAlias = true;
        break;
      }
    }

    results.set(key, {
      plugin: pluginName,
      filePath,
      line: i + 1, // 1-based
      isAlias,
    });
  }

  return results;
}

/**
 * Detects prototype override conflicts across plugins in a workspace.
 */
export class ConflictDetector {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private results: ConflictResult[] = [];

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('rmmz-conflicts');
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * Scans all .js files in `js/plugins/` of the given workspace folder.
   * Returns conflict results for methods overridden by multiple plugins.
   */
  async scan(workspaceFolder: vscode.WorkspaceFolder): Promise<ConflictResult[]> {
    const pluginsDir = path.join(workspaceFolder.uri.fsPath, 'js', 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      this.results = [];
      this.diagnosticCollection.clear();
      return [];
    }

    const files = fs.readdirSync(pluginsDir)
      .filter(f => f.endsWith('.js'))
      .map(f => path.join(pluginsDir, f));

    // method -> list of overrides across all plugins
    const overrideMap = new Map<string, OverrideEntry[]>();

    for (const filePath of files) {
      let content: string;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      if (isMinified(content)) continue;

      const fileOverrides = scanFile(filePath, content);
      for (const [method, entry] of fileOverrides) {
        let list = overrideMap.get(method);
        if (!list) {
          list = [];
          overrideMap.set(method, list);
        }
        list.push(entry);
      }
    }

    // Build results for methods with multiple overrides
    this.results = [];
    for (const [method, overrides] of overrideMap) {
      if (overrides.length < 2) continue;

      const allAliased = overrides.every(o => o.isAlias);
      this.results.push({
        method,
        overrides,
        hasConflict: !allAliased,
      });
    }

    this.updateDiagnostics();
    return this.results;
  }

  /**
   * Returns VS Code diagnostics for the most recent scan.
   */
  getDiagnostics(): vscode.Diagnostic[] {
    const all: vscode.Diagnostic[] = [];
    for (const result of this.results) {
      for (const override of result.overrides) {
        all.push(this.buildDiagnostic(result, override));
      }
    }
    return all;
  }

  /**
   * Returns the results from the most recent scan.
   */
  getResults(): ConflictResult[] {
    return this.results;
  }

  private buildDiagnostic(result: ConflictResult, override: OverrideEntry): vscode.Diagnostic {
    const line = Math.max(0, override.line - 1); // 0-based for VS Code
    const range = new vscode.Range(line, 0, line, 200);

    const otherPlugins = result.overrides
      .filter(o => o.plugin !== override.plugin)
      .map(o => o.plugin)
      .join(', ');

    if (result.hasConflict) {
      const message = override.isAlias
        ? t('conflict.overrideWithAlias', result.method, otherPlugins)
        : t('conflict.overrideNoAlias', result.method, otherPlugins);
      return new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
    }

    // All plugins use alias — informational only
    const chain = result.overrides.map(o => o.plugin).join(' -> ');
    const message = t('conflict.aliasChain', result.method, chain);
    return new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Information);
  }

  private updateDiagnostics(): void {
    this.diagnosticCollection.clear();

    // Group diagnostics by file URI
    const byFile = new Map<string, vscode.Diagnostic[]>();

    for (const result of this.results) {
      for (const override of result.overrides) {
        const uri = vscode.Uri.file(override.filePath).toString();
        let list = byFile.get(uri);
        if (!list) {
          list = [];
          byFile.set(uri, list);
        }
        list.push(this.buildDiagnostic(result, override));
      }
    }

    for (const [uriStr, diagnostics] of byFile) {
      this.diagnosticCollection.set(vscode.Uri.parse(uriStr), diagnostics);
    }
  }
}

/**
 * Formats scan results for display in an output channel.
 */
function formatResults(results: ConflictResult[]): string {
  if (results.length === 0) {
    return t('conflict.noConflicts');
  }

  const lines: string[] = [];
  const conflicts = results.filter(r => r.hasConflict);
  const chains = results.filter(r => !r.hasConflict);

  if (conflicts.length > 0) {
    lines.push(t('conflict.conflictsHeader', conflicts.length));
    lines.push('');
    for (const result of conflicts) {
      lines.push(`  ${result.method}`);
      for (const o of result.overrides) {
        const tag = o.isAlias ? '(alias)' : '(NO ALIAS)';
        lines.push(`    - ${o.plugin} line ${o.line} ${tag}`);
      }
      lines.push('');
    }
  }

  if (chains.length > 0) {
    lines.push(t('conflict.chainsHeader', chains.length));
    lines.push('');
    for (const result of chains) {
      const chain = result.overrides.map(o => o.plugin).join(' -> ');
      lines.push(`  ${result.method}: ${chain}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Activates the conflict detector feature.
 */
export function activate(context: vscode.ExtensionContext): void {
  const detector = new ConflictDetector();
  context.subscriptions.push({ dispose: () => detector.dispose() });

  const outputChannel = vscode.window.createOutputChannel('RMMZ Conflicts');
  context.subscriptions.push(outputChannel);

  // Scan helper
  const runScan = async () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    const allResults: ConflictResult[] = [];
    for (const folder of folders) {
      const results = await detector.scan(folder);
      allResults.push(...results);
    }

    return allResults;
  };

  // Run on activation
  runScan();

  // Watch for file changes in js/plugins/
  const watcher = vscode.workspace.createFileSystemWatcher('**/js/plugins/*.js');
  const onFileChange = () => { runScan(); };
  watcher.onDidChange(onFileChange);
  watcher.onDidCreate(onFileChange);
  watcher.onDidDelete(onFileChange);
  context.subscriptions.push(watcher);

  // Register the show-conflicts command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.showConflicts', async () => {
      const results = await runScan();
      outputChannel.clear();
      outputChannel.appendLine(formatResults(results || []));
      outputChannel.show(true);
    })
  );
}
