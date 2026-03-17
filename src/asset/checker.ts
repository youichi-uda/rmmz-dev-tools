import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../i18n';

/**
 * Scans plugin annotation blocks for @dir and @require 1 tags and
 * cross-references them against actual project directories and files.
 */

interface DirParam {
  /** Line number of the @dir tag */
  line: number;
  /** The directory path value (e.g. "img/pictures/") */
  dir: string;
  /** If @type file + @default exists, the default filename */
  defaultFile?: string;
  /** Line number of the @default tag */
  defaultLine?: number;
}

/**
 * Finds all @dir references within annotation blocks in a document,
 * along with any associated @default values for @type file parameters.
 */
function findDirReferences(document: vscode.TextDocument): DirParam[] {
  const results: DirParam[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  let inBlock = false;
  let isFileType = false;
  let currentDir: DirParam | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inBlock) {
      if (line.includes('/*:') || line.includes('/*~struct~')) {
        inBlock = true;
        isFileType = false;
        currentDir = undefined;
      }
      continue;
    }

    if (line.includes('*/')) {
      // Flush any pending dir
      if (currentDir) {
        results.push(currentDir);
        currentDir = undefined;
      }
      inBlock = false;
      isFileType = false;
      continue;
    }

    const tagMatch = line.match(/^\s*\*?\s*@(\w+)\s*(.*)/);
    if (!tagMatch) continue;

    const tag = tagMatch[1];
    const value = tagMatch[2].trim();

    // Track scope resets
    if (tag === 'param' || tag === 'arg' || tag === 'command') {
      if (currentDir) {
        results.push(currentDir);
        currentDir = undefined;
      }
      isFileType = false;
    }

    if (tag === 'type') {
      const baseType = value.replace(/\[\]$/, '');
      isFileType = baseType === 'file';
    }

    if (tag === 'dir') {
      if (currentDir) {
        results.push(currentDir);
      }
      currentDir = { line: i, dir: value };
    }

    if (tag === 'default' && currentDir && isFileType && value) {
      currentDir.defaultFile = value;
      currentDir.defaultLine = i;
    }
  }

  if (currentDir) {
    results.push(currentDir);
  }

  return results;
}

/**
 * Resolves the project root (first workspace folder with a data/ directory).
 */
function findProjectRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return undefined;
  for (const folder of folders) {
    const dataDir = path.join(folder.uri.fsPath, 'data');
    if (fs.existsSync(dataDir)) {
      return folder.uri.fsPath;
    }
  }
  // Fall back to first workspace folder
  return folders[0]?.uri.fsPath;
}

/**
 * Runs the asset reference check across all JS/TS files in the workspace.
 */
async function checkAssets(
  diagnosticCollection: vscode.DiagnosticCollection,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    vscode.window.showWarningMessage(t('asset.noProject'));
    return;
  }

  outputChannel.clear();
  outputChannel.appendLine(t('asset.header'));
  outputChannel.appendLine(t('asset.projectRoot', projectRoot));
  outputChannel.appendLine('');

  diagnosticCollection.clear();

  const files = await vscode.workspace.findFiles(
    '**/*.{js,ts}',
    '**/node_modules/**'
  );

  let totalWarnings = 0;
  const diagnosticMap = new Map<string, vscode.Diagnostic[]>();

  for (const fileUri of files) {
    let document: vscode.TextDocument;
    try {
      document = await vscode.workspace.openTextDocument(fileUri);
    } catch {
      continue;
    }

    const dirRefs = findDirReferences(document);
    if (dirRefs.length === 0) continue;

    const fileDiags: vscode.Diagnostic[] = [];

    for (const ref of dirRefs) {
      // Check directory existence
      const dirPath = ref.dir.endsWith('/')
        ? ref.dir.slice(0, -1)
        : ref.dir;
      const fullDirPath = path.join(projectRoot, dirPath);

      if (!fs.existsSync(fullDirPath)) {
        const lineText = document.lineAt(ref.line).text;
        const dirStart = lineText.indexOf(ref.dir);
        const range = dirStart >= 0
          ? new vscode.Range(ref.line, dirStart, ref.line, dirStart + ref.dir.length)
          : new vscode.Range(ref.line, 0, ref.line, lineText.length);

        const diag = new vscode.Diagnostic(
          range,
          t('asset.missingDir', ref.dir, fullDirPath),
          vscode.DiagnosticSeverity.Warning
        );
        diag.source = 'rmmz-assets';
        fileDiags.push(diag);

        outputChannel.appendLine(
          `[WARN] ${path.basename(fileUri.fsPath)}:${ref.line + 1} - ${t('asset.missingDirShort', ref.dir)}`
        );
        totalWarnings++;
      }

      // Check default file existence
      if (ref.defaultFile && ref.defaultLine !== undefined) {
        // RMMZ file params don't include the extension in the default value,
        // so we check if any file with that base name exists in the dir.
        const fullDirForDefault = path.join(projectRoot, dirPath);
        let defaultExists = false;

        if (fs.existsSync(fullDirForDefault)) {
          try {
            const entries = fs.readdirSync(fullDirForDefault);
            defaultExists = entries.some(entry => {
              const baseName = path.parse(entry).name;
              return baseName === ref.defaultFile;
            });
          } catch {
            // directory unreadable
          }
        }

        if (!defaultExists) {
          const lineText = document.lineAt(ref.defaultLine).text;
          const valStart = lineText.indexOf(ref.defaultFile);
          const range = valStart >= 0
            ? new vscode.Range(ref.defaultLine, valStart, ref.defaultLine, valStart + ref.defaultFile.length)
            : new vscode.Range(ref.defaultLine, 0, ref.defaultLine, lineText.length);

          const diag = new vscode.Diagnostic(
            range,
            t('asset.missingFile', ref.defaultFile, ref.dir),
            vscode.DiagnosticSeverity.Warning
          );
          diag.source = 'rmmz-assets';
          fileDiags.push(diag);

          outputChannel.appendLine(
            `[WARN] ${path.basename(fileUri.fsPath)}:${ref.defaultLine + 1} - ${t('asset.missingFile', ref.defaultFile, ref.dir)}`
          );
          totalWarnings++;
        }
      }
    }

    if (fileDiags.length > 0) {
      diagnosticMap.set(fileUri.toString(), fileDiags);
      diagnosticCollection.set(fileUri, fileDiags);
    }
  }

  outputChannel.appendLine('');
  outputChannel.appendLine(t('asset.complete', totalWarnings));
  outputChannel.show(true);
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the asset reference checker command.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rmmz-assets');
  context.subscriptions.push(diagnosticCollection);

  const outputChannel = vscode.window.createOutputChannel('RMMZ Assets');
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.checkAssets', () => {
      return checkAssets(diagnosticCollection, outputChannel);
    })
  );
}
