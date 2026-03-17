import { Range, Position, Uri } from 'vscode';
import type { TextDocument, CancellationToken, CompletionContext } from 'vscode';

/**
 * Builds a mock vscode.TextDocument from a string.
 */
export function mockDocument(content: string, languageId = 'javascript'): TextDocument {
  const lines = content.split('\n');
  return {
    getText: () => content,
    lineAt: (lineOrPosition: number | Position) => {
      const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
      return {
        text: lines[line] ?? '',
        range: new Range(line, 0, line, (lines[line] ?? '').length),
      };
    },
    offsetAt: (position: Position) => {
      let offset = 0;
      for (let i = 0; i < position.line && i < lines.length; i++) {
        offset += lines[i].length + 1; // +1 for \n
      }
      offset += position.character;
      return offset;
    },
    uri: Uri.file('/test/plugin.js'),
    languageId,
    lineCount: lines.length,
  };
}

export function mockCancellationToken(): CancellationToken {
  return {
    isCancellationRequested: false,
    onCancellationRequested: () => ({ dispose: () => {} }),
  };
}

export function mockCompletionContext(): CompletionContext {
  return { triggerKind: 0 };
}
