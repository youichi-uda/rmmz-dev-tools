import { describe, it, expect } from 'vitest';
import { Position, CompletionItemKind } from 'vscode';
import { RmmzCompletionProvider } from '../annotation/completionProvider';
import { TOP_LEVEL_TAGS, PARAM_TAGS, COMMAND_TAGS, TYPE_VALUES } from '../annotation/tags';
import { mockDocument, mockCancellationToken, mockCompletionContext } from './helpers';

function complete(content: string, line: number, character: number) {
  const provider = new RmmzCompletionProvider();
  const doc = mockDocument(content);
  const pos = new Position(line, character);
  return provider.provideCompletionItems(doc, pos, mockCancellationToken(), mockCompletionContext());
}

describe('RmmzCompletionProvider', () => {
  it('returns undefined when outside an annotation block', () => {
    const result = complete('// just code\nvar x = 1;', 1, 5);
    expect(result).toBeUndefined();
  });

  it('returns top-level tags at top scope', () => {
    const content = `/*:
 * @plugindesc Test
 * @`;
    // cursor at end of line 2 after @
    const items = complete(content, 2, 4);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    for (const tag of TOP_LEVEL_TAGS) {
      expect(labels).toContain(`@${tag}`);
    }
  });

  it('returns param tags inside @param scope', () => {
    const content = `/*:
 * @plugindesc Test
 * @param myParam
 * @`;
    const items = complete(content, 3, 4);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    for (const tag of PARAM_TAGS) {
      expect(labels).toContain(`@${tag}`);
    }
    // Should NOT contain top-level-only tags like @plugindesc
    expect(labels).not.toContain('@plugindesc');
  });

  it('returns command + param tags inside @command scope', () => {
    const content = `/*:
 * @plugindesc Test
 * @command DoSomething
 * @`;
    const items = complete(content, 3, 4);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    for (const tag of COMMAND_TAGS) {
      expect(labels).toContain(`@${tag}`);
    }
    // command scope also includes param tags
    for (const tag of PARAM_TAGS) {
      expect(labels).toContain(`@${tag}`);
    }
  });

  it('returns @type value completions after @type ', () => {
    const content = `/*:
 * @plugindesc Test
 * @param myParam
 * @type `;
    // cursor at end of "@type "
    const items = complete(content, 3, 9);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    for (const tv of TYPE_VALUES) {
      expect(labels).toContain(tv);
    }
    // Should also include struct<>
    expect(labels).toContain('struct<>');
  });

  it('filters @type values by prefix', () => {
    const content = `/*:
 * @plugindesc Test
 * @param myParam
 * @type nu`;
    const items = complete(content, 3, 11);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    expect(labels).toContain('number');
    expect(labels).not.toContain('string');
    expect(labels).not.toContain('boolean');
  });

  it('limits struct block completions to param-related tags', () => {
    const content = `/*~struct~MyStruct:
 * @param field
 * @`;
    const items = complete(content, 2, 4);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    // Should have param tags + @param itself
    expect(labels).toContain('@param');
    for (const tag of PARAM_TAGS) {
      expect(labels).toContain(`@${tag}`);
    }
    // Should NOT have top-level-only tags like @plugindesc
    expect(labels).not.toContain('@plugindesc');
    expect(labels).not.toContain('@command');
  });

  it('filters tag completions by prefix', () => {
    const content = `/*:
 * @pl`;
    const items = complete(content, 1, 6);
    expect(items).toBeDefined();
    const labels = items!.map(i => i.label);
    expect(labels).toContain('@plugindesc');
    expect(labels).not.toContain('@author');
    expect(labels).not.toContain('@help');
  });

  it('uses Keyword kind for tag completions', () => {
    const content = `/*:
 * @`;
    const items = complete(content, 1, 4);
    expect(items).toBeDefined();
    for (const item of items!) {
      expect(item.kind).toBe(CompletionItemKind.Keyword);
    }
  });

  it('uses EnumMember kind for type completions', () => {
    const content = `/*:
 * @param x
 * @type `;
    const items = complete(content, 2, 9);
    expect(items).toBeDefined();
    for (const item of items!) {
      expect(item.kind).toBe(CompletionItemKind.EnumMember);
    }
  });
});
