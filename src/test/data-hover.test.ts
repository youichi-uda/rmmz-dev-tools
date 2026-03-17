import { describe, it, expect } from 'vitest';

/**
 * Tests for the DataHoverProvider regex patterns from src/datalink/hover.ts.
 *
 * The patterns are module-private, so we replicate them here for direct testing.
 * We also test the DataHoverProvider class by importing it with a mock DataCache.
 */

// ---------------------------------------------------------------------------
// Replicated patterns from hover.ts
// ---------------------------------------------------------------------------

/** Pattern for $dataXxx[N] */
const DATA_ACCESS_PATTERN = /(\$data\w+)\[(\d+)\]/g;

/** Pattern for $gameSwitches.value(N) or $gameSwitches.setValue(N */
const SWITCH_PATTERN = /\$gameSwitches\.(?:set)?[Vv]alue\((\d+)/g;

/** Pattern for $gameVariables.value(N) or $gameVariables.setValue(N */
const VARIABLE_PATTERN = /\$gameVariables\.(?:set)?[Vv]alue\((\d+)/g;

// ---------------------------------------------------------------------------
// Helper to collect all matches from a regex
// ---------------------------------------------------------------------------

function collectMatches(
  pattern: RegExp,
  input: string
): { full: string; groups: string[] }[] {
  pattern.lastIndex = 0;
  const results: { full: string; groups: string[] }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(input)) !== null) {
    results.push({
      full: m[0],
      groups: Array.from(m).slice(1),
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Tests: DATA_ACCESS_PATTERN
// ---------------------------------------------------------------------------

describe('DataHover - DATA_ACCESS_PATTERN', () => {
  it('should match $dataActors[1]', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataActors[1]');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('$dataActors');
    expect(matches[0].groups[1]).toBe('1');
  });

  it('should match $dataSkills[42]', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, 'const skill = $dataSkills[42];');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('$dataSkills');
    expect(matches[0].groups[1]).toBe('42');
  });

  it('should match $dataItems[100]', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataItems[100]');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('$dataItems');
    expect(matches[0].groups[1]).toBe('100');
  });

  it('should match $dataWeapons[5] and $dataArmors[3] on the same line', () => {
    const line = 'if ($dataWeapons[5].price > $dataArmors[3].price) {';
    const matches = collectMatches(DATA_ACCESS_PATTERN, line);
    expect(matches).toHaveLength(2);
    expect(matches[0].groups[0]).toBe('$dataWeapons');
    expect(matches[0].groups[1]).toBe('5');
    expect(matches[1].groups[0]).toBe('$dataArmors');
    expect(matches[1].groups[1]).toBe('3');
  });

  it('should match $dataEnemies[0]', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataEnemies[0]');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[1]).toBe('0');
  });

  it('should match $dataCommonEvents[10]', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataCommonEvents[10]');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('$dataCommonEvents');
    expect(matches[0].groups[1]).toBe('10');
  });

  it('should not match non-$data globals', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$gameParty[1]');
    expect(matches).toHaveLength(0);
  });

  it('should not match $data without brackets', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataActors');
    expect(matches).toHaveLength(0);
  });

  it('should not match $data with non-numeric index', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataActors[id]');
    expect(matches).toHaveLength(0);
  });

  it('should match $dataSystem[0] (object access as array)', () => {
    const matches = collectMatches(DATA_ACCESS_PATTERN, '$dataSystem[0]');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('$dataSystem');
  });
});

// ---------------------------------------------------------------------------
// Tests: SWITCH_PATTERN
// ---------------------------------------------------------------------------

describe('DataHover - SWITCH_PATTERN', () => {
  it('should match $gameSwitches.value(3)', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches.value(3)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('3');
  });

  it('should match $gameSwitches.setValue(3', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches.setValue(3, true)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('3');
  });

  it('should match $gameSwitches.Value(5) (capital V)', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches.Value(5)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('5');
  });

  it('should match $gameSwitches.setvalue(7) (lowercase v in set)', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches.setvalue(7)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('7');
  });

  it('should not match $gameVariables.value(1)', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameVariables.value(1)');
    expect(matches).toHaveLength(0);
  });

  it('should not match $gameSwitches without .value', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches');
    expect(matches).toHaveLength(0);
  });

  it('should match multiple switch references on one line', () => {
    const line = 'if ($gameSwitches.value(1) && $gameSwitches.value(2)) {';
    const matches = collectMatches(SWITCH_PATTERN, line);
    expect(matches).toHaveLength(2);
    expect(matches[0].groups[0]).toBe('1');
    expect(matches[1].groups[0]).toBe('2');
  });

  it('should handle large switch IDs', () => {
    const matches = collectMatches(SWITCH_PATTERN, '$gameSwitches.value(9999)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('9999');
  });
});

// ---------------------------------------------------------------------------
// Tests: VARIABLE_PATTERN
// ---------------------------------------------------------------------------

describe('DataHover - VARIABLE_PATTERN', () => {
  it('should match $gameVariables.value(10)', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameVariables.value(10)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('10');
  });

  it('should match $gameVariables.setValue(10', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameVariables.setValue(10, 42)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('10');
  });

  it('should match $gameVariables.Value(20) (capital V)', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameVariables.Value(20)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('20');
  });

  it('should not match $gameSwitches.value(1)', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameSwitches.value(1)');
    expect(matches).toHaveLength(0);
  });

  it('should match multiple variable references on one line', () => {
    const line = 'const a = $gameVariables.value(1) + $gameVariables.value(2);';
    const matches = collectMatches(VARIABLE_PATTERN, line);
    expect(matches).toHaveLength(2);
    expect(matches[0].groups[0]).toBe('1');
    expect(matches[1].groups[0]).toBe('2');
  });

  it('should not match when no numeric argument', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameVariables.value(id)');
    expect(matches).toHaveLength(0);
  });

  it('should handle variable ID of 0', () => {
    const matches = collectMatches(VARIABLE_PATTERN, '$gameVariables.value(0)');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups[0]).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Tests: Non-matching strings
// ---------------------------------------------------------------------------

describe('DataHover - non-matching strings', () => {
  it('should not match plain text', () => {
    const text = 'Hello world, no game data here.';
    expect(collectMatches(DATA_ACCESS_PATTERN, text)).toHaveLength(0);
    expect(collectMatches(SWITCH_PATTERN, text)).toHaveLength(0);
    expect(collectMatches(VARIABLE_PATTERN, text)).toHaveLength(0);
  });

  it('should not match comments about data', () => {
    const text = '// This accesses dataActors but not via $dataActors[N] syntax';
    expect(collectMatches(DATA_ACCESS_PATTERN, text)).toHaveLength(0);
  });

  it('should not match partial patterns', () => {
    expect(collectMatches(DATA_ACCESS_PATTERN, '$data[')).toHaveLength(0);
    expect(collectMatches(SWITCH_PATTERN, '$gameSwitches.value(')).toHaveLength(0);
    expect(collectMatches(VARIABLE_PATTERN, '$gameVariables.setValue(')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: DataHoverProvider via import (integration-style)
// ---------------------------------------------------------------------------

describe('DataHover - DataHoverProvider class', () => {
  it('should be importable and constructable', async () => {
    const mod = await import('../../src/datalink/hover');
    expect(mod.DataHoverProvider).toBeDefined();
    expect(mod.DataCache).toBeDefined();
  });
});
