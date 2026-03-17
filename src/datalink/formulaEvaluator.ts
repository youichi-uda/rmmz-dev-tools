import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { isProLicensed } from '../license/gumroad';

/**
 * MZ base parameter indices:
 * 0=MHP, 1=MMP, 2=ATK, 3=DEF, 4=MAT, 5=MDF, 6=AGI, 7=LUK
 */
const PARAM_NAMES = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'] as const;

/** Pattern to detect MZ damage formula variables in a string. */
const FORMULA_VAR_PATTERN = /\b[ab]\.(mhp|mmp|atk|def|mat|mdf|agi|luk)\b/;

/** Match a string literal (single or double quoted) that looks like a formula. */
const STRING_LITERAL_PATTERN = /(["'`])([^"'`]*\b[ab]\.(?:mhp|mmp|atk|def|mat|mdf|agi|luk)\b[^"'`]*)\1/g;

interface ParamBlock {
  mhp: number; mmp: number; atk: number; def: number;
  mat: number; mdf: number; agi: number; luk: number;
  [key: string]: number;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function findDataDir(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return undefined;
  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, 'data');
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function loadBaseParams(dataDir: string, file: string, index: number): ParamBlock | undefined {
  try {
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return undefined;
    const entry = arr[index] as Record<string, unknown> | null;
    if (!entry) return undefined;

    const params = entry.params as number[][] | number[] | undefined;
    if (!params) return undefined;

    // MZ params can be either:
    // - A 2D array: params[paramIndex][level] (Classes.json style curves)
    // - A flat array: params[paramIndex] (Enemies.json style)
    const block: ParamBlock = { mhp: 0, mmp: 0, atk: 0, def: 0, mat: 0, mdf: 0, agi: 0, luk: 0 };
    for (let i = 0; i < PARAM_NAMES.length; i++) {
      const val = params[i];
      if (Array.isArray(val)) {
        // 2D array — pick level 1 value (index 1, since index 0 is level 0)
        block[PARAM_NAMES[i]] = val[1] ?? val[0] ?? 0;
      } else if (typeof val === 'number') {
        block[PARAM_NAMES[i]] = val;
      }
    }
    return block;
  } catch {
    return undefined;
  }
}

function getActorParams(dataDir: string): ParamBlock | undefined {
  // Try Actors.json first; if it has params, use those.
  // Otherwise try to get class params from Classes.json via the actor's classId.
  try {
    const raw = fs.readFileSync(path.join(dataDir, 'Actors.json'), 'utf-8');
    const actors = JSON.parse(raw);
    const actor = actors?.[1] as Record<string, unknown> | null;
    if (!actor) return undefined;

    // If actor has params directly, use them
    if (actor.params) {
      const result = loadBaseParams(dataDir, 'Actors.json', 1);
      if (result && (result.atk > 0 || result.mhp > 0)) return result;
    }

    // Otherwise use class params
    const classId = actor.classId as number | undefined;
    if (classId) {
      return loadBaseParams(dataDir, 'Classes.json', classId);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function getEnemyParams(dataDir: string): ParamBlock | undefined {
  return loadBaseParams(dataDir, 'Enemies.json', 1);
}

// ---------------------------------------------------------------------------
// Formula evaluation
// ---------------------------------------------------------------------------

function evaluateFormula(formula: string, a: ParamBlock, b: ParamBlock): number | string {
  // Build a safe evaluation context
  try {
    // Create proxy objects that expose .atk, .def, etc.
    const fn = new Function('a', 'b', `"use strict"; return (${formula});`);
    const result = fn(a, b);
    if (typeof result === 'number') {
      return Math.round(result);
    }
    return String(result);
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ---------------------------------------------------------------------------
// HoverProvider
// ---------------------------------------------------------------------------

class FormulaHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    if (!isProLicensed()) return undefined;

    const lineText = document.lineAt(position).text;

    STRING_LITERAL_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = STRING_LITERAL_PATTERN.exec(lineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character < start || position.character > end) continue;

      const formula = match[2];
      if (!FORMULA_VAR_PATTERN.test(formula)) continue;

      return this.buildHover(formula, position, start, end);
    }

    return undefined;
  }

  private buildHover(
    formula: string,
    position: vscode.Position,
    start: number,
    end: number
  ): vscode.Hover | undefined {
    const dataDir = findDataDir();
    if (!dataDir) return undefined;

    const actorParams = getActorParams(dataDir);
    const enemyParams = getEnemyParams(dataDir);

    if (!actorParams && !enemyParams) return undefined;

    const a = actorParams ?? { mhp: 500, mmp: 100, atk: 30, def: 20, mat: 25, mdf: 20, agi: 25, luk: 20 };
    const b = enemyParams ?? { mhp: 300, mmp: 50, atk: 25, def: 15, mat: 20, mdf: 15, agi: 20, luk: 15 };

    const result = evaluateFormula(formula, a, b);

    const md = new vscode.MarkdownString();
    md.appendMarkdown('**MZ Damage Formula Preview**\n\n');
    md.appendCodeblock(formula, 'javascript');
    md.appendMarkdown('\n');
    md.appendMarkdown(`**a** (Actor #1): ATK=${a.atk} DEF=${a.def} MAT=${a.mat} MDF=${a.mdf} AGI=${a.agi} LUK=${a.luk} MHP=${a.mhp} MMP=${a.mmp}\n\n`);
    md.appendMarkdown(`**b** (Enemy #1): ATK=${b.atk} DEF=${b.def} MAT=${b.mat} MDF=${b.mdf} AGI=${b.agi} LUK=${b.luk} MHP=${b.mhp} MMP=${b.mmp}\n\n`);
    md.appendMarkdown(`**Result:** \`${result}\`\n`);

    return new vscode.Hover(md, new vscode.Range(position.line, start, position.line, end));
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
  const jsSelector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(jsSelector, new FormulaHoverProvider())
  );
}
