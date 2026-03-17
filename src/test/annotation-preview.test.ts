import { describe, it, expect } from 'vitest';

/**
 * The annotation preview module (src/preview/annotationPreview.ts) keeps
 * `extractAnnotationLines` and `parseAnnotation` module-private.
 *
 * We replicate the pure parsing logic here to test it in isolation.
 * If these functions were exported, we could import them directly.
 */

// ---------------------------------------------------------------------------
// Replicated types and functions from annotationPreview.ts
// ---------------------------------------------------------------------------

interface OptionEntry {
  text: string;
  value?: string;
}

interface ParamInfo {
  name: string;
  text: string;
  desc: string;
  type: string;
  default: string;
  options: OptionEntry[];
  min?: string;
  max?: string;
  parent?: string;
  on?: string;
  off?: string;
}

interface ArgInfo {
  name: string;
  text: string;
  desc: string;
  type: string;
  default: string;
  options: OptionEntry[];
  min?: string;
  max?: string;
}

interface CommandInfo {
  name: string;
  text: string;
  desc: string;
  args: ArgInfo[];
}

interface AnnotationData {
  plugindesc: string;
  author: string;
  url: string;
  help: string;
  params: ParamInfo[];
  commands: CommandInfo[];
}

function extractAnnotationLines(text: string): string[] | undefined {
  const lines = text.split('\n');
  let inBlock = false;
  let blockLines: string[] = [];

  for (const line of lines) {
    if (!inBlock) {
      if (/\/\*:\s*$|\/\*:\s/.test(line) && !/:[\w]/.test(line.replace('/*:', ''))) {
        const idx = line.indexOf('/*:');
        if (idx === -1) continue;
        const after = line.substring(idx + 3).trimStart();
        if (after.length > 0 && /^[a-zA-Z]/.test(after)) continue;
        inBlock = true;
        blockLines = [];
        continue;
      }
    }

    if (inBlock) {
      if (line.includes('*/')) {
        blockLines.push(line.substring(0, line.indexOf('*/')));
        break;
      }
      blockLines.push(line);
    }
  }

  return inBlock ? blockLines : undefined;
}

function makeParam(name: string): ParamInfo {
  return { name, text: name, desc: '', type: 'string', default: '', options: [] };
}

function makeArg(name: string): ArgInfo {
  return { name, text: name, desc: '', type: 'string', default: '', options: [] };
}

function applySubTag(target: ParamInfo | ArgInfo, tag: string, value: string): void {
  switch (tag) {
    case 'text': target.text = value; break;
    case 'desc': target.desc = value; break;
    case 'type': target.type = value; break;
    case 'default': target.default = value; break;
    case 'min': (target as ParamInfo).min = value; break;
    case 'max': (target as ParamInfo).max = value; break;
    case 'parent': (target as ParamInfo).parent = value; break;
    case 'on': (target as ParamInfo).on = value; break;
    case 'off': (target as ParamInfo).off = value; break;
    case 'option': target.options.push({ text: value }); break;
    case 'value':
      if (target.options.length > 0) {
        target.options[target.options.length - 1].value = value;
      }
      break;
  }
}

