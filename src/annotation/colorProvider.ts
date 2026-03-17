import * as vscode from 'vscode';

/**
 * Regex to match hex color values in annotation @default tags.
 * Matches #rgb and #rrggbb patterns.
 */
const HEX_COLOR_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

/**
 * Checks if the given line is inside an annotation block.
 */
function isInAnnotationBlock(document: vscode.TextDocument, line: number): boolean {
  const text = document.getText();
  const lineOffset = document.offsetAt(new vscode.Position(line, 0));
  const textBefore = text.substring(0, lineOffset);

  const pluginStart = textBefore.lastIndexOf('/*:');
  const structStart = textBefore.lastIndexOf('/*~struct~');
  const blockStart = Math.max(pluginStart, structStart);

  if (blockStart === -1) return false;

  const closerOffset = text.indexOf('*/', blockStart);
  if (closerOffset === -1) return true; // unclosed block

  // The closer must be after the current line
  const lineEnd = document.offsetAt(new vscode.Position(line, document.lineAt(line).text.length));
  return closerOffset >= lineEnd;
}

/**
 * Parses a hex color string into r, g, b components (0-1 range).
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }

  return { r, g, b };
}

/**
 * Converts r, g, b (0-1 range) to a hex string.
 */
function toHex(value: number): string {
  const hex = Math.round(value * 255).toString(16).padStart(2, '0');
  return hex;
}

class RmmzColorProvider implements vscode.DocumentColorProvider {
  provideDocumentColors(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    const colors: vscode.ColorInformation[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text;

      // Quick check: line should contain @default and #
      if (!text.includes('#')) continue;
      if (!text.includes('@default')) continue;

      // Verify we're inside an annotation block
      if (!isInAnnotationBlock(document, i)) continue;

      // Find all hex color matches on this line
      HEX_COLOR_RE.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = HEX_COLOR_RE.exec(text)) !== null) {
        const hexStr = match[1];
        const { r, g, b } = parseHexColor(hexStr);
        const color = new vscode.Color(r, g, b, 1);

        const startPos = new vscode.Position(i, match.index);
        const endPos = new vscode.Position(i, match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        colors.push(new vscode.ColorInformation(range, color));
      }
    }

    return colors;
  }

  provideColorPresentations(
    color: vscode.Color,
    context: { document: vscode.TextDocument; range: vscode.Range },
    _token: vscode.CancellationToken
  ): vscode.ColorPresentation[] {
    const r = toHex(color.red);
    const g = toHex(color.green);
    const b = toHex(color.blue);

    const hex = `#${r}${g}${b}`;
    const presentation = new vscode.ColorPresentation(hex);
    presentation.textEdit = new vscode.TextEdit(context.range, hex);

    return [presentation];
  }
}

/**
 * Activates the color provider for hex colors in annotation blocks.
 */
export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerColorProvider(selector, new RmmzColorProvider())
  );
}
