import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { isProLicensed } from '../license/gumroad';

/**
 * Maps $data* global names to their corresponding JSON filenames and
 * the key stats to display on hover.
 */
const DATA_GLOBALS: Record<string, { file: string; stats: string[] }> = {
  '$dataActors':       { file: 'Actors.json',       stats: ['name', 'nickname', 'classId', 'initialLevel', 'maxLevel'] },
  '$dataClasses':      { file: 'Classes.json',      stats: ['name', 'expParams'] },
  '$dataSkills':       { file: 'Skills.json',       stats: ['name', 'description', 'mpCost', 'tpCost', 'scope'] },
  '$dataItems':        { file: 'Items.json',        stats: ['name', 'description', 'price', 'consumable'] },
  '$dataWeapons':      { file: 'Weapons.json',      stats: ['name', 'description', 'price', 'wtypeId'] },
  '$dataArmors':       { file: 'Armors.json',       stats: ['name', 'description', 'price', 'atypeId', 'etypeId'] },
  '$dataEnemies':      { file: 'Enemies.json',      stats: ['name', 'exp', 'gold'] },
  '$dataTroops':       { file: 'Troops.json',       stats: ['name'] },
  '$dataStates':       { file: 'States.json',       stats: ['name', 'restriction', 'priority', 'removeAtBattleEnd'] },
  '$dataAnimations':   { file: 'Animations.json',   stats: ['name'] },
  '$dataTilesets':     { file: 'Tilesets.json',     stats: ['name', 'mode'] },
  '$dataCommonEvents': { file: 'CommonEvents.json', stats: ['name', 'trigger'] },
  '$dataSystem':       { file: 'System.json',       stats: ['gameTitle'] },
};

/** Pattern for $dataXxx[N] */
const DATA_ACCESS_PATTERN = /(\$data\w+)\[(\d+)\]/g;

