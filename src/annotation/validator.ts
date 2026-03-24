import * as vscode from 'vscode';
import { t } from '../i18n';
import {
  TOP_LEVEL_TAGS,
  PARAM_TAGS,
  COMMAND_TAGS,
  ARG_TAGS,
  TYPE_VALUES,
  TYPE_SPECIFIC_TAGS,
} from './tags';

const ALL_KNOWN_TAGS = new Set([
  ...TOP_LEVEL_TAGS,
  ...PARAM_TAGS,
  ...COMMAND_TAGS,
  ...ARG_TAGS,
  'arg',
]);

interface AnnotationBlock {
  startLine: number;
  endLine: number;
  isStruct: boolean;
}

/**
 * Finds all RMMZ annotation blocks in a document.
 */
function findAnnotationBlocks(document: vscode.TextDocument): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  let inBlock = false;
  let blockStart = 0;
  let isStruct = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inBlock) {
      if (line.includes('/*:') || line.includes('/*~struct~')) {
        inBlock = true;
        blockStart = i;
        isStruct = line.includes('/*~struct~');
      }
    }

    if (inBlock && line.includes('*/')) {
      blocks.push({ startLine: blockStart, endLine: i, isStruct });
      inBlock = false;
    }
  }

  return blocks;
}

type Scope = 'top' | 'param' | 'command' | 'arg';

/**
 * Validates RMMZ annotation blocks and returns diagnostics.
 */
export function validateDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const blocks = findAnnotationBlocks(document);

  for (const block of blocks) {
    validateBlock(document, block, diagnostics);
  }

  return diagnostics;
}

function validateBlock(
  document: vscode.TextDocument,
  block: AnnotationBlock,
  diagnostics: vscode.Diagnostic[]
): void {
  let scope: Scope = 'top';
  let currentType: string | undefined;
  let hasTarget = false;
  let hasPlugindesc = false;

  for (let i = block.startLine; i <= block.endLine; i++) {
    const lineText = document.lineAt(i).text;
    const tagMatch = lineText.match(/^\s*\*?\s*@(\w+)/);

    if (!tagMatch) continue;

    const tag = tagMatch[1];
    const tagStart = lineText.indexOf(`@${tag}`);
    const range = new vscode.Range(i, tagStart, i, tagStart + tag.length + 1);

    // Track scope changes
    if (tag === 'param') {
      scope = 'param';
      currentType = undefined;
    } else if (tag === 'command') {
      scope = 'command';
      currentType = undefined;
    } else if (tag === 'arg') {
      scope = 'arg';
      currentType = undefined;
    } else if ((TOP_LEVEL_TAGS as readonly string[]).includes(tag)) {
      scope = 'top';
      currentType = undefined;
    }

    // Track special tags
    if (tag === 'target') hasTarget = true;
    if (tag === 'plugindesc') hasPlugindesc = true;

    // Track current @type
    if (tag === 'type') {
      const typeValue = lineText.match(/@type\s+(.+)/)?.[1]?.trim();
      if (typeValue) {
        currentType = typeValue.replace(/(\[\])+$/, ''); // strip array suffix (including multi-dimensional)
        // Validate type value
        if (!isValidType(currentType)) {
          const typeStart = lineText.indexOf(typeValue, tagStart);
          const typeRange = new vscode.Range(i, typeStart, i, typeStart + typeValue.length);
          diagnostics.push(
            new vscode.Diagnostic(typeRange, t('validator.unknownType', typeValue), vscode.DiagnosticSeverity.Warning)
          );
        }
      }
    }

    // Check unknown tags
    if (!ALL_KNOWN_TAGS.has(tag)) {
      // Skip separator lines (@ followed by dashes)
      if (!/^-+$/.test(tag)) {
        diagnostics.push(
          new vscode.Diagnostic(range, t('validator.unknownTag', tag), vscode.DiagnosticSeverity.Warning)
        );
      }
      continue;
    }

    // Validate tag is valid in current scope
    if (!block.isStruct) {
      validateTagInScope(tag, scope, currentType, range, diagnostics);
    }
  }

  // Check required tags in non-struct plugin blocks
  if (!block.isStruct) {
    if (!hasTarget) {
      const range = new vscode.Range(block.startLine, 0, block.startLine, 10);
      diagnostics.push(
        new vscode.Diagnostic(range, t('validator.targetRecommended'), vscode.DiagnosticSeverity.Information)
      );
    }
    if (!hasPlugindesc) {
      const range = new vscode.Range(block.startLine, 0, block.startLine, 10);
      diagnostics.push(
        new vscode.Diagnostic(range, t('validator.plugindescRequired'), vscode.DiagnosticSeverity.Warning)
      );
    }
  }
}

function isValidType(type: string): boolean {
  // Check basic and database types
  if ((TYPE_VALUES as readonly string[]).includes(type)) return true;
  // Check struct<TypeName>
  if (/^struct<\w+>$/.test(type)) return true;
  return false;
}

function validateTagInScope(
  tag: string,
  scope: Scope,
  currentType: string | undefined,
  range: vscode.Range,
  diagnostics: vscode.Diagnostic[]
): void {
  const paramTags = new Set<string>(PARAM_TAGS);
  const commandTags = new Set<string>(COMMAND_TAGS);
  const topTags = new Set<string>(TOP_LEVEL_TAGS);

  // Tags that define scope are always valid
  if (tag === 'param' || tag === 'command' || tag === 'arg') return;

  switch (scope) {
    case 'param':
      if (!paramTags.has(tag)) {
        diagnostics.push(
          new vscode.Diagnostic(range, t('validator.notValidInParam', tag), vscode.DiagnosticSeverity.Warning)
        );
      }
      break;
    case 'command':
      if (!commandTags.has(tag) && tag !== 'arg') {
        diagnostics.push(
          new vscode.Diagnostic(range, t('validator.notValidInCommand', tag), vscode.DiagnosticSeverity.Warning)
        );
      }
      break;
    case 'arg':
      if (!paramTags.has(tag)) {
        diagnostics.push(
          new vscode.Diagnostic(range, t('validator.notValidInArg', tag), vscode.DiagnosticSeverity.Warning)
        );
      }
      break;
    case 'top':
      if (!topTags.has(tag)) {
        diagnostics.push(
          new vscode.Diagnostic(range, t('validator.notValidAtTop', tag), vscode.DiagnosticSeverity.Warning)
        );
      }
      break;
  }

  // Warn about type-specific tags used with wrong type
  if (scope === 'param' || scope === 'arg') {
    if (currentType) {
      const specificTags = TYPE_SPECIFIC_TAGS[currentType];
      const allSpecificTags = new Set(Object.values(TYPE_SPECIFIC_TAGS).flat());
      if (allSpecificTags.has(tag) && (!specificTags || !specificTags.includes(tag))) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            t('validator.typeHint', tag, getExpectedTypes(tag), currentType),
            vscode.DiagnosticSeverity.Hint
          )
        );
      }
    }
  }
}

function getExpectedTypes(tag: string): string {
  const types: string[] = [];
  for (const [type, tags] of Object.entries(TYPE_SPECIFIC_TAGS)) {
    if (tags.includes(tag)) types.push(type);
  }
  return types.join(' / ');
}

/**
 * Creates and manages a diagnostic collection for RMMZ annotations.
 */
export function createValidator(context: vscode.ExtensionContext): vscode.DiagnosticCollection {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rmmz');
  context.subscriptions.push(diagnosticCollection);

  // Validate on open and change
  const validate = (document: vscode.TextDocument) => {
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript') return;
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
