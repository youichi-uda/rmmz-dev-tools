import { describe, it, expect } from 'vitest';

// ── Replicated tsconfig generation logic for direct testing ──

interface TsConfigResult {
  compilerOptions: {
    target: string;
    module: string;
    outDir: string;
    rootDir: string;
    removeComments: boolean;
    strict: boolean;
    sourceMap: boolean;
    declaration: boolean;
    skipLibCheck: boolean;
    lib: string[];
  };
  include: string[];
  exclude: string[];
}

function buildTsConfig(): TsConfigResult {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'none',
      outDir: 'js',
      rootDir: 'ts',
      removeComments: false,
      strict: true,
      sourceMap: true,
      declaration: false,
      skipLibCheck: true,
      lib: ['ES2020'],
    },
    include: [
      'ts/plugins/**/*.ts',
      'ts/typings/**/*.d.ts',
    ],
    exclude: [
      'node_modules',
      'js',
    ],
  };
}

// ── Tests ──

describe('TypeScript Setup - tsconfig generation', () => {
  it('should set module to "none" for RMMZ global scope plugins', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.module).toBe('none');
  });

  it('should set removeComments to false to preserve annotation blocks', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.removeComments).toBe(false);
  });

  it('should enable sourceMap for debugger integration', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.sourceMap).toBe(true);
  });

  it('should output to js/ so ts/plugins/* maps to js/plugins/*', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.outDir).toBe('js');
  });

  it('should set rootDir to ts/ to include both plugins and typings', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.rootDir).toBe('ts');
  });

  it('should target ES2020 matching RMMZ NW.js runtime', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.target).toBe('ES2020');
  });

  it('should include ts/plugins/**/*.ts and ts/typings/**/*.d.ts', () => {
    const config = buildTsConfig();
    expect(config.include).toContain('ts/plugins/**/*.ts');
    expect(config.include).toContain('ts/typings/**/*.d.ts');
  });

  it('should exclude node_modules and js', () => {
    const config = buildTsConfig();
    expect(config.exclude).toContain('node_modules');
    expect(config.exclude).toContain('js');
  });

  it('should disable declaration output', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.declaration).toBe(false);
  });

  it('should enable strict mode', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.strict).toBe(true);
  });

  it('should NOT include DOM lib to avoid Window/StorageManager conflicts', () => {
    const config = buildTsConfig();
    expect(config.compilerOptions.lib).not.toContain('DOM');
    expect(config.compilerOptions.lib).toContain('ES2020');
  });

  it('should produce valid JSON', () => {
    const config = buildTsConfig();
    const json = JSON.stringify(config, null, 2);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('TypeScript Setup - directory structure conventions', () => {
  it('should place TS source under ts/ separate from js/ output', () => {
    const config = buildTsConfig();
    // Source and output must be different directories
    expect(config.compilerOptions.rootDir).not.toBe(config.compilerOptions.outDir);
    // rootDir=ts + outDir=js means ts/plugins/X.ts → js/plugins/X.js
    expect(config.compilerOptions.outDir).toBe('js');
    expect(config.compilerOptions.rootDir).toBe('ts');
    // Source must be outside js/ to avoid tsc compiling its own output
    expect(config.compilerOptions.rootDir).not.toMatch(/^js\//);
  });

  it('should not include js/ in compilation to avoid recompiling output', () => {
    const config = buildTsConfig();
    expect(config.exclude).toContain('js');
  });

  it('should include typings alongside plugin sources for type resolution', () => {
    const config = buildTsConfig();
    const hasTypingsInclude = config.include.some(p => p.includes('typings') && p.endsWith('.d.ts'));
    expect(hasTypingsInclude).toBe(true);
  });

  it('should keep rootDir and include patterns consistent', () => {
    const config = buildTsConfig();
    // The include pattern for plugins should reference the same base as rootDir
    const pluginInclude = config.include.find(p => p.includes('plugins') && p.endsWith('.ts'));
    expect(pluginInclude).toBeDefined();
    expect(pluginInclude!.startsWith(config.compilerOptions.rootDir.replace(/\/?$/, ''))).toBe(true);
  });
});

describe('TypeScript Setup - type definition file filtering', () => {
  /**
   * Replicated logic: only .d.ts files should be copied from typings dir
   */
  function filterDtsFiles(files: string[]): string[] {
    return files.filter(f => f.endsWith('.d.ts'));
  }

  it('should only copy .d.ts files', () => {
    const files = [
      'rmmz_core.d.ts',
      'rmmz_managers.d.ts',
      'pixi.d.ts',
      'README.md',
      '.gitkeep',
      'test.js',
    ];

    const result = filterDtsFiles(files);
    expect(result).toEqual(['rmmz_core.d.ts', 'rmmz_managers.d.ts', 'pixi.d.ts']);
  });

  it('should handle empty directory', () => {
    expect(filterDtsFiles([])).toEqual([]);
  });

  it('should handle directory with no .d.ts files', () => {
    const files = ['readme.txt', 'config.json'];
    expect(filterDtsFiles(files)).toEqual([]);
  });
});
