import * as vscode from 'vscode';
import {
  TOP_LEVEL_TAGS,
  PARAM_TAGS,
  COMMAND_TAGS,
  ARG_TAGS,
  TYPE_VALUES,
  TYPE_DESCRIPTIONS,
  TAG_DESCRIPTIONS,
} from './tags';

/**
 * Determines if the given position is inside an RMMZ annotation block.
 * Returns the block content and its start position if found.
 */
function getAnnotationBlock(
  document: vscode.TextDocument,
  position: vscode.Position
): { inBlock: boolean; isStructBlock: boolean } {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Search backwards from cursor for the nearest block opener
  const textBefore = text.substring(0, offset);

  // Find the last opening of an annotation block
  const pluginBlockStart = textBefore.lastIndexOf('/*:');
  const structBlockStart = textBefore.lastIndexOf('/*~struct~');
  const blockStart = Math.max(pluginBlockStart, structBlockStart);

  if (blockStart === -1) return { inBlock: false, isStructBlock: false };

  // Check that we haven't passed the block closer
  const closerAfterStart = text.indexOf('*/', blockStart);
  if (closerAfterStart !== -1 && closerAfterStart < offset) {
    return { inBlock: false, isStructBlock: false };
  }

  return {
    inBlock: true,
    isStructBlock: structBlockStart > pluginBlockStart,
  };
}

type Scope = 'top' | 'param' | 'command' | 'arg';

/**
 * Determines the current annotation scope at the given position.
 */
function getCurrentScope(
  document: vscode.TextDocument,
  position: vscode.Position
): Scope {
  // Walk backwards from the current line to find the enclosing scope
  for (let i = position.line - 1; i >= 0; i--) {
    const lineText = document.lineAt(i).text.trim();

    // Check for block start — if we hit this, we're at top level
    if (lineText.startsWith('/*:') || lineText.startsWith('/*~struct~')) {
      return 'top';
    }

    // Check for scope-defining tags
    const tagMatch = lineText.match(/^\*?\s*@(\w+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      if (tag === 'arg') return 'arg';
      if (tag === 'command') return 'command';
      if (tag === 'param') return 'param';
      // Other tags don't change scope, keep looking
    }
  }

  return 'top';
}

/**
 * Provides completion items for RMMZ annotation tags and @type values.
 */
export class RmmzCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const { inBlock, isStructBlock } = getAnnotationBlock(document, position);
    if (!inBlock) return undefined;

    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);

    // Check if we're completing a @type value
    const typeMatch = linePrefix.match(/@type\s+(\S*)$/);
    if (typeMatch) {
      return this.getTypeCompletions(typeMatch[1]);
    }

    // Check if we're completing a tag name (after @)
    const tagMatch = linePrefix.match(/@(\w*)$/);
    if (tagMatch) {
      if (isStructBlock) {
        // Struct blocks only contain @param and its sub-tags
        return this.getTagCompletions([...PARAM_TAGS, 'param'], tagMatch[1]);
      }

      const scope = getCurrentScope(document, position);
      return this.getScopedTagCompletions(scope, tagMatch[1]);
    }

    return undefined;
  }

  private getTypeCompletions(prefix: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const type of TYPE_VALUES) {
      if (prefix && !type.startsWith(prefix)) continue;

      const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.EnumMember);
      item.detail = TYPE_DESCRIPTIONS[type] ?? '';
      item.insertText = type;
      // Set range to replace the partial text already typed
      items.push(item);
    }

    // Add struct<> template
    if (!prefix || 'struct'.startsWith(prefix)) {
      const structItem = new vscode.CompletionItem('struct<>', vscode.CompletionItemKind.EnumMember);
      structItem.detail = 'Structured object with named fields';
      structItem.insertText = new vscode.SnippetString('struct<${1:TypeName}>');
      items.push(structItem);
    }

    return items;
  }

  private getScopedTagCompletions(scope: Scope, prefix: string): vscode.CompletionItem[] {
    let tags: readonly string[];
    switch (scope) {
      case 'param':
        tags = PARAM_TAGS;
        break;
      case 'command':
        tags = [...COMMAND_TAGS, ...PARAM_TAGS]; // command can contain @arg which has sub-tags
        break;
      case 'arg':
        tags = ARG_TAGS;
        break;
      default:
        tags = TOP_LEVEL_TAGS;
        break;
    }
    return this.getTagCompletions([...tags], prefix);
  }

  private getTagCompletions(tags: string[], prefix: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const tag of tags) {
      if (prefix && !tag.toLowerCase().startsWith(prefix.toLowerCase())) continue;

      const item = new vscode.CompletionItem(`@${tag}`, vscode.CompletionItemKind.Keyword);
      item.detail = TAG_DESCRIPTIONS[tag] ?? '';
      item.insertText = `${tag} `;
      // filterText without @ so it matches when user types after @
      item.filterText = tag;
      items.push(item);
    }

    return items;
  }
}
