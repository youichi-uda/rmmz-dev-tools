import * as vscode from 'vscode';
import { isProLicensed } from '../license/gumroad';

/**
 * Provides rename support for @param and @arg names in RMMZ plugin
 * annotation blocks.  On rename it updates:
 *   1. The @param / @arg tag value itself
 *   2. Any @parent references to that name in the same block
 *   3. Corresponding parameters["paramName"] strings in the JS code
 *      below the annotation block
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Match `@param paramName` or `@arg argName`, capturing the name. */
const PARAM_TAG_RE = /^\s*\*?\s*@(param|arg)\s+(\S+)/;

/** Match `@parent parentName`, capturing the name. */
const PARENT_TAG_RE = /^\s*\*?\s*@parent\s+(\S+)/;

interface AnnotationBlock {
  startLine: number;
  endLine: number;
}

/**
 * Find all annotation blocks (`/*: ... *​/` or `/*~struct~ ... *​/`) in
 * the document.
 */
function findAnnotationBlocks(document: vscode.TextDocument): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  let inBlock = false;
  let blockStart = 0;

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;

    if (!inBlock) {
      if (line.includes('/*:') || line.includes('/*~struct~')) {
        inBlock = true;
        blockStart = i;
      }
    }

    if (inBlock && line.includes('*/')) {
      blocks.push({ startLine: blockStart, endLine: i });
      inBlock = false;
    }
  }

  return blocks;
}

/**
 * Determine if `position` sits on a @param or @arg name token and return
 * the name, its range, and the enclosing block.
 */
function getParamAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): { name: string; range: vscode.Range; block: AnnotationBlock } | undefined {
  const blocks = findAnnotationBlocks(document);
  const block = blocks.find(
    b => position.line >= b.startLine && position.line <= b.endLine
  );
  if (!block) return undefined;

  const lineText = document.lineAt(position.line).text;
  const match = lineText.match(PARAM_TAG_RE);
  if (!match) return undefined;

  const name = match[2];
  const nameStart = lineText.indexOf(name, lineText.indexOf(`@${match[1]}`) + match[1].length + 1);
  const nameEnd = nameStart + name.length;

  if (position.character < nameStart || position.character > nameEnd) {
    return undefined;
  }

  return {
    name,
    range: new vscode.Range(position.line, nameStart, position.line, nameEnd),
    block,
  };
}

// ---------------------------------------------------------------------------
// RenameProvider
// ---------------------------------------------------------------------------

export class RmmzParamRenameProvider implements vscode.RenameProvider {
  /**
   * Validate that the cursor is on a renameable position.
   */
  prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
    const info = getParamAtPosition(document, position);
    if (!info) {
      throw new Error('Cannot rename here — cursor must be on a @param or @arg name.');
    }
    return { range: info.range, placeholder: info.name };
  }

  /**
   * Compute all edits for the rename.
   */
  provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.WorkspaceEdit> {
    if (!isProLicensed()) return null;

    const info = getParamAtPosition(document, position);
    if (!info) return undefined;

    const oldName = info.name;
    if (oldName === newName) return undefined;

    const edit = new vscode.WorkspaceEdit();

    // 1. Replace @param/@arg tag value itself
    edit.replace(document.uri, info.range, newName);

    // 2. Replace any @parent references in the same annotation block
    for (let i = info.block.startLine; i <= info.block.endLine; i++) {
      if (i === info.range.start.line) continue; // skip the line we already changed
      const lineText = document.lineAt(i).text;
      const parentMatch = lineText.match(PARENT_TAG_RE);
      if (parentMatch && parentMatch[1] === oldName) {
        const parentNameStart = lineText.indexOf(
          oldName,
          lineText.indexOf('@parent') + '@parent'.length
        );
        if (parentNameStart >= 0) {
          edit.replace(
            document.uri,
            new vscode.Range(i, parentNameStart, i, parentNameStart + oldName.length),
            newName
          );
        }
      }
    }

    // 3. Replace parameters["paramName"] in code below the annotation block
    //    We search from after the block end to the end of the document (or
    //    until the next annotation block).
    const blocks = findAnnotationBlocks(document);
    const currentBlockIdx = blocks.findIndex(
      b => b.startLine === info.block.startLine
    );
    const searchEnd = currentBlockIdx < blocks.length - 1
      ? blocks[currentBlockIdx + 1].startLine
      : document.lineCount;

    // Patterns: parameters["name"], parameters['name'], parameters.name
    const escOld = escapeRegExp(oldName);
    const parameterPatterns = [
      new RegExp(`parameters\\["${escOld}"\\]`, 'g'),
      new RegExp(`parameters\\['${escOld}'\\]`, 'g'),
      new RegExp(`parameters\\.${escOld}(?![\\w$])`, 'g'),
    ];

    for (let i = info.block.endLine + 1; i < searchEnd; i++) {
      const lineText = document.lineAt(i).text;
      for (const pattern of parameterPatterns) {
        pattern.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(lineText)) !== null) {
          // Find the old name within the match and replace just that
          const matchText = m[0];
          const nameIdx = matchText.indexOf(oldName);
          const absStart = m.index + nameIdx;
          edit.replace(
            document.uri,
            new vscode.Range(i, absStart, i, absStart + oldName.length),
            newName
          );
        }
      }
    }

    return edit;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the parameter rename provider for JS/TS files.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerRenameProvider(selector, new RmmzParamRenameProvider())
  );
}
