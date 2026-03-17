import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Database categories (top-level nodes in the tree)
// ---------------------------------------------------------------------------

const DATABASE_CATEGORIES: { label: string; file: string }[] = [
  { label: 'Actors', file: 'Actors.json' },
  { label: 'Classes', file: 'Classes.json' },
  { label: 'Skills', file: 'Skills.json' },
  { label: 'Items', file: 'Items.json' },
  { label: 'Weapons', file: 'Weapons.json' },
  { label: 'Armors', file: 'Armors.json' },
  { label: 'Enemies', file: 'Enemies.json' },
  { label: 'Troops', file: 'Troops.json' },
  { label: 'States', file: 'States.json' },
  { label: 'Animations', file: 'Animations.json' },
  { label: 'Common Events', file: 'CommonEvents.json' },
];

// ---------------------------------------------------------------------------
// Tree item
// ---------------------------------------------------------------------------

export class DatabaseItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly categoryFile?: string,
    public readonly entryId?: number,
    public readonly entryData?: unknown
  ) {
    super(label, collapsibleState);
  }
}

// ---------------------------------------------------------------------------
// Simple data reader (similar to DataCache in datalink/hover.ts)
// ---------------------------------------------------------------------------

class DatabaseCache {
  private cache = new Map<string, unknown[]>();
  private dataDir: string | undefined;

  constructor() {
    this.resolveDataDir();
  }

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

  invalidate(filename?: string): void {
    if (filename) {
      this.cache.delete(filename);
    } else {
      this.cache.clear();
    }
  }

  getDataDir(): string | undefined {
    if (!this.dataDir) {
      this.resolveDataDir();
    }
    return this.dataDir;
  }

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
      return undefined;
    } catch {
      return undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Virtual document provider for entry detail view
// ---------------------------------------------------------------------------

const SCHEME = 'rmmz-db';

class DatabaseDocumentProvider implements vscode.TextDocumentContentProvider {
  private cache: DatabaseCache;

  constructor(cache: DatabaseCache) {
    this.cache = cache;
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    const params = new URLSearchParams(uri.query);
    const file = params.get('file');
    const id = parseInt(params.get('id') ?? '0', 10);

    if (!file) return '// No data file specified';

    const data = this.cache.getData(file);
    if (!data) return `// Could not read ${file}`;

    const entry = data[id];
    if (!entry) return `// Entry #${id} not found in ${file}`;

    return JSON.stringify(entry, null, 2);
  }
}

// ---------------------------------------------------------------------------
// TreeDataProvider
// ---------------------------------------------------------------------------

export class DatabaseBrowserProvider implements vscode.TreeDataProvider<DatabaseItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DatabaseItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cache: DatabaseCache;

  constructor(cache: DatabaseCache) {
    this.cache = cache;
  }

  refresh(): void {
    this.cache.invalidate();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DatabaseItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DatabaseItem): DatabaseItem[] {
    if (!element) {
      // Root: show categories that have data files
      return DATABASE_CATEGORIES.map(cat => {
        const item = new DatabaseItem(
          cat.label,
          vscode.TreeItemCollapsibleState.Collapsed,
          cat.file
        );
        item.iconPath = new vscode.ThemeIcon('database');
        item.tooltip = cat.file;
        return item;
      });
    }

    // Category node -> entry children
    if (element.categoryFile && element.entryId === undefined) {
      const data = this.cache.getData(element.categoryFile);
      if (!data) return [];

      const items: DatabaseItem[] = [];
      for (let i = 1; i < data.length; i++) {
        const entry = data[i] as Record<string, unknown> | null;
        if (!entry) continue;

        const name = (entry.name as string) || '(unnamed)';
        const label = `[${i}] ${name}`;
        const item = new DatabaseItem(
          label,
          vscode.TreeItemCollapsibleState.None,
          element.categoryFile,
          i,
          entry
        );

        item.iconPath = new vscode.ThemeIcon('symbol-field');
        item.tooltip = `${element.categoryFile} #${i}: ${name}`;

        // Open virtual document on click
        const uri = vscode.Uri.parse(
          `${SCHEME}:${name}.json?file=${encodeURIComponent(element.categoryFile)}&id=${i}`
        );
        item.command = {
          command: 'vscode.open',
          title: 'View Entry',
          arguments: [uri],
        };

        items.push(item);
      }
      return items;
    }

    return [];
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the Database Browser tree view and related commands.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const cache = new DatabaseCache();

  // Register virtual document provider
  const docProvider = new DatabaseDocumentProvider(cache);
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, docProvider)
  );

  // Register tree view
  const treeProvider = new DatabaseBrowserProvider(cache);
  const treeView = vscode.window.createTreeView('rmmzDatabaseBrowser', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.refreshDatabase', () => treeProvider.refresh())
  );

  // Auto-refresh when data files change
  const folders = vscode.workspace.workspaceFolders;
  if (folders) {
    for (const folder of folders) {
      const dataPattern = new vscode.RelativePattern(
        vscode.Uri.joinPath(folder.uri, 'data'),
        '*.json'
      );
      const watcher = vscode.workspace.createFileSystemWatcher(dataPattern);

      const onDataChange = (uri: vscode.Uri) => {
        const basename = path.basename(uri.fsPath);
        cache.invalidate(basename);
        treeProvider.refresh();
      };

      watcher.onDidChange(onDataChange);
      watcher.onDidCreate(onDataChange);
      watcher.onDidDelete(onDataChange);

      context.subscriptions.push(watcher);
    }
  }
}
