import * as vscode from 'vscode';
import { NoteTagIndexer, NoteTagIndex, NoteTagOccurrence } from './indexer';

// ---------------------------------------------------------------------------
// Tree item types
// ---------------------------------------------------------------------------

type ItemKind = 'tag' | 'occurrence' | 'section';

export class NoteTagItem extends vscode.TreeItem {
  constructor(
    public readonly kind: ItemKind,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tagName?: string,
    public readonly occurrence?: NoteTagOccurrence,
    public readonly children?: NoteTagItem[]
  ) {
    super(label, collapsibleState);
  }
}

// ---------------------------------------------------------------------------
// TreeDataProvider
// ---------------------------------------------------------------------------

export class NoteTagProvider implements vscode.TreeDataProvider<NoteTagItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<NoteTagItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private indexer = new NoteTagIndexer();
  private index: NoteTagIndex | undefined;

  async refresh(): Promise<void> {
    this.index = await this.indexer.buildIndex();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NoteTagItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: NoteTagItem): Promise<NoteTagItem[]> {
    if (!this.index) {
      this.index = await this.indexer.buildIndex();
    }

    if (!element) {
      return this.buildRootItems();
    }

    if (element.children) {
      return element.children;
    }

    // Tag node -> occurrence children
    if (element.kind === 'tag' && element.tagName) {
      const occurrences = this.index.tags.get(element.tagName) ?? [];
      return occurrences.map(occ => {
        const valueStr = occ.value ? ` = ${occ.value}` : '';
        const label = `${occ.source}[${occ.id}] ${occ.name}${valueStr}`;
        const item = new NoteTagItem(
          'occurrence',
          label,
          vscode.TreeItemCollapsibleState.None
        );
        item.description = occ.source;
        item.tooltip = `${occ.source} #${occ.id}: ${occ.name}${valueStr}`;
        item.iconPath = new vscode.ThemeIcon('symbol-field');
        return item;
      });
    }

    return [];
  }

  private buildRootItems(): NoteTagItem[] {
    if (!this.index) return [];

    const items: NoteTagItem[] = [];

    // All tags section
    const sortedTags = [...this.index.tags.keys()].sort();
    for (const tagName of sortedTags) {
      const occurrences = this.index.tags.get(tagName)!;
      const item = new NoteTagItem(
        'tag',
        tagName,
        vscode.TreeItemCollapsibleState.Collapsed,
        tagName
      );
      item.description = `${occurrences.length}`;
      item.tooltip = `<${tagName}> - ${occurrences.length} occurrence(s)`;
      item.iconPath = new vscode.ThemeIcon('tag');
      items.push(item);
    }

    // Orphaned tags section
    if (this.index.orphaned.length > 0) {
      const orphanedChildren = this.index.orphaned.map(tagName => {
        const count = this.index!.tags.get(tagName)?.length ?? 0;
        const child = new NoteTagItem(
          'tag',
          tagName,
          vscode.TreeItemCollapsibleState.Collapsed,
          tagName
        );
        child.description = `${count}`;
        child.tooltip = `<${tagName}> found in data but not declared by any plugin`;
        child.iconPath = new vscode.ThemeIcon('warning');
        return child;
      });

      const section = new NoteTagItem(
        'section',
        'Orphaned Tags',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        orphanedChildren
      );
      section.description = `${this.index.orphaned.length} tag(s) in data but not declared`;
      section.tooltip = 'Note tags found in data files but not declared via @noteParam in any plugin';
      section.iconPath = new vscode.ThemeIcon('warning');
      items.push(section);
    }

    // Unused declarations section
    if (this.index.unused.length > 0) {
      const unusedChildren = this.index.unused.map(tagName => {
        const child = new NoteTagItem(
          'tag',
          tagName,
          vscode.TreeItemCollapsibleState.None,
          tagName
        );
        child.tooltip = `<${tagName}> declared via @noteParam but not found in any data file`;
        child.iconPath = new vscode.ThemeIcon('info');
        return child;
      });

      const section = new NoteTagItem(
        'section',
        'Unused Declarations',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        undefined,
        unusedChildren
      );
      section.description = `${this.index.unused.length} tag(s) declared but not in data`;
      section.tooltip = 'Note tags declared via @noteParam in plugins but not found in any data file';
      section.iconPath = new vscode.ThemeIcon('info');
      items.push(section);
    }

    return items;
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the Note Tag Index tree view and related commands.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const provider = new NoteTagProvider();

  const treeView = vscode.window.createTreeView('rmmzNoteTagIndex', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.refreshNoteTags', () => provider.refresh())
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

      watcher.onDidChange(() => provider.refresh());
      watcher.onDidCreate(() => provider.refresh());
      watcher.onDidDelete(() => provider.refresh());

      context.subscriptions.push(watcher);
    }
  }

  // Initial load
  provider.refresh();
}
