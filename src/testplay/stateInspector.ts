import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CdpClient, getDebuggerWsUrl } from '../cdp/client';
import { isProLicensed } from '../license/gumroad';

// ---------------------------------------------------------------------------
// Tree item types
// ---------------------------------------------------------------------------

type NodeKind = 'root' | 'detail';

class GameStateItem extends vscode.TreeItem {
  constructor(
    public readonly kind: NodeKind,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly category?: string,
    public readonly children?: GameStateItem[]
  ) {
    super(label, collapsibleState);
  }
}

// ---------------------------------------------------------------------------
// CDP helpers
// ---------------------------------------------------------------------------

let cdpClient: CdpClient | null = null;

async function ensureConnected(): Promise<CdpClient | null> {
  if (cdpClient?.isConnected()) return cdpClient;

  cdpClient?.disconnect();
  cdpClient = null;

  try {
    const wsUrl = await getDebuggerWsUrl();
    const client = new CdpClient();
    await client.connect(wsUrl);
    client.send('Runtime.enable');
    cdpClient = client;

    client.on('close', () => {
      cdpClient = null;
    });

    return client;
  } catch {
    return null;
  }
}

async function evaluate(expression: string): Promise<unknown> {
  const client = await ensureConnected();
  if (!client) return undefined;

  try {
    const result = await client.sendAndWait('Runtime.evaluate', {
      expression,
      returnByValue: true,
    }) as Record<string, unknown>;
    const inner = result.result as Record<string, unknown> | undefined;
    return inner?.value;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchParty(): Promise<GameStateItem[]> {
  const data = await evaluate(`
    (function() {
      if (typeof $gameParty === 'undefined' || !$gameParty._actors) return null;
      return $gameParty.members().map(function(a) {
        return {
          name: a.name(), level: a.level,
          hp: a.hp, mhp: a.mhp, mp: a.mp, mmp: a.mmp,
          className: a.currentClass() ? a.currentClass().name : ''
        };
      });
    })()
  `);
  if (!Array.isArray(data)) return [makeDetail('(No party data)')];
  return data.map((m: Record<string, unknown>) => {
    const item = new GameStateItem('detail',
      `${m.name} Lv${m.level} (${m.className})`,
      vscode.TreeItemCollapsibleState.None);
    item.description = `HP ${m.hp}/${m.mhp}  MP ${m.mp}/${m.mmp}`;
    item.iconPath = new vscode.ThemeIcon('person');
    return item;
  });
}

async function fetchSwitches(): Promise<GameStateItem[]> {
  const systemNames = loadSystemNames('switches');
  const data = await evaluate(`
    (function() {
      if (typeof $gameSwitches === 'undefined') return null;
      var d = $gameSwitches._data;
      var result = [];
      for (var i = 1; i < d.length; i++) {
        if (d[i] !== undefined) result.push({ id: i, value: !!d[i] });
      }
      return result;
    })()
  `);
  if (!Array.isArray(data)) return [makeDetail('(No switch data)')];
  const items: GameStateItem[] = [];
  for (const sw of data) {
    const s = sw as { id: number; value: boolean };
    const name = systemNames[s.id] || `(unnamed)`;
    const item = makeDetail(`#${s.id} ${name}: ${s.value ? 'ON' : 'OFF'}`);
    item.iconPath = new vscode.ThemeIcon(s.value ? 'circle-filled' : 'circle-outline');
    items.push(item);
  }
  if (items.length === 0) items.push(makeDetail('(All switches off)'));
  return items;
}

async function fetchVariables(): Promise<GameStateItem[]> {
  const systemNames = loadSystemNames('variables');
  const data = await evaluate(`
    (function() {
      if (typeof $gameVariables === 'undefined') return null;
      var d = $gameVariables._data;
      var result = [];
      for (var i = 1; i < d.length; i++) {
        if (d[i] !== undefined && d[i] !== 0) result.push({ id: i, value: d[i] });
      }
      return result;
    })()
  `);
  if (!Array.isArray(data)) return [makeDetail('(No variable data)')];
  const items: GameStateItem[] = [];
  for (const v of data) {
    const vr = v as { id: number; value: unknown };
    const name = systemNames[vr.id] || `(unnamed)`;
    const item = makeDetail(`#${vr.id} ${name} = ${JSON.stringify(vr.value)}`);
    item.iconPath = new vscode.ThemeIcon('symbol-variable');
    items.push(item);
  }
  if (items.length === 0) items.push(makeDetail('(All variables at 0)'));
  return items;
}

async function fetchItems(): Promise<GameStateItem[]> {
  const data = await evaluate(`
    (function() {
      if (typeof $gameParty === 'undefined') return null;
      var result = [];
      var items = $gameParty.items();
      for (var i = 0; i < items.length; i++) {
        result.push({ name: items[i].name, count: $gameParty.numItems(items[i]), kind: 'Item' });
      }
      var weapons = $gameParty.weapons();
      for (var i = 0; i < weapons.length; i++) {
        result.push({ name: weapons[i].name, count: $gameParty.numItems(weapons[i]), kind: 'Weapon' });
      }
      var armors = $gameParty.armors();
      for (var i = 0; i < armors.length; i++) {
        result.push({ name: armors[i].name, count: $gameParty.numItems(armors[i]), kind: 'Armor' });
      }
      return result;
    })()
  `);
  if (!Array.isArray(data)) return [makeDetail('(No inventory data)')];
  if (data.length === 0) return [makeDetail('(Empty)')];
  return data.map((item: Record<string, unknown>) => {
    const i = makeDetail(`${item.name} x${item.count}`);
    i.description = item.kind as string;
    i.iconPath = new vscode.ThemeIcon('package');
    return i;
  });
}

async function fetchGold(): Promise<GameStateItem[]> {
  const data = await evaluate(`
    (function() {
      if (typeof $gameParty === 'undefined') return null;
      return $gameParty.gold();
    })()
  `);
  if (data === undefined || data === null) return [makeDetail('(Not connected)')];
  return [makeDetail(`${data} G`)];
}

async function fetchMapInfo(): Promise<GameStateItem[]> {
  const data = await evaluate(`
    (function() {
      if (typeof $gameMap === 'undefined' || typeof $gamePlayer === 'undefined') return null;
      return {
        mapId: $gameMap.mapId(),
        displayName: $gameMap.displayName(),
        x: $gamePlayer.x,
        y: $gamePlayer.y,
        width: $gameMap.width(),
        height: $gameMap.height()
      };
    })()
  `) as Record<string, unknown> | null | undefined;
  if (!data) return [makeDetail('(Not connected)')];
  const items: GameStateItem[] = [];
  items.push(makeDetail(`Map #${data.mapId}: ${data.displayName || '(no name)'}`));
  items.push(makeDetail(`Player: (${data.x}, ${data.y})`));
  items.push(makeDetail(`Size: ${data.width} x ${data.height}`));
  return items;
}

async function fetchTimers(): Promise<GameStateItem[]> {
  const data = await evaluate(`
    (function() {
      if (typeof $gameTimer === 'undefined') return null;
      return { working: $gameTimer.isWorking(), seconds: $gameTimer.seconds() };
    })()
  `) as Record<string, unknown> | null | undefined;
  if (!data) return [makeDetail('(Not connected)')];
  if (!data.working) return [makeDetail('(No active timer)')];
  return [makeDetail(`Timer: ${data.seconds}s remaining`)];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDetail(label: string): GameStateItem {
  return new GameStateItem('detail', label, vscode.TreeItemCollapsibleState.None);
}

function loadSystemNames(key: 'switches' | 'variables'): Record<number, string> {
  const result: Record<number, string> = {};
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return result;

  for (const folder of folders) {
    const filePath = path.join(folder.uri.fsPath, 'data', 'System.json');
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const system = JSON.parse(raw);
      const names = system[key] as string[] | undefined;
      if (names) {
        for (let i = 1; i < names.length; i++) {
          if (names[i]) result[i] = names[i];
        }
      }
      break;
    } catch {
      continue;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// TreeDataProvider
// ---------------------------------------------------------------------------

const CATEGORIES = ['Party', 'Switches', 'Variables', 'Items', 'Gold', 'Map Info', 'Timers'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_ICONS: Record<Category, string> = {
  'Party': 'organization',
  'Switches': 'activate-breakpoints',
  'Variables': 'symbol-variable',
  'Items': 'package',
  'Gold': 'credit-card',
  'Map Info': 'map',
  'Timers': 'watch',
};

const CATEGORY_FETCHERS: Record<Category, () => Promise<GameStateItem[]>> = {
  'Party': fetchParty,
  'Switches': fetchSwitches,
  'Variables': fetchVariables,
  'Items': fetchItems,
  'Gold': fetchGold,
  'Map Info': fetchMapInfo,
  'Timers': fetchTimers,
};

class GameStateProvider implements vscode.TreeDataProvider<GameStateItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<GameStateItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private autoRefreshEnabled = false;
  private autoRefreshTimer: ReturnType<typeof setInterval> | undefined;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setAutoRefresh(enabled: boolean): void {
    this.autoRefreshEnabled = enabled;
    if (enabled) {
      if (!this.autoRefreshTimer) {
        this.autoRefreshTimer = setInterval(() => this.refresh(), 2000);
      }
    } else {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = undefined;
      }
    }
  }

  isAutoRefreshEnabled(): boolean {
    return this.autoRefreshEnabled;
  }

  dispose(): void {
    this.setAutoRefresh(false);
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: GameStateItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: GameStateItem): Promise<GameStateItem[]> {
    if (!isProLicensed()) return [];

    if (!element) {
      // Root level — check connectivity first
      const client = await ensureConnected();
      if (!client) {
        return [makeDetail('(Not connected — start testplay with remote debugging on port 9222)')];
      }

      return CATEGORIES.map(cat => {
        const item = new GameStateItem(
          'root', cat,
          vscode.TreeItemCollapsibleState.Collapsed,
          cat
        );
        item.iconPath = new vscode.ThemeIcon(CATEGORY_ICONS[cat]);
        return item;
      });
    }

    // Category children
    if (element.kind === 'root' && element.category) {
      const fetcher = CATEGORY_FETCHERS[element.category as Category];
      if (fetcher) {
        try {
          return await fetcher();
        } catch {
          return [makeDetail('(Error fetching data)')];
        }
      }
    }

    return element.children ?? [];
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
  const provider = new GameStateProvider();

  const treeView = vscode.window.createTreeView('rmmzGameState', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.refreshGameState', () => provider.refresh())
  );

  // Auto-refresh toggle
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.toggleAutoRefreshGameState', () => {
      const newState = !provider.isAutoRefreshEnabled();
      provider.setAutoRefresh(newState);
      vscode.window.showInformationMessage(
        `RMMZ Game State auto-refresh ${newState ? 'enabled' : 'disabled'}.`
      );
    })
  );

  // Cleanup
  context.subscriptions.push({
    dispose() {
      provider.dispose();
      cdpClient?.disconnect();
      cdpClient = null;
    },
  });
}
