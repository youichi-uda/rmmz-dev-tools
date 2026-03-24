import * as vscode from 'vscode';
import { TAG_DESCRIPTIONS, TYPE_DESCRIPTIONS, TYPE_VALUES } from './tags';

/**
 * Provides hover information for RMMZ annotation tags and @type values.
 */
export class RmmzHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const lineText = document.lineAt(position).text;

    // Check if cursor is on a @tag
    const tagRegex = /@(\w+)/g;
    let match;
    while ((match = tagRegex.exec(lineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character >= start && position.character <= end) {
        const tag = match[1];
        const description = TAG_DESCRIPTIONS[tag];
        if (description) {
          const range = new vscode.Range(position.line, start, position.line, end);
          return new vscode.Hover(new vscode.MarkdownString(`**@${tag}** — ${description}`), range);
        }
      }
    }

    // Check if cursor is on a @type value
    const typeLineMatch = lineText.match(/@type\s+(\S+)/);
    if (typeLineMatch) {
      const typeValue = typeLineMatch[1];
      const typeStart = lineText.indexOf(typeValue, lineText.indexOf('@type'));
      const typeEnd = typeStart + typeValue.length;
      if (position.character >= typeStart && position.character <= typeEnd) {
        const baseType = typeValue.replace(/(\[\])+$/, '');
        const description = TYPE_DESCRIPTIONS[baseType];
        if (description) {
          const isArray = typeValue.endsWith('[]');
          const range = new vscode.Range(position.line, typeStart, position.line, typeEnd);
          const md = new vscode.MarkdownString();
          md.appendMarkdown(`**${typeValue}** — ${description}`);
          if (isArray) {
            md.appendMarkdown('\n\n*Array type: stored as JSON array string*');
          }
          return new vscode.Hover(md, range);
        }
      }
    }

    return undefined;
  }
}