function parseAnnotation(lines: string[]): AnnotationData {
  const data: AnnotationData = {
    plugindesc: '',
    author: '',
    url: '',
    help: '',
    params: [],
    commands: [],
  };

  type Scope = 'top' | 'param' | 'command' | 'arg';
  let scope: Scope = 'top';
  let helpLines: string[] = [];
  let inHelp = false;
  let currentParam: ParamInfo | undefined;
  let currentCommand: CommandInfo | undefined;
  let currentArg: ArgInfo | undefined;

  const tagRegex = /^\s*\*?\s*@(\w+)\s*(.*)?$/;

  for (const rawLine of lines) {
    const m = rawLine.match(tagRegex);

    if (!m) {
      if (inHelp) {
        const trimmed = rawLine.replace(/^\s*\*?\s?/, '');
        helpLines.push(trimmed);
      }
      continue;
    }

    const tag = m[1];
    const rest = (m[2] ?? '').trim();

    if (inHelp && tag !== 'help') {
      data.help = helpLines.join('\n').trimEnd();
      inHelp = false;
    }

    if (tag === 'param') {
      if (currentParam) data.params.push(currentParam);
      currentParam = makeParam(rest);
      currentArg = undefined;
      scope = 'param';
      continue;
    }

    if (tag === 'command') {
      if (currentParam) { data.params.push(currentParam); currentParam = undefined; }
      if (currentArg && currentCommand) { currentCommand.args.push(currentArg); currentArg = undefined; }
      if (currentCommand) data.commands.push(currentCommand);
      currentCommand = { name: rest, text: rest, desc: '', args: [] };
      scope = 'command';
      continue;
    }

    if (tag === 'arg') {
      if (currentArg && currentCommand) currentCommand.args.push(currentArg);
      if (currentParam) { data.params.push(currentParam); currentParam = undefined; }
      currentArg = makeArg(rest);
      scope = 'arg';
      continue;
    }

    if (tag === 'plugindesc') { data.plugindesc = rest; scope = 'top'; continue; }
    if (tag === 'author') { data.author = rest; scope = 'top'; continue; }
    if (tag === 'url') { data.url = rest; scope = 'top'; continue; }
    if (tag === 'target') { scope = 'top'; continue; }

    if (tag === 'help') {
      inHelp = true;
      helpLines = rest.length > 0 ? [rest] : [];
      scope = 'top';
      continue;
    }

    if (scope === 'param' && currentParam) {
      applySubTag(currentParam, tag, rest);
      continue;
    }

    if (scope === 'arg' && currentArg) {
      applySubTag(currentArg, tag, rest);
      continue;
    }

    if (scope === 'command' && currentCommand) {
      if (tag === 'text') currentCommand.text = rest;
      else if (tag === 'desc') currentCommand.desc = rest;
      continue;
    }
  }

  if (inHelp) {
    data.help = helpLines.join('\n').trimEnd();
  }

  if (currentArg && currentCommand) currentCommand.args.push(currentArg);
  if (currentParam) data.params.push(currentParam);
  if (currentCommand) data.commands.push(currentCommand);

  return data;
}

// ---------------------------------------------------------------------------
// Tests: extractAnnotationLines
// ---------------------------------------------------------------------------

