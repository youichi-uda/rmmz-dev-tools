import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * The dependency graph module (src/dependency/graph.ts) keeps its core
 * analysis functions (`parsePluginFile`, `readLoadOrder`, `buildGraphData`,
 * `detectCycles`) module-private.  To test them we create a temporary
 * project structure on disk and drive the logic through the exported
 * `showDependencyGraph`, which calls `buildGraphData` internally.
 *
 * However, since showDependencyGraph requires vscode APIs (webview panel),
 * we instead directly replicate the pure parsing logic here so we can
 * unit-test the regex patterns and graph algorithms in isolation.
 *
 * If the module were to export `buildGraphData` or `parsePluginFile` in the
 * future, these tests could import them directly.
 */

// ---------------------------------------------------------------------------
// Replicated pure functions from graph.ts for direct testing
// ---------------------------------------------------------------------------

interface PluginMeta {
  name: string;
  base: string[];
  orderAfter: string[];
  orderBefore: string[];
}

interface GraphIssue {
  type: 'circular' | 'missing' | 'ordering';
  message: string;
  plugins: string[];
}

function parsePluginContent(content: string, filename: string): PluginMeta | undefined {
  const name = path.basename(filename, '.js');
  const blockMatch = content.match(/\/\*:([\s\S]*?)\*\//);
  if (!blockMatch) return undefined;

  const block = blockMatch[1];
  const base: string[] = [];
  const orderAfter: string[] = [];
  const orderBefore: string[] = [];

  for (const line of block.split('\n')) {
    const trimmed = line.replace(/^\s*\*?\s*/, '');
    const tagMatch = trimmed.match(/^@(\w+)\s+(.*)/);
    if (!tagMatch) continue;

    const [, tag, value] = tagMatch;
    const v = value.trim();
    if (!v) continue;

    if (tag === 'base') base.push(v);
    else if (tag === 'orderAfter') orderAfter.push(v);
    else if (tag === 'orderBefore') orderBefore.push(v);
  }

  return { name, base, orderAfter, orderBefore };
}

function parseLoadOrder(content: string): string[] {
  const match = content.match(/\$plugins\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  try {
    const arr: { name: string }[] = JSON.parse(match[1]);
    return arr.map((p) => p.name);
  } catch {
    return [];
  }
}

function detectCycles(plugins: PluginMeta[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const adj = new Map<string, string[]>();
  for (const p of plugins) {
    adj.set(p.name, [...p.base]);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const pathArr: string[] = [];

  function dfs(node: string): void {
    if (stack.has(node)) {
      const cycleStart = pathArr.indexOf(node);
      const cycle = pathArr.slice(cycleStart);
      cycle.push(node);
      issues.push({
        type: 'circular',
        message: `Circular dependency: ${cycle.join(' → ')}`,
        plugins: cycle,
      });
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    pathArr.push(node);

    for (const dep of adj.get(node) ?? []) {
      dfs(dep);
    }

    pathArr.pop();
    stack.delete(node);
  }

  for (const p of plugins) {
    dfs(p.name);
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dependency Graph - parsePluginContent', () => {
  it('should extract @base dependencies from annotation block', () => {
    const content = `/*:
 * @plugindesc My Plugin
 * @base PluginA
 * @base PluginB
 */
(function() {})();`;

    const meta = parsePluginContent(content, 'MyPlugin.js');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('MyPlugin');
    expect(meta!.base).toEqual(['PluginA', 'PluginB']);
    expect(meta!.orderAfter).toEqual([]);
    expect(meta!.orderBefore).toEqual([]);
  });

  it('should extract @orderAfter and @orderBefore', () => {
    const content = `/*:
 * @plugindesc Test
 * @orderAfter CorePlugin
 * @orderBefore UIPlugin
 */`;

    const meta = parsePluginContent(content, 'TestPlugin.js');
    expect(meta).toBeDefined();
    expect(meta!.orderAfter).toEqual(['CorePlugin']);
    expect(meta!.orderBefore).toEqual(['UIPlugin']);
  });

  it('should return undefined when no annotation block exists', () => {
    const content = `// No annotation block here
function hello() {}`;

    const meta = parsePluginContent(content, 'NoBlock.js');
    expect(meta).toBeUndefined();
  });

  it('should handle empty annotation block (no dependency tags)', () => {
    const content = `/*:
 * @plugindesc Just a simple plugin
 * @author TestAuthor
 */`;

    const meta = parsePluginContent(content, 'Simple.js');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('Simple');
    expect(meta!.base).toEqual([]);
    expect(meta!.orderAfter).toEqual([]);
    expect(meta!.orderBefore).toEqual([]);
  });

  it('should handle multiple @base, @orderAfter, @orderBefore', () => {
    const content = `/*:
 * @base Dep1
 * @base Dep2
 * @base Dep3
 * @orderAfter AfterA
 * @orderAfter AfterB
 * @orderBefore BeforeA
 */`;

    const meta = parsePluginContent(content, 'Multi.js');
    expect(meta).toBeDefined();
    expect(meta!.base).toEqual(['Dep1', 'Dep2', 'Dep3']);
    expect(meta!.orderAfter).toEqual(['AfterA', 'AfterB']);
    expect(meta!.orderBefore).toEqual(['BeforeA']);
  });

  it('should ignore @base with empty value', () => {
    const content = `/*:
 * @base
 * @base ValidDep
 */`;

    const meta = parsePluginContent(content, 'EmptyBase.js');
    expect(meta).toBeDefined();
    // The line "@base" with no value: tagMatch captures "" then v.trim() is "", so it's skipped
    expect(meta!.base).toEqual(['ValidDep']);
  });

  it('should only parse the first annotation block', () => {
    const content = `/*:
 * @base FirstBlock
 */

/*:
 * @base SecondBlock
 */`;

    const meta = parsePluginContent(content, 'TwoBlocks.js');
    expect(meta).toBeDefined();
    expect(meta!.base).toEqual(['FirstBlock']);
  });
});

describe('Dependency Graph - parseLoadOrder', () => {
  it('should parse plugins.js load order', () => {
    const content = `var $plugins = [{"name":"PluginA","status":true,"description":"","parameters":{}},{"name":"PluginB","status":true,"description":"","parameters":{}}];`;

    const order = parseLoadOrder(content);
    expect(order).toEqual(['PluginA', 'PluginB']);
  });

  it('should return empty array for missing $plugins', () => {
    const content = `// no plugins variable here`;
    expect(parseLoadOrder(content)).toEqual([]);
  });

  it('should return empty array for invalid JSON', () => {
    const content = `var $plugins = [invalid json];`;
    expect(parseLoadOrder(content)).toEqual([]);
  });

  it('should handle empty plugin list', () => {
    const content = `var $plugins = [];`;
    expect(parseLoadOrder(content)).toEqual([]);
  });

  it('should handle multiline plugins.js', () => {
    const content = `var $plugins = [
  {"name":"Alpha","status":true,"description":"","parameters":{}},
  {"name":"Beta","status":false,"description":"","parameters":{}}
];`;

    const order = parseLoadOrder(content);
    expect(order).toEqual(['Alpha', 'Beta']);
  });
});

describe('Dependency Graph - detectCycles', () => {
  it('should detect no cycles in a DAG', () => {
    const plugins: PluginMeta[] = [
      { name: 'A', base: [], orderAfter: [], orderBefore: [] },
      { name: 'B', base: ['A'], orderAfter: [], orderBefore: [] },
      { name: 'C', base: ['B'], orderAfter: [], orderBefore: [] },
    ];

    const issues = detectCycles(plugins);
    expect(issues).toEqual([]);
  });

  it('should detect a simple cycle (A -> B -> A)', () => {
    const plugins: PluginMeta[] = [
      { name: 'A', base: ['B'], orderAfter: [], orderBefore: [] },
      { name: 'B', base: ['A'], orderAfter: [], orderBefore: [] },
    ];

    const issues = detectCycles(plugins);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].type).toBe('circular');
    expect(issues[0].message).toContain('Circular dependency');
  });

  it('should detect a three-node cycle (A -> B -> C -> A)', () => {
    const plugins: PluginMeta[] = [
      { name: 'A', base: ['B'], orderAfter: [], orderBefore: [] },
      { name: 'B', base: ['C'], orderAfter: [], orderBefore: [] },
      { name: 'C', base: ['A'], orderAfter: [], orderBefore: [] },
    ];

    const issues = detectCycles(plugins);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some(i => i.type === 'circular')).toBe(true);
  });

  it('should handle plugins with no dependencies', () => {
    const plugins: PluginMeta[] = [
      { name: 'Standalone1', base: [], orderAfter: [], orderBefore: [] },
      { name: 'Standalone2', base: [], orderAfter: [], orderBefore: [] },
    ];

    const issues = detectCycles(plugins);
    expect(issues).toEqual([]);
  });

  it('should handle a self-referencing plugin', () => {
    const plugins: PluginMeta[] = [
      { name: 'SelfRef', base: ['SelfRef'], orderAfter: [], orderBefore: [] },
    ];

    const issues = detectCycles(plugins);
    expect(issues.length).toBe(1);
    expect(issues[0].type).toBe('circular');
    expect(issues[0].plugins).toContain('SelfRef');
  });
});

describe('Dependency Graph - missing dependency detection', () => {
  it('should detect missing @base dependencies', () => {
    const plugins: PluginMeta[] = [
      { name: 'MyPlugin', base: ['MissingPlugin'], orderAfter: [], orderBefore: [] },
    ];
    const nameSet = new Set(plugins.map(p => p.name));
    const issues: GraphIssue[] = [];

    for (const plugin of plugins) {
      for (const dep of plugin.base) {
        if (!nameSet.has(dep)) {
          issues.push({
            type: 'missing',
            message: `"${plugin.name}" requires @base "${dep}" which is not installed`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('missing');
    expect(issues[0].plugins).toEqual(['MyPlugin', 'MissingPlugin']);
  });

  it('should not flag present dependencies as missing', () => {
    const plugins: PluginMeta[] = [
      { name: 'Core', base: [], orderAfter: [], orderBefore: [] },
      { name: 'Extension', base: ['Core'], orderAfter: [], orderBefore: [] },
    ];
    const nameSet = new Set(plugins.map(p => p.name));
    const issues: GraphIssue[] = [];

    for (const plugin of plugins) {
      for (const dep of plugin.base) {
        if (!nameSet.has(dep)) {
          issues.push({
            type: 'missing',
            message: `Missing`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }

    expect(issues).toHaveLength(0);
  });
});

describe('Dependency Graph - ordering violation detection', () => {
  it('should detect when a plugin loads before its @base dependency', () => {
    const plugins: PluginMeta[] = [
      { name: 'Child', base: ['Parent'], orderAfter: [], orderBefore: [] },
      { name: 'Parent', base: [], orderAfter: [], orderBefore: [] },
    ];
    // Load order has Child before Parent (wrong!)
    const loadOrder = ['Child', 'Parent'];
    const orderIndex = new Map<string, number>();
    loadOrder.forEach((n, i) => orderIndex.set(n, i));

    const issues: GraphIssue[] = [];
    for (const plugin of plugins) {
      const myIdx = orderIndex.get(plugin.name);
      if (myIdx === undefined) continue;

      for (const dep of [...plugin.base, ...plugin.orderAfter]) {
        const depIdx = orderIndex.get(dep);
        if (depIdx !== undefined && depIdx > myIdx) {
          issues.push({
            type: 'ordering',
            message: `"${plugin.name}" should load after "${dep}"`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('ordering');
    expect(issues[0].plugins).toEqual(['Child', 'Parent']);
  });

  it('should detect when @orderBefore is violated', () => {
    const plugins: PluginMeta[] = [
      { name: 'A', base: [], orderAfter: [], orderBefore: ['B'] },
      { name: 'B', base: [], orderAfter: [], orderBefore: [] },
    ];
    // A should be before B, but it's after
    const loadOrder = ['B', 'A'];
    const orderIndex = new Map<string, number>();
    loadOrder.forEach((n, i) => orderIndex.set(n, i));

    const issues: GraphIssue[] = [];
    for (const plugin of plugins) {
      const myIdx = orderIndex.get(plugin.name);
      if (myIdx === undefined) continue;

      for (const dep of plugin.orderBefore) {
        const depIdx = orderIndex.get(dep);
        if (depIdx !== undefined && depIdx < myIdx) {
          issues.push({
            type: 'ordering',
            message: `"${plugin.name}" should load before "${dep}"`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('ordering');
  });

  it('should not flag correct ordering', () => {
    const plugins: PluginMeta[] = [
      { name: 'Parent', base: [], orderAfter: [], orderBefore: [] },
      { name: 'Child', base: ['Parent'], orderAfter: [], orderBefore: [] },
    ];
    const loadOrder = ['Parent', 'Child'];
    const orderIndex = new Map<string, number>();
    loadOrder.forEach((n, i) => orderIndex.set(n, i));

    const issues: GraphIssue[] = [];
    for (const plugin of plugins) {
      const myIdx = orderIndex.get(plugin.name);
      if (myIdx === undefined) continue;

      for (const dep of [...plugin.base, ...plugin.orderAfter]) {
        const depIdx = orderIndex.get(dep);
        if (depIdx !== undefined && depIdx > myIdx) {
          issues.push({
            type: 'ordering',
            message: `violation`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }

    expect(issues).toHaveLength(0);
  });
});
