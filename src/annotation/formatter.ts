import * as vscode from 'vscode';
import { t } from '../i18n';


/**
 * Canonical order for top-level annotation tags.
 * Tags not in this list (like @param, @command) are placed between
 * the metadata tags and @help, preserving their original order.
 */
const TAG_ORDER: readonly string[] = [
  'target',
  'plugindesc',
  'author',
  'url',
  'base',
  'orderAfter',
  'orderBefore',
];

/** Tags that define block scopes (kept in original order). */
const BLOCK_TAGS = new Set(['param', 'command', 'arg']);

/** Tags that must appear at the very end. */
const TAIL_TAGS = new Set(['help']);

interface AnnotationLine {
  tag: string | null;
  value: string;
  raw: string;
}

/**
 * Finds the annotation block (/*: ... *​/) surrounding the cursor position.
 * Returns the start and end lines (inclusive), or null if not inside a block.
 */
function findAnnotationBlock(
  document: vscode.TextDocument,
  position: vscode.Position
): { start: number; end: number } | null {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Search backwards for block opener
  const textBefore = text.substring(0, offset);
  const pluginStart = textBefore.lastIndexOf('/*:');
  const structStart = textBefore.lastIndexOf('/*~struct~');
  const blockStartOffset = Math.max(pluginStart, structStart);

  if (blockStartOffset === -1) return null;

  // Find the closing */
  const closerOffset = text.indexOf('*/', blockStartOffset);
  if (closerOffset === -1) return null;

  // If the closer is before the cursor, we're not inside the block
  if (closerOffset < offset) return null;

  const startLine = document.positionAt(blockStartOffset).line;
  const endLine = document.positionAt(closerOffset).line;

  return { start: startLine, end: endLine };
}

/**
 * Parses annotation lines into structured entries.
 */
function parseAnnotationLines(lines: string[]): AnnotationLine[] {
  const result: AnnotationLine[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*?\s*/, '');
    const tagMatch = trimmed.match(/^@(\w+)\s*(.*)/);

    if (tagMatch) {
      result.push({
        tag: tagMatch[1],
        value: tagMatch[2].trimEnd(),
        raw: line,
      });
    } else {
      result.push({
        tag: null,
        value: trimmed,
        raw: line,
      });
    }
  }

  return result;
}

/**
 * Represents a group of annotation lines: a tag line plus its continuation lines.
 */
interface TagGroup {
  tag: string | null;
  lines: AnnotationLine[];
}

/**
 * Groups parsed lines into tag groups. Each group starts with a tagged line
 * and includes following untagged continuation lines.
 */
function groupByTag(parsed: AnnotationLine[]): TagGroup[] {
  const groups: TagGroup[] = [];
  let current: TagGroup | null = null;

  for (const entry of parsed) {
    if (entry.tag !== null) {
      current = { tag: entry.tag, lines: [entry] };
      groups.push(current);
    } else if (current) {
      current.lines.push(entry);
    } else {
      // Standalone line before any tag (e.g., blank line at top)
      groups.push({ tag: null, lines: [entry] });
    }
  }

  return groups;
}

/**
 * Sorts tag groups into canonical order:
 * 1. Metadata tags (in TAG_ORDER order)
 * 2. Block tags (@param, @command) in original order
 * 3. @help at the end
 */
function sortGroups(groups: TagGroup[]): TagGroup[] {
  const metadata: TagGroup[] = [];
  const blocks: TagGroup[] = [];
  const tail: TagGroup[] = [];
  const leading: TagGroup[] = []; // lines before any tag

  for (const group of groups) {
    if (group.tag === null) {
      leading.push(group);
    } else if (TAIL_TAGS.has(group.tag)) {
      tail.push(group);
    } else if (BLOCK_TAGS.has(group.tag) || !TAG_ORDER.includes(group.tag)) {
      // Block tags and unknown tags go in the middle, preserving order
      blocks.push(group);
    } else {
      metadata.push(group);
    }
  }

  // Sort metadata by canonical order
  metadata.sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a.tag!);
    const bi = TAG_ORDER.indexOf(b.tag!);
    return ai - bi;
  });

  return [...leading, ...metadata, ...blocks, ...tail];
}

/**
 * Formats a single tag group back into annotation text.
 */
function formatGroup(group: TagGroup): string[] {
  const result: string[] = [];

  for (const entry of group.lines) {
    if (entry.tag !== null) {
      const value = entry.value ? ` ${entry.value}` : '';
      result.push(` * @${entry.tag}${value}`);
    } else {
      // Continuation line
      const value = entry.value;
      if (value === '') {
        result.push(' *');
      } else {
        result.push(` * ${value}`);
      }
    }
  }

  return result;
}

/**
 * Formats the annotation block surrounding the cursor.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.formatAnnotation', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      const position = editor.selection.active;

      const block = findAnnotationBlock(document, position);
      if (!block) {
        vscode.window.showInformationMessage(
          t('formatter.notInBlock')
        );
        return;
      }

      const { start, end } = block;

      // Extract the opening and closing lines
      const openingLine = document.lineAt(start).text;
      const closingLine = document.lineAt(end).text;

      // Extract content lines (between opening and closing)
      const contentLines: string[] = [];
      for (let i = start + 1; i < end; i++) {
        contentLines.push(document.lineAt(i).text);
      }

      // Parse, group, sort, and format
      const parsed = parseAnnotationLines(contentLines);
      const groups = groupByTag(parsed);
      const sorted = sortGroups(groups);

      const formattedLines: string[] = [];
      for (const group of sorted) {
        formattedLines.push(...formatGroup(group));
      }

      // Reconstruct the full block
      const fullBlock = [openingLine, ...formattedLines, closingLine].join('\n');

      // Replace the block in the document
      const range = new vscode.Range(
        new vscode.Position(start, 0),
        new vscode.Position(end, document.lineAt(end).text.length)
      );

      editor.edit(editBuilder => {
        editBuilder.replace(range, fullBlock);
      });
    })
  );
}
