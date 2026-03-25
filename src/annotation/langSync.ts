import * as vscode from 'vscode';
import { isProLicensed } from '../license/gumroad';
import { t } from '../i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnotationBlock {
  startLine: number;
  endLine: number;
  locale: string; // '' for primary /*:, 'ja' for /*:ja, etc.
  isStruct: boolean;
}

interface StructuralElement {
  tag: string; // 'param', 'command', 'arg'
  name: string;
  line: number;
}

interface BlockStructure {
  locale: string;
  startLine: number;
  params: StructuralElement[];
  commands: StructuralElement[];
  /** Map of command name -> list of arg elements */
  argsByCommand: Map<string, StructuralElement[]>;
}

// ---------------------------------------------------------------------------
// Block finding
// ---------------------------------------------------------------------------

/**
 * Finds all RMMZ annotation blocks in a document, including locale variants.
 * Skips `/*~struct~` blocks.
 */
function findAnnotationBlocks(document: vscode.TextDocument): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  let inBlock = false;
  let blockStart = 0;
  let locale = '';
  let isStruct = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inBlock) {
      // Check for struct blocks (skip them)
      if (line.includes('/*~struct~')) {
        inBlock = true;
        blockStart = i;
        isStruct = true;
        locale = '';
      } else if (line.includes('/*:')) {
        const idx = line.indexOf('/*:');
        const after = line.substring(idx + 3);
        // Extract locale suffix: /*:ja, /*:ko, etc.
        const localeMatch = after.match(/^([a-zA-Z]{2,})/);
        inBlock = true;
        blockStart = i;
        isStruct = false;
        locale = localeMatch ? localeMatch[1] : '';
      }
    }

    if (inBlock && line.includes('*/')) {
      blocks.push({ startLine: blockStart, endLine: i, isStruct, locale });
      inBlock = false;
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Structure extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the structural elements (params, commands, args) from an
 * annotation block. Only captures names, not text content.
 */
function extractStructure(
  document: vscode.TextDocument,
  block: AnnotationBlock
): BlockStructure {
  const params: StructuralElement[] = [];
  const commands: StructuralElement[] = [];
  const argsByCommand = new Map<string, StructuralElement[]>();

  let currentCommand: string | undefined;

  for (let i = block.startLine; i <= block.endLine; i++) {
    const lineText = document.lineAt(i).text;
    const tagMatch = lineText.match(/^\s*\*?\s*@(\w+)\s*(.*?)?\s*$/);
    if (!tagMatch) continue;

    const tag = tagMatch[1];
    const rest = (tagMatch[2] ?? '').trim();

    if (tag === 'param') {
      params.push({ tag: 'param', name: rest, line: i });
    } else if (tag === 'command') {
      currentCommand = rest;
      commands.push({ tag: 'command', name: rest, line: i });
      if (!argsByCommand.has(rest)) {
        argsByCommand.set(rest, []);
      }
    } else if (tag === 'arg') {
      if (currentCommand !== undefined) {
        let args = argsByCommand.get(currentCommand);
        if (!args) {
          args = [];
          argsByCommand.set(currentCommand, args);
        }
        args.push({ tag: 'arg', name: rest, line: i });
      }
    }
  }

  return {
    locale: block.locale,
    startLine: block.startLine,
    params,
    commands,
    argsByCommand,
  };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function compareStructures(
  primary: BlockStructure,
  localeBlock: BlockStructure,
  diagnostics: vscode.Diagnostic[]
): void {
  const localeLabel = localeBlock.locale || 'primary';

  // Compare params
  const primaryParamNames = primary.params.map(p => p.name);
  const localeParamNames = localeBlock.params.map(p => p.name);

  // Missing params in locale block
  for (const p of primary.params) {
    if (!localeParamNames.includes(p.name)) {
      const range = new vscode.Range(localeBlock.startLine, 0, localeBlock.startLine, 10);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          t('langSync.missingParam', localeBlock.locale, p.name),
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  // Extra params in locale block not in primary
  for (const p of localeBlock.params) {
    if (!primaryParamNames.includes(p.name)) {
      const range = new vscode.Range(p.line, 0, p.line, 999);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          t('langSync.extraParam', p.name, localeBlock.locale),
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  // Order differences for params
  const commonParams = primaryParamNames.filter(n => localeParamNames.includes(n));
  const localeCommonParams = localeParamNames.filter(n => primaryParamNames.includes(n));
  if (commonParams.length > 1 && commonParams.join(',') !== localeCommonParams.join(',')) {
    const range = new vscode.Range(localeBlock.startLine, 0, localeBlock.startLine, 10);
    diagnostics.push(
      new vscode.Diagnostic(
        range,
        t('langSync.paramOrder', localeBlock.locale),
        vscode.DiagnosticSeverity.Information
      )
    );
  }

  // Compare commands
  const primaryCmdNames = primary.commands.map(c => c.name);
  const localeCmdNames = localeBlock.commands.map(c => c.name);

  for (const c of primary.commands) {
    if (!localeCmdNames.includes(c.name)) {
      const range = new vscode.Range(localeBlock.startLine, 0, localeBlock.startLine, 10);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          t('langSync.missingCommand', localeBlock.locale, c.name),
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  for (const c of localeBlock.commands) {
    if (!primaryCmdNames.includes(c.name)) {
      const range = new vscode.Range(c.line, 0, c.line, 999);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          t('langSync.extraCommand', c.name, localeBlock.locale),
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  // Compare args per command
  for (const cmdName of primaryCmdNames) {
    if (!localeCmdNames.includes(cmdName)) continue;

    const primaryArgs = primary.argsByCommand.get(cmdName) ?? [];
    const localeArgs = localeBlock.argsByCommand.get(cmdName) ?? [];
    const primaryArgNames = primaryArgs.map(a => a.name);
    const localeArgNames = localeArgs.map(a => a.name);

    for (const a of primaryArgs) {
      if (!localeArgNames.includes(a.name)) {
        // Find the command line in locale block for context
        const cmdLine = localeBlock.commands.find(c => c.name === cmdName);
        const line = cmdLine ? cmdLine.line : localeBlock.startLine;
        const range = new vscode.Range(line, 0, line, 999);
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            t('langSync.missingArg', cmdName, localeBlock.locale, a.name),
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    for (const a of localeArgs) {
      if (!primaryArgNames.includes(a.name)) {
        const range = new vscode.Range(a.line, 0, a.line, 999);
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            t('langSync.extraArg', a.name, localeBlock.locale, cmdName),
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    // Order check for args
    const commonArgs = primaryArgNames.filter(n => localeArgNames.includes(n));
    const localeCommonArgs = localeArgNames.filter(n => primaryArgNames.includes(n));
    if (commonArgs.length > 1 && commonArgs.join(',') !== localeCommonArgs.join(',')) {
      const cmdLine = localeBlock.commands.find(c => c.name === cmdName);
      const line = cmdLine ? cmdLine.line : localeBlock.startLine;
      const range = new vscode.Range(line, 0, line, 999);
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          t('langSync.argOrder', cmdName, localeBlock.locale),
          vscode.DiagnosticSeverity.Information
        )
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Document validation
// ---------------------------------------------------------------------------

function validateDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const blocks = findAnnotationBlocks(document);

  // Filter out struct blocks
  const annotationBlocks = blocks.filter(b => !b.isStruct);
  if (annotationBlocks.length < 2) return diagnostics;

  // The first /*: (locale === '') is the primary block
  const primary = annotationBlocks.find(b => b.locale === '');
  if (!primary) return diagnostics;

  const primaryStructure = extractStructure(document, primary);

  // Compare each locale block against the primary
  for (const block of annotationBlocks) {
    if (block === primary) continue;
    const localeStructure = extractStructure(document, block);
    compareStructures(primaryStructure, localeStructure, diagnostics);
  }

  return diagnostics;
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the lang-sync diagnostic collection and validation listeners.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): vscode.DiagnosticCollection {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rmmz-lang-sync');
  context.subscriptions.push(diagnosticCollection);

  const validate = (document: vscode.TextDocument) => {
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript') return;
    if (!isProLicensed()) {
      diagnosticCollection.delete(document.uri);
      return;
    }
    const diagnostics = validateDocument(document);
    diagnosticCollection.set(document.uri, diagnostics);
  };

  // Validate all open documents
  vscode.workspace.textDocuments.forEach(validate);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validate),
    vscode.workspace.onDidChangeTextDocument(e => validate(e.document)),
    vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri))
  );

  return diagnosticCollection;
}
