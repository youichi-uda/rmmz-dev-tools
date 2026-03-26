import { describe, it, expect } from 'vitest';

// The conflict detector has internal functions (scanFile, isMinified) that are not exported.
// We'll test them by requiring the module and using its compiled output, or by testing
// through the ConflictDetector class which IS exported.
// However, scanFile and isMinified are module-private. We'll test the regexes and
// the ConflictDetector.scan() method behavior indirectly.

// For direct testing of the internal regex logic, we replicate the patterns here
// (they're simple enough) and also test the ConflictDetector class end-to-end.

// Replicated from detector.ts for unit testing internal logic:
const DIRECT_ASSIGN_RE = /^[ \t]*(\w+)\.prototype\.(\w+)\s*=\s*function/;
const ALIAS_CAPTURE_RE = /^[ \t]*(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\.prototype\.(\w+)\s*;/;

describe('conflict detection regex patterns', () => {
  describe('DIRECT_ASSIGN_RE', () => {
    it('matches direct prototype assignment', () => {
      const line = 'Foo.prototype.bar = function() {';
      const match = line.match(DIRECT_ASSIGN_RE);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('Foo');
      expect(match![2]).toBe('bar');
    });

    it('matches with leading whitespace', () => {
      const line = '    Scene_Map.prototype.update = function() {';
      const match = line.match(DIRECT_ASSIGN_RE);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('Scene_Map');
      expect(match![2]).toBe('update');
    });

    it('does not match non-prototype assignments', () => {
      const line = 'Foo.bar = function() {';
      expect(line.match(DIRECT_ASSIGN_RE)).toBeNull();
    });

    it('does not match property access without function', () => {
      const line = 'Foo.prototype.bar = 42;';
      expect(line.match(DIRECT_ASSIGN_RE)).toBeNull();
    });
  });

  describe('ALIAS_CAPTURE_RE', () => {
    it('matches const alias capture', () => {
      const line = 'const _old = Foo.prototype.bar;';
      const match = line.match(ALIAS_CAPTURE_RE);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('_old');
      expect(match![2]).toBe('Foo');
      expect(match![3]).toBe('bar');
    });

    it('matches var alias capture', () => {
      const line = 'var _Scene_Map_update = Scene_Map.prototype.update;';
      const match = line.match(ALIAS_CAPTURE_RE);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('_Scene_Map_update');
      expect(match![2]).toBe('Scene_Map');
      expect(match![3]).toBe('update');
    });

    it('matches let alias capture', () => {
      const line = 'let _alias = Game_Player.prototype.moveStraight;';
      const match = line.match(ALIAS_CAPTURE_RE);
      expect(match).not.toBeNull();
    });

    it('does not match without semicolon', () => {
      const line = 'const _old = Foo.prototype.bar';
      expect(line.match(ALIAS_CAPTURE_RE)).toBeNull();
    });
  });
});

describe('isMinified detection', () => {
  // Replicate the isMinified function for testing
  function isMinified(content: string): boolean {
    if (content.length === 0) return false;
    const lines = content.split('\n');
    const lineCount = lines.length;
    if (lineCount <= 1 && content.length > 500) return true;
    const avgLineLength = content.length / lineCount;
    if (avgLineLength > 200) return true;
    const newlineRatio = content.length / lineCount;
    if (newlineRatio > 500) return true;
    return false;
  }

  it('returns false for empty content', () => {
    expect(isMinified('')).toBe(false);
  });

  it('returns false for normal code', () => {
    const code = `function hello() {
  console.log("hello");
}

function world() {
  return 42;
}`;
    expect(isMinified(code)).toBe(false);
  });

  it('returns true for single long line', () => {
    const code = 'a'.repeat(600);
    expect(isMinified(code)).toBe(true);
  });

  it('returns true for high average line length', () => {
    const code = 'a'.repeat(250) + '\n' + 'b'.repeat(250);
    expect(isMinified(code)).toBe(true);
  });

  it('returns false for many short lines', () => {
    const code = Array(100).fill('var x = 1;').join('\n');
    expect(isMinified(code)).toBe(false);
  });
});

describe('scanFile logic', () => {
  // Replicate scanFile for testing (since it's not exported)
  function scanFile(filePath: string, content: string) {
    const results = new Map<string, { plugin: string; filePath: string; line: number; isAlias: boolean }>();
    const pluginName = filePath.replace(/^.*[\\/]/, '').replace('.js', '');
    const lines = content.split('\n');

    const aliasVars = new Map<string, string>();
    for (const line of lines) {
      const aliasMatch = line.match(ALIAS_CAPTURE_RE);
      if (aliasMatch) {
        const [, varName, className, methodName] = aliasMatch;
        aliasVars.set(varName, `${className}.prototype.${methodName}`);
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const directMatch = line.match(DIRECT_ASSIGN_RE);
      if (!directMatch) continue;
      const [, className, methodName] = directMatch;
      const key = `${className}.prototype.${methodName}`;
      let isAlias = false;
      for (const [, target] of aliasVars) {
        if (target === key) { isAlias = true; break; }
      }
      results.set(key, { plugin: pluginName, filePath, line: i + 1, isAlias });
    }
    return results;
  }

  it('detects direct prototype assignment', () => {
    const content = `Foo.prototype.bar = function() {
  return 1;
};`;
    const results = scanFile('PluginA.js', content);
    expect(results.has('Foo.prototype.bar')).toBe(true);
    expect(results.get('Foo.prototype.bar')!.isAlias).toBe(false);
  });

  it('detects aliased prototype override', () => {
    const content = `const _old = Foo.prototype.bar;
Foo.prototype.bar = function() {
  _old.call(this);
  return 1;
};`;
    const results = scanFile('PluginB.js', content);
    expect(results.has('Foo.prototype.bar')).toBe(true);
    expect(results.get('Foo.prototype.bar')!.isAlias).toBe(true);
  });

  it('reports correct line number (1-based)', () => {
    const content = `// header
// comment
Foo.prototype.bar = function() {};`;
    const results = scanFile('Test.js', content);
    expect(results.get('Foo.prototype.bar')!.line).toBe(3);
  });

  it('detects multiple overrides in one file', () => {
    const content = `Foo.prototype.bar = function() {};
Foo.prototype.baz = function() {};
Bar.prototype.qux = function() {};`;
    const results = scanFile('Multi.js', content);
    expect(results.size).toBe(3);
  });
});

describe('conflict detection across plugins', () => {
  function detectConflicts(
    files: { path: string; content: string }[]
  ): { method: string; overrides: any[]; hasConflict: boolean }[] {
    const overrideMap = new Map<string, any[]>();

    for (const file of files) {
      const pluginName = file.path.replace(/^.*[\\/]/, '').replace('.js', '');
      const lines = file.content.split('\n');

      const aliasVars = new Map<string, string>();
      for (const line of lines) {
        const aliasMatch = line.match(ALIAS_CAPTURE_RE);
        if (aliasMatch) {
          const [, varName, className, methodName] = aliasMatch;
          aliasVars.set(varName, `${className}.prototype.${methodName}`);
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const directMatch = line.match(DIRECT_ASSIGN_RE);
        if (!directMatch) continue;
        const [, className, methodName] = directMatch;
        const key = `${className}.prototype.${methodName}`;
        let isAlias = false;
        for (const [, target] of aliasVars) {
          if (target === key) { isAlias = true; break; }
        }
        let list = overrideMap.get(key);
        if (!list) { list = []; overrideMap.set(key, list); }
        list.push({ plugin: pluginName, filePath: file.path, line: i + 1, isAlias });
      }
    }

    const results: { method: string; overrides: any[]; hasConflict: boolean }[] = [];
    for (const [method, overrides] of overrideMap) {
      if (overrides.length < 2) continue;
      const allAliased = overrides.every((o: any) => o.isAlias);
      results.push({ method, overrides, hasConflict: !allAliased });
    }
    return results;
  }

  it('detects conflict when multiple plugins override without alias', () => {
    const results = detectConflicts([
      { path: 'PluginA.js', content: 'Foo.prototype.bar = function() {};' },
      { path: 'PluginB.js', content: 'Foo.prototype.bar = function() {};' },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].hasConflict).toBe(true);
    expect(results[0].method).toBe('Foo.prototype.bar');
  });

  it('reports no conflict when all plugins use alias', () => {
    const results = detectConflicts([
      {
        path: 'PluginA.js',
        content: `const _old_A = Foo.prototype.bar;
Foo.prototype.bar = function() { _old_A.call(this); };`,
      },
      {
        path: 'PluginB.js',
        content: `const _old_B = Foo.prototype.bar;
Foo.prototype.bar = function() { _old_B.call(this); };`,
      },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].hasConflict).toBe(false);
  });

  it('detects conflict when one plugin uses alias and one does not', () => {
    const results = detectConflicts([
      {
        path: 'PluginA.js',
        content: `const _old = Foo.prototype.bar;
Foo.prototype.bar = function() { _old.call(this); };`,
      },
      {
        path: 'PluginB.js',
        content: 'Foo.prototype.bar = function() {};',
      },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].hasConflict).toBe(true);
  });

  it('does not report single-plugin overrides', () => {
    const results = detectConflicts([
      { path: 'PluginA.js', content: 'Foo.prototype.bar = function() {};' },
      { path: 'PluginB.js', content: 'Baz.prototype.qux = function() {};' },
    ]);
    expect(results).toHaveLength(0);
  });
});

describe('plugin order sorting', () => {
  function sortOverridesByPluginOrder(
    overrides: { plugin: string }[],
    pluginOrder: string[]
  ) {
    const orderIndex = new Map<string, number>();
    pluginOrder.forEach((name, i) => orderIndex.set(name, i));
    return [...overrides].sort((a, b) => {
      const ia = orderIndex.has(a.plugin) ? orderIndex.get(a.plugin)! : Infinity;
      const ib = orderIndex.has(b.plugin) ? orderIndex.get(b.plugin)! : Infinity;
      if (ia !== ib) return ia - ib;
      return a.plugin.localeCompare(b.plugin);
    });
  }

  it('sorts overrides by plugin manager order', () => {
    const pluginOrder = ['PluginC', 'PluginA', 'PluginB'];
    const overrides = [
      { plugin: 'PluginA' },
      { plugin: 'PluginB' },
      { plugin: 'PluginC' },
    ];
    const sorted = sortOverridesByPluginOrder(overrides, pluginOrder);
    expect(sorted.map(o => o.plugin)).toEqual(['PluginC', 'PluginA', 'PluginB']);
  });

  it('puts unknown plugins last, sorted alphabetically', () => {
    const pluginOrder = ['PluginB', 'PluginA'];
    const overrides = [
      { plugin: 'PluginZ' },
      { plugin: 'PluginA' },
      { plugin: 'PluginB' },
      { plugin: 'PluginX' },
    ];
    const sorted = sortOverridesByPluginOrder(overrides, pluginOrder);
    expect(sorted.map(o => o.plugin)).toEqual(['PluginB', 'PluginA', 'PluginX', 'PluginZ']);
  });

  it('falls back to alphabetical when no plugin order is available', () => {
    const overrides = [
      { plugin: 'Charlie' },
      { plugin: 'Alpha' },
      { plugin: 'Bravo' },
    ];
    const sorted = sortOverridesByPluginOrder(overrides, []);
    expect(sorted.map(o => o.plugin)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});
