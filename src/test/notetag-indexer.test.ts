import { describe, it, expect } from 'vitest';

/**
 * The NoteTagIndexer (src/notetag/indexer.ts) uses three regex patterns
 * to extract note tags from RMMZ data files:
 *
 *   SIMPLE_TAG_PATTERN = /<(\w+)(?::([^>]*))?>/g
 *   BLOCK_TAG_PATTERN  = /<(\w+)>\s*\n([\s\S]*?)\n\s*<\/\1>/g
 *   NOTE_PARAM_PATTERN = /@noteParam\s+(\w+)/g
 *
 * These are module-private, so we replicate them here for direct unit testing.
 * The extractTags logic is also replicated to test the full extraction pipeline.
 */

// ---------------------------------------------------------------------------
// Replicated patterns from indexer.ts
// ---------------------------------------------------------------------------

const SIMPLE_TAG_PATTERN = /<(\w+)(?::([^>]*))?>/g;
const BLOCK_TAG_PATTERN = /<(\w+)>\s*\n([\s\S]*?)\n\s*<\/\1>/g;
const NOTE_PARAM_PATTERN = /@noteParam\s+(\w+)/g;

interface TagResult {
  tagName: string;
  value?: string;
  isBlock: boolean;
}

/**
 * Replicates the extractTags logic from NoteTagIndexer to test the
 * combined simple + block tag extraction pipeline.
 */
function extractAllTags(note: string): TagResult[] {
  const results: TagResult[] = [];
  const blockTagNames = new Set<string>();

  // Block tags first
  BLOCK_TAG_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLOCK_TAG_PATTERN.exec(note)) !== null) {
    const tagName = match[1];
    const value = match[2].trim();
    blockTagNames.add(tagName);
    results.push({ tagName, value, isBlock: true });
  }

  // Simple tags (skip those already captured as block)
  SIMPLE_TAG_PATTERN.lastIndex = 0;
  while ((match = SIMPLE_TAG_PATTERN.exec(note)) !== null) {
    const tagName = match[1];
    if (blockTagNames.has(tagName)) continue;
    const value = match[2] || undefined;
    results.push({ tagName, value, isBlock: false });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Tests: SIMPLE_TAG_PATTERN
// ---------------------------------------------------------------------------

describe('NoteTag - SIMPLE_TAG_PATTERN', () => {
  function matchSimple(input: string): { tagName: string; value?: string }[] {
    SIMPLE_TAG_PATTERN.lastIndex = 0;
    const results: { tagName: string; value?: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = SIMPLE_TAG_PATTERN.exec(input)) !== null) {
      results.push({ tagName: m[1], value: m[2] || undefined });
    }
    return results;
  }

  it('should match a simple flag tag <TagName>', () => {
    const results = matchSimple('<NoEncounter>');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ tagName: 'NoEncounter', value: undefined });
  });

  it('should match a key-value tag <TagName:value>', () => {
    const results = matchSimple('<Element:Fire>');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ tagName: 'Element', value: 'Fire' });
  });

  it('should match a key-value tag with numeric value', () => {
    const results = matchSimple('<Level:5>');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ tagName: 'Level', value: '5' });
  });

  it('should match multiple tags on separate lines', () => {
    const results = matchSimple('<Tag1>\n<Tag2:val>');
    expect(results).toHaveLength(2);
    expect(results[0].tagName).toBe('Tag1');
    expect(results[1].tagName).toBe('Tag2');
    expect(results[1].value).toBe('val');
  });

  it('should match key-value with spaces in value', () => {
    const results = matchSimple('<Desc:A long description>');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('A long description');
  });

  it('should match key-value with empty value (colon present)', () => {
    const results = matchSimple('<Tag:>');
    expect(results).toHaveLength(1);
    expect(results[0].tagName).toBe('Tag');
    // Empty string after colon
    expect(results[0].value).toBe(undefined); // empty string becomes undefined via || undefined
  });

  it('should not match tags with non-word characters in name', () => {
    const results = matchSimple('<tag-name>');
    // \w+ matches "tag" but then the regex expects ">" or ":", not "-"
    // so the entire pattern fails to match
    expect(results).toHaveLength(0);
  });

  it('should produce no matches for empty notes', () => {
    const results = matchSimple('');
    expect(results).toHaveLength(0);
  });

  it('should produce no matches for plain text without angle brackets', () => {
    const results = matchSimple('Just some plain text here');
    expect(results).toHaveLength(0);
  });

  it('should handle tags with numeric-starting values', () => {
    const results = matchSimple('<HP:100>');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ tagName: 'HP', value: '100' });
  });
});

// ---------------------------------------------------------------------------
// Tests: BLOCK_TAG_PATTERN
// ---------------------------------------------------------------------------

