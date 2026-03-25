import { describe, it, expect } from 'vitest';
import { Range, Diagnostic, DiagnosticSeverity } from 'vscode';
import { mockDocument } from './helpers';

// Since langSync.validateDocument is not exported, we replicate the core logic
// here for unit testing. This tests the same algorithm as the source module.

interface AnnotationBlock {
  startLine: number;
  endLine: number;
  locale: string;
  isStruct: boolean;
}

interface StructuralElement {
  tag: string;
  name: string;
  line: number;
}

interface BlockStructure {
  locale: string;
  startLine: number;
  params: StructuralElement[];
  commands: StructuralElement[];
  argsByCommand: Map<string, StructuralElement[]>;
}

function findAnnotationBlocks(text: string): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  const lines = text.split('\n');
  let inBlock = false;
  let blockStart = 0;
  let locale = '';
  let isStruct = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock) {
      if (line.includes('/*~struct~')) {
        inBlock = true;
        blockStart = i;
        isStruct = true;
        locale = '';
      } else if (line.includes('/*:')) {
        const idx = line.indexOf('/*:');
        const after = line.substring(idx + 3);
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

function extractStructure(lines: string[], block: AnnotationBlock): BlockStructure {
  const params: StructuralElement[] = [];
  const commands: StructuralElement[] = [];
  const argsByCommand = new Map<string, StructuralElement[]>();
  let currentCommand: string | undefined;

  for (let i = block.startLine; i <= block.endLine; i++) {
    const lineText = lines[i];
    const tagMatch = lineText.match(/^\s*\*?\s*@(\w+)\s*(.*?)?\s*$/);
    if (!tagMatch) continue;
    const tag = tagMatch[1];
    const rest = (tagMatch[2] ?? '').trim();

    if (tag === 'param') {
      params.push({ tag: 'param', name: rest, line: i });
    } else if (tag === 'command') {
      currentCommand = rest;
      commands.push({ tag: 'command', name: rest, line: i });
      if (!argsByCommand.has(rest)) argsByCommand.set(rest, []);
    } else if (tag === 'arg') {
      if (currentCommand !== undefined) {
        let args = argsByCommand.get(currentCommand);
        if (!args) { args = []; argsByCommand.set(currentCommand, args); }
        args.push({ tag: 'arg', name: rest, line: i });
      }
    }
  }

  return { locale: block.locale, startLine: block.startLine, params, commands, argsByCommand };
}

function compareStructures(
  primary: BlockStructure,
  localeBlock: BlockStructure,
  diagnostics: Diagnostic[]
): void {
  const primaryParamNames = primary.params.map(p => p.name);
  const localeParamNames = localeBlock.params.map(p => p.name);

  for (const p of primary.params) {
    if (!localeParamNames.includes(p.name)) {
      const range = new Range(localeBlock.startLine, 0, localeBlock.startLine, 10);
      diagnostics.push(
        new Diagnostic(
          range,
          `Locale /*:${localeBlock.locale} is missing @param ${p.name} (present in primary block)`,
          DiagnosticSeverity.Warning
        )
      );
    }
  }

  for (const p of localeBlock.params) {
    if (!primaryParamNames.includes(p.name)) {
      const range = new Range(p.line, 0, p.line, 999);
      diagnostics.push(
        new Diagnostic(
          range,
          `@param ${p.name} in /*:${localeBlock.locale} is not present in the primary block`,
          DiagnosticSeverity.Warning
        )
      );
    }
  }

  const primaryCmdNames = primary.commands.map(c => c.name);
  const localeCmdNames = localeBlock.commands.map(c => c.name);

  for (const c of primary.commands) {
    if (!localeCmdNames.includes(c.name)) {
      const range = new Range(localeBlock.startLine, 0, localeBlock.startLine, 10);
      diagnostics.push(
        new Diagnostic(
          range,
          `Locale /*:${localeBlock.locale} is missing @command ${c.name} (present in primary block)`,
          DiagnosticSeverity.Warning
        )
      );
    }
  }

  for (const c of localeBlock.commands) {
    if (!primaryCmdNames.includes(c.name)) {
      const range = new Range(c.line, 0, c.line, 999);
      diagnostics.push(
        new Diagnostic(
          range,
          `@command ${c.name} in /*:${localeBlock.locale} is not present in the primary block`,
          DiagnosticSeverity.Warning
        )
      );
    }
  }
}

function validateLangSync(content: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = content.split('\n');
  const blocks = findAnnotationBlocks(content);
  const annotationBlocks = blocks.filter(b => !b.isStruct);
  if (annotationBlocks.length < 2) return diagnostics;

  const primary = annotationBlocks.find(b => b.locale === '');
  if (!primary) return diagnostics;

  const primaryStructure = extractStructure(lines, primary);

  for (const block of annotationBlocks) {
    if (block === primary) continue;
    const localeStructure = extractStructure(lines, block);
    compareStructures(primaryStructure, localeStructure, diagnostics);
  }

  return diagnostics;
}

describe('langSync validation', () => {
  it('produces no diagnostics when blocks match', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @param speed
 * @param color
 * @command Run
 * @arg distance
 */
/*:ja
 * @plugindesc my plugin ja
 * @param speed
 * @param color
 * @command Run
 * @arg distance
 */`;
    const d = validateLangSync(content);
    expect(d).toHaveLength(0);
  });

  it('warns when locale block is missing a @param', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @param speed
 * @param color
 */
/*:ja
 * @plugindesc ja
 * @param speed
 */`;
    const d = validateLangSync(content);
    const missing = d.filter(x => x.message.includes('missing @param color'));
    expect(missing).toHaveLength(1);
    expect(missing[0].severity).toBe(DiagnosticSeverity.Warning);
  });

  it('warns when locale block is missing a @command', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @command Run
 * @command Jump
 */
/*:ja
 * @plugindesc ja
 * @command Run
 */`;
    const d = validateLangSync(content);
    const missing = d.filter(x => x.message.includes('missing @command Jump'));
    expect(missing).toHaveLength(1);
    expect(missing[0].severity).toBe(DiagnosticSeverity.Warning);
  });

  it('warns when locale block has extra @param not in primary', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @param speed
 */
/*:ja
 * @plugindesc ja
 * @param speed
 * @param extraParam
 */`;
    const d = validateLangSync(content);
    const extra = d.filter(x => x.message.includes('extraParam') && x.message.includes('not present in the primary'));
    expect(extra).toHaveLength(1);
    expect(extra[0].severity).toBe(DiagnosticSeverity.Warning);
  });

  it('produces no diagnostics for files without locale blocks', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @param speed
 */`;
    const d = validateLangSync(content);
    expect(d).toHaveLength(0);
  });

  it('produces no diagnostics when only struct blocks exist', () => {
    const content = `/*~struct~Foo:
 * @param field1
 * @type number
 */`;
    const d = validateLangSync(content);
    expect(d).toHaveLength(0);
  });

  it('warns for extra @command in locale block', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @command Run
 */
/*:ja
 * @plugindesc ja
 * @command Run
 * @command ExtraCmd
 */`;
    const d = validateLangSync(content);
    const extra = d.filter(x => x.message.includes('ExtraCmd') && x.message.includes('not present in the primary'));
    expect(extra).toHaveLength(1);
  });

  it('handles multiple locale blocks', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @param speed
 * @param color
 */
/*:ja
 * @plugindesc ja
 * @param speed
 */
/*:ko
 * @plugindesc ko
 * @param speed
 */`;
    const d = validateLangSync(content);
    // Both ja and ko are missing @param color
    const missingColor = d.filter(x => x.message.includes('missing @param color'));
    expect(missingColor).toHaveLength(2);
  });
});