describe('Annotation Preview - extractAnnotationLines', () => {
  it('should extract lines from a basic /*: block', () => {
    const text = `/*:
 * @plugindesc My Plugin
 * @author Test
 */`;
    const lines = extractAnnotationLines(text);
    expect(lines).toBeDefined();
    // 3 lines: two tag lines + the partial line before */
    expect(lines!.length).toBe(3);
    expect(lines![0]).toContain('@plugindesc');
    expect(lines![1]).toContain('@author');
  });

  it('should skip locale-specific blocks like /*:ja', () => {
    const text = `/*:ja
 * @plugindesc Japanese description
 */
/*:
 * @plugindesc English description
 */`;
    const lines = extractAnnotationLines(text);
    expect(lines).toBeDefined();
    // Should pick the /*: block, not /*:ja
    expect(lines!.some(l => l.includes('English'))).toBe(true);
  });

  it('should return undefined when no annotation block exists', () => {
    const text = `// Just a regular JS file
function hello() {}`;
    const lines = extractAnnotationLines(text);
    expect(lines).toBeUndefined();
  });

  it('should handle annotation block with content after /*:', () => {
    const text = `/*:
 * @plugindesc Test Plugin
 * @author Author
 */`;
    const lines = extractAnnotationLines(text);
    expect(lines).toBeDefined();
    expect(lines!.length).toBeGreaterThan(0);
  });

  it('should stop at the closing */', () => {
    const text = `/*:
 * @plugindesc First Plugin
 */
// Some other code
/*:
 * @plugindesc Second Plugin
 */`;
    const lines = extractAnnotationLines(text);
    expect(lines).toBeDefined();
    // Should only contain lines from the first block
    expect(lines!.some(l => l.includes('First'))).toBe(true);
    expect(lines!.some(l => l.includes('Second'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseAnnotation - basic metadata
// ---------------------------------------------------------------------------

describe('Annotation Preview - parseAnnotation basics', () => {
  it('should parse plugindesc, author, and url', () => {
    const lines = [
      ' * @plugindesc My Awesome Plugin',
      ' * @author John Doe',
      ' * @url https://example.com/plugin',
    ];
    const data = parseAnnotation(lines);
    expect(data.plugindesc).toBe('My Awesome Plugin');
    expect(data.author).toBe('John Doe');
    expect(data.url).toBe('https://example.com/plugin');
  });

  it('should handle missing metadata gracefully', () => {
    const data = parseAnnotation([]);
    expect(data.plugindesc).toBe('');
    expect(data.author).toBe('');
    expect(data.url).toBe('');
    expect(data.help).toBe('');
    expect(data.params).toEqual([]);
    expect(data.commands).toEqual([]);
  });

  it('should parse @help text across multiple lines', () => {
    const lines = [
      ' * @plugindesc Test',
      ' * @help',
      ' * This is the first line of help.',
      ' * This is the second line.',
      ' *',
      ' * Another paragraph.',
    ];
    const data = parseAnnotation(lines);
    expect(data.help).toContain('This is the first line of help.');
    expect(data.help).toContain('This is the second line.');
    expect(data.help).toContain('Another paragraph.');
  });

  it('should parse @help with inline text', () => {
    const lines = [
      ' * @help This is inline help text',
      ' * continued on next line.',
    ];
    const data = parseAnnotation(lines);
    expect(data.help).toContain('This is inline help text');
    expect(data.help).toContain('continued on next line.');
  });

  it('should end help accumulation when a new tag appears', () => {
    const lines = [
      ' * @help Some help text',
      ' * more help',
      ' * @param myParam',
    ];
    const data = parseAnnotation(lines);
    expect(data.help).toContain('Some help text');
    expect(data.help).toContain('more help');
    expect(data.help).not.toContain('myParam');
    expect(data.params).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseAnnotation - parameters
// ---------------------------------------------------------------------------

describe('Annotation Preview - parseAnnotation parameters', () => {
  it('should parse a basic parameter with sub-tags', () => {
    const lines = [
      ' * @param Speed',
      ' * @text Movement Speed',
      ' * @desc How fast the character moves.',
      ' * @type number',
      ' * @default 4',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(1);

    const p = data.params[0];
    expect(p.name).toBe('Speed');
    expect(p.text).toBe('Movement Speed');
    expect(p.desc).toBe('How fast the character moves.');
    expect(p.type).toBe('number');
    expect(p.default).toBe('4');
  });

  it('should parse multiple parameters', () => {
    const lines = [
      ' * @param ParamA',
      ' * @text First Param',
      ' * @type string',
      ' * @param ParamB',
      ' * @text Second Param',
      ' * @type boolean',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(2);
    expect(data.params[0].name).toBe('ParamA');
    expect(data.params[1].name).toBe('ParamB');
  });

  it('should parse parameter with options', () => {
    const lines = [
      ' * @param Difficulty',
      ' * @type select',
      ' * @option Easy',
      ' * @value 1',
      ' * @option Normal',
      ' * @value 2',
      ' * @option Hard',
      ' * @value 3',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(1);

    const p = data.params[0];
    expect(p.options).toHaveLength(3);
    expect(p.options[0]).toEqual({ text: 'Easy', value: '1' });
    expect(p.options[1]).toEqual({ text: 'Normal', value: '2' });
    expect(p.options[2]).toEqual({ text: 'Hard', value: '3' });
  });

  it('should parse min, max, on, off sub-tags', () => {
    const lines = [
      ' * @param Volume',
      ' * @type number',
      ' * @min 0',
      ' * @max 100',
      ' * @param Enabled',
      ' * @type boolean',
      ' * @on ON',
      ' * @off OFF',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(2);
    expect(data.params[0].min).toBe('0');
    expect(data.params[0].max).toBe('100');
    expect(data.params[1].on).toBe('ON');
    expect(data.params[1].off).toBe('OFF');
  });

  it('should parse parent sub-tag for nested params', () => {
    const lines = [
      ' * @param child',
      ' * @parent parentGroup',
      ' * @text Child Parameter',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(1);
    expect(data.params[0].parent).toBe('parentGroup');
  });

  it('should default type to string when not specified', () => {
    const lines = [
      ' * @param SimpleParam',
      ' * @text A Simple Param',
    ];
    const data = parseAnnotation(lines);
    expect(data.params[0].type).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Tests: parseAnnotation - commands
// ---------------------------------------------------------------------------

describe('Annotation Preview - parseAnnotation commands', () => {
  it('should parse a command with text and desc', () => {
    const lines = [
      ' * @command SpawnEnemy',
      ' * @text Spawn Enemy',
      ' * @desc Spawns an enemy at the specified location.',
    ];
    const data = parseAnnotation(lines);
    expect(data.commands).toHaveLength(1);

    const c = data.commands[0];
    expect(c.name).toBe('SpawnEnemy');
    expect(c.text).toBe('Spawn Enemy');
    expect(c.desc).toBe('Spawns an enemy at the specified location.');
  });

  it('should parse command with arguments', () => {
    const lines = [
      ' * @command TeleportPlayer',
      ' * @text Teleport',
      ' * @desc Teleports the player.',
      ' * @arg mapId',
      ' * @text Map ID',
      ' * @type number',
      ' * @desc Target map ID.',
      ' * @arg x',
      ' * @text X Position',
      ' * @type number',
    ];
    const data = parseAnnotation(lines);
    expect(data.commands).toHaveLength(1);

    const c = data.commands[0];
    expect(c.args).toHaveLength(2);
    expect(c.args[0].name).toBe('mapId');
    expect(c.args[0].text).toBe('Map ID');
    expect(c.args[0].type).toBe('number');
    expect(c.args[0].desc).toBe('Target map ID.');
    expect(c.args[1].name).toBe('x');
    expect(c.args[1].text).toBe('X Position');
  });

  it('should parse multiple commands', () => {
    const lines = [
      ' * @command CmdA',
      ' * @text Command A',
      ' * @command CmdB',
      ' * @text Command B',
    ];
    const data = parseAnnotation(lines);
    expect(data.commands).toHaveLength(2);
    expect(data.commands[0].name).toBe('CmdA');
    expect(data.commands[1].name).toBe('CmdB');
  });

  it('should handle command with no args', () => {
    const lines = [
      ' * @command NoArgs',
      ' * @text A command with no arguments',
      ' * @desc Does something simple.',
    ];
    const data = parseAnnotation(lines);
    expect(data.commands).toHaveLength(1);
    expect(data.commands[0].args).toEqual([]);
  });

  it('should flush params when switching to commands', () => {
    const lines = [
      ' * @param MyParam',
      ' * @text My Parameter',
      ' * @command MyCommand',
      ' * @text My Command',
    ];
    const data = parseAnnotation(lines);
    expect(data.params).toHaveLength(1);
    expect(data.params[0].name).toBe('MyParam');
    expect(data.commands).toHaveLength(1);
    expect(data.commands[0].name).toBe('MyCommand');
  });
});

// ---------------------------------------------------------------------------
// Tests: parseAnnotation - edge cases
// ---------------------------------------------------------------------------

describe('Annotation Preview - parseAnnotation edge cases', () => {
  it('should handle annotation with only @plugindesc', () => {
    const lines = [' * @plugindesc Minimal Plugin'];
    const data = parseAnnotation(lines);
    expect(data.plugindesc).toBe('Minimal Plugin');
    expect(data.params).toEqual([]);
    expect(data.commands).toEqual([]);
  });

  it('should handle command text defaulting to command name', () => {
    const lines = [' * @command SomeName'];
    const data = parseAnnotation(lines);
    expect(data.commands[0].text).toBe('SomeName');
    expect(data.commands[0].name).toBe('SomeName');
  });

  it('should ignore @target tag', () => {
    const lines = [
      ' * @target MZ',
      ' * @plugindesc Test',
    ];
    const data = parseAnnotation(lines);
    expect(data.plugindesc).toBe('Test');
  });

  it('should handle option without value', () => {
    const lines = [
      ' * @param Color',
      ' * @type select',
      ' * @option Red',
      ' * @option Blue',
    ];
    const data = parseAnnotation(lines);
    expect(data.params[0].options).toEqual([
      { text: 'Red' },
      { text: 'Blue' },
    ]);
  });

  it('should handle a full realistic annotation block', () => {
    const lines = [
      ' * @plugindesc Battle Enhancement Plugin',
      ' * @author GameDev',
      ' * @url https://example.com',
      ' *',
      ' * @param battleSpeed',
      ' * @text Battle Speed',
      ' * @type number',
      ' * @default 1',
      ' * @min 1',
      ' * @max 10',
      ' * @desc Controls the speed of battle animations.',
      ' *',
      ' * @command StartBossBattle',
      ' * @text Start Boss Battle',
      ' * @desc Initiates a boss encounter.',
      ' * @arg bossId',
      ' * @text Boss ID',
      ' * @type number',
      ' * @default 1',
      ' *',
      ' * @help',
      ' * This plugin enhances the battle system.',
      ' * Use the plugin command to start boss battles.',
    ];
    const data = parseAnnotation(lines);

    expect(data.plugindesc).toBe('Battle Enhancement Plugin');
    expect(data.author).toBe('GameDev');
    expect(data.url).toBe('https://example.com');
    expect(data.params).toHaveLength(1);
    expect(data.params[0].name).toBe('battleSpeed');
    expect(data.params[0].min).toBe('1');
    expect(data.params[0].max).toBe('10');
    expect(data.commands).toHaveLength(1);
    expect(data.commands[0].name).toBe('StartBossBattle');
    expect(data.commands[0].args).toHaveLength(1);
    expect(data.commands[0].args[0].name).toBe('bossId');
    expect(data.help).toContain('enhances the battle system');
    expect(data.help).toContain('boss battles');
  });
});