/** Pattern for $gameSwitches.value(N) or $gameSwitches.setValue(N */
const SWITCH_PATTERN = /\$gameSwitches\.(?:set)?[Vv]alue\((\d+)/g;

/** Pattern for $gameVariables.value(N) or $gameVariables.setValue(N */
const VARIABLE_PATTERN = /\$gameVariables\.(?:set)?[Vv]alue\((\d+)/g;

// ---------------------------------------------------------------------------
// DataCache
// ---------------------------------------------------------------------------

/**
 * Reads and caches data JSON files from a workspace's `data/` directory.
 * Watches for file changes and invalidates accordingly.
 */
export class DataCache {
  private cache = new Map<string, unknown[]>();
  private watcher: vscode.FileSystemWatcher | undefined;
  private dataDir: string | undefined;

  constructor() {
    this.resolveDataDir();
  }

  /** Locate the `data/` directory in the first workspace folder that has one. */
  private resolveDataDir(): void {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;
    for (const folder of folders) {
      const candidate = path.join(folder.uri.fsPath, 'data');
      if (fs.existsSync(candidate)) {
        this.dataDir = candidate;
        return;
      }
    }
  }

  /** Start watching the data directory for changes. */
  startWatching(): vscode.Disposable[] {
    if (!this.dataDir) return [];
    const pattern = new vscode.RelativePattern(this.dataDir, '*.json');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    const invalidate = (uri: vscode.Uri) => {
      const basename = path.basename(uri.fsPath);
      this.cache.delete(basename);
    };

    this.watcher.onDidChange(invalidate);
    this.watcher.onDidCreate(invalidate);
    this.watcher.onDidDelete(invalidate);

    return [this.watcher];
  }

  /** Read and return parsed array data for the given filename (e.g. `Actors.json`). */
  getData(filename: string): unknown[] | undefined {
    if (!this.dataDir) {
      this.resolveDataDir();
      if (!this.dataDir) return undefined;
    }

    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    const filePath = path.join(this.dataDir, filename);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.cache.set(filename, parsed);
        return parsed;
      }
      // System.json is an object, not an array -- wrap for uniform access
      this.cache.set(filename, [parsed]);
      return [parsed];
    } catch {
      return undefined;
    }
  }

  /** Get System.json as a plain object. */
  getSystem(): Record<string, unknown> | undefined {
    const filePath = this.dataDir ? path.join(this.dataDir, 'System.json') : undefined;
    if (!filePath) {
      this.resolveDataDir();
      if (!this.dataDir) return undefined;
    }
    try {
      const raw = fs.readFileSync(path.join(this.dataDir!, 'System.json'), 'utf-8');
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// DataHoverProvider
// ---------------------------------------------------------------------------

export class DataHoverProvider implements vscode.HoverProvider {
  constructor(private cache: DataCache) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    if (!isProLicensed()) return undefined;

    const lineText = document.lineAt(position).text;

    return (
      this.hoverDataAccess(lineText, position) ??
      this.hoverSwitch(lineText, position) ??
      this.hoverVariable(lineText, position)
    );
  }

  // -- $dataXxx[N] ----------------------------------------------------------

  private hoverDataAccess(
    lineText: string,
    position: vscode.Position
  ): vscode.Hover | undefined {
    DATA_ACCESS_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATA_ACCESS_PATTERN.exec(lineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character < start || position.character > end) continue;

      const globalName = match[1];
      const index = parseInt(match[2], 10);
      const meta = DATA_GLOBALS[globalName];
      if (!meta) continue;

      const data = this.cache.getData(meta.file);
      if (!data) continue;

      const entry = data[index] as Record<string, unknown> | null | undefined;
      if (!entry) {
        return this.makeHover(
          `**${globalName}[${index}]** -- not found in \`${meta.file}\``,
          position,
          start,
          end
        );
      }

      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${globalName}[${index}]**\n\n`);
      for (const key of meta.stats) {
        if (key in entry) {
          md.appendMarkdown(`- **${key}:** \`${JSON.stringify(entry[key])}\`\n`);
        }
      }
      return new vscode.Hover(md, new vscode.Range(position.line, start, position.line, end));
    }
    return undefined;
  }

  // -- $gameSwitches ---------------------------------------------------------

  private hoverSwitch(
    lineText: string,
    position: vscode.Position
  ): vscode.Hover | undefined {
    SWITCH_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SWITCH_PATTERN.exec(lineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character < start || position.character > end) continue;

      const id = parseInt(match[1], 10);
      const system = this.cache.getSystem();
      const switches = system?.switches as string[] | undefined;
      const name = switches?.[id];

      const label = name ? `"${name}"` : '(unnamed)';
      return this.makeHover(
        `**Switch #${id}** -- ${label}`,
        position,
        start,
        end
      );
    }
    return undefined;
  }

  // -- $gameVariables --------------------------------------------------------

  private hoverVariable(
    lineText: string,
    position: vscode.Position
  ): vscode.Hover | undefined {
    VARIABLE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = VARIABLE_PATTERN.exec(lineText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (position.character < start || position.character > end) continue;

      const id = parseInt(match[1], 10);
      const system = this.cache.getSystem();
      const variables = system?.variables as string[] | undefined;
      const name = variables?.[id];

      const label = name ? `"${name}"` : '(unnamed)';
      return this.makeHover(
        `**Variable #${id}** -- ${label}`,
        position,
        start,
        end
      );
    }
    return undefined;
  }

  // -- helpers ---------------------------------------------------------------

  private makeHover(
    markdown: string,
    position: vscode.Position,
    start: number,
    end: number
  ): vscode.Hover {
    return new vscode.Hover(
      new vscode.MarkdownString(markdown),
      new vscode.Range(position.line, start, position.line, end)
    );
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the data hover provider and file watcher.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const jsSelector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  const cache = new DataCache();
  const disposables = cache.startWatching();
  context.subscriptions.push(...disposables);

  const provider = new DataHoverProvider(cache);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(jsSelector, provider)
  );
}