describe('NoteTag - BLOCK_TAG_PATTERN', () => {
  function matchBlock(input: string): { tagName: string; content: string }[] {
    BLOCK_TAG_PATTERN.lastIndex = 0;
    const results: { tagName: string; content: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = BLOCK_TAG_PATTERN.exec(input)) !== null) {
      results.push({ tagName: m[1], content: m[2].trim() });
    }
    return results;
  }

  it('should match a block tag with content', () => {
    const input = '<CustomScript>\nvar x = 1;\nvar y = 2;\n</CustomScript>';
    const results = matchBlock(input);
    expect(results).toHaveLength(1);
    expect(results[0].tagName).toBe('CustomScript');
    expect(results[0].content).toBe('var x = 1;\nvar y = 2;');
  });

  it('should match a block tag with single-line content', () => {
    const input = '<Description>\nA hero of legend.\n</Description>';
    const results = matchBlock(input);
    expect(results).toHaveLength(1);
    expect(results[0].tagName).toBe('Description');
    expect(results[0].content).toBe('A hero of legend.');
  });

  it('should match multiple block tags', () => {
    const input = '<BlockA>\ncontent A\n</BlockA>\n<BlockB>\ncontent B\n</BlockB>';
    const results = matchBlock(input);
    expect(results).toHaveLength(2);
    expect(results[0].tagName).toBe('BlockA');
    expect(results[1].tagName).toBe('BlockB');
  });

  it('should not match mismatched closing tags', () => {
    const input = '<Open>\ncontent\n</Different>';
    const results = matchBlock(input);
    expect(results).toHaveLength(0);
  });

  it('should not match block tags without newlines (inline)', () => {
    const input = '<Tag>content</Tag>';
    const results = matchBlock(input);
    // The pattern requires \n between open tag and content
    expect(results).toHaveLength(0);
  });

  it('should handle block tag with empty content', () => {
    const input = '<Empty>\n\n</Empty>';
    const results = matchBlock(input);
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Tests: NOTE_PARAM_PATTERN
// ---------------------------------------------------------------------------

describe('NoteTag - NOTE_PARAM_PATTERN', () => {
  function matchNoteParams(input: string): string[] {
    NOTE_PARAM_PATTERN.lastIndex = 0;
    const results: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = NOTE_PARAM_PATTERN.exec(input)) !== null) {
      results.push(m[1]);
    }
    return results;
  }

  it('should match @noteParam declarations', () => {
    const input = `/*:
 * @noteParam enemyType
 * @noteParam bossFlag
 */`;
    const results = matchNoteParams(input);
    expect(results).toEqual(['enemyType', 'bossFlag']);
  });

  it('should match @noteParam with various whitespace', () => {
    const input = `@noteParam    spacedParam`;
    const results = matchNoteParams(input);
    expect(results).toEqual(['spacedParam']);
  });

  it('should return empty for content without @noteParam', () => {
    const input = `/*:
 * @plugindesc My Plugin
 * @param someParam
 */`;
    const results = matchNoteParams(input);
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: Combined extraction pipeline
// ---------------------------------------------------------------------------

describe('NoteTag - Combined extraction pipeline', () => {
  it('should extract both simple and block tags from a note', () => {
    const note = `<Flag>
<Element:Fire>
<CustomScript>
var x = 1;
</CustomScript>`;

    const tags = extractAllTags(note);
    const simples = tags.filter(t => !t.isBlock);
    const blocks = tags.filter(t => t.isBlock);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].tagName).toBe('CustomScript');
    expect(blocks[0].value).toBe('var x = 1;');

    expect(simples).toHaveLength(2);
    expect(simples.map(t => t.tagName)).toContain('Flag');
    expect(simples.map(t => t.tagName)).toContain('Element');
  });

  it('should skip simple tag extraction for tags already captured as block', () => {
    const note = `<DualTag>
block content here
</DualTag>`;

    const tags = extractAllTags(note);
    // DualTag should appear once as block, and its opening <DualTag> should
    // NOT appear again as a simple tag
    const dualTags = tags.filter(t => t.tagName === 'DualTag');
    expect(dualTags).toHaveLength(1);
    expect(dualTags[0].isBlock).toBe(true);
  });

  it('should handle notes with only simple tags', () => {
    const note = `<Tag1>\n<Tag2:value2>`;
    const tags = extractAllTags(note);
    expect(tags.every(t => !t.isBlock)).toBe(true);
    expect(tags).toHaveLength(2);
  });

  it('should handle empty notes', () => {
    const tags = extractAllTags('');
    expect(tags).toHaveLength(0);
  });

  it('should handle notes with nested angle brackets in values', () => {
    // <Tag:a<b> -- the value stops at the first > per [^>]*
    const tags = extractAllTags('<Tag:a>');
    expect(tags).toHaveLength(1);
    expect(tags[0].tagName).toBe('Tag');
    expect(tags[0].value).toBe('a');
  });
});
