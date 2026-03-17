import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { requirePro, isProLicensed } from '../license/gumroad';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassInfo {
  name: string;
  parent: string | undefined;
  methods: MethodInfo[];
  filePath: string;
  line: number;
  source: string; // e.g. 'rmmz_core.js' or 'MyPlugin.js'
}

interface MethodInfo {
  name: string;
  filePath: string;
  line: number;
}

type ItemKind = 'category' | 'class' | 'method' | 'message';

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

interface CategoryDef {
  label: string;
  icon: string;
  test: (name: string) => boolean;
}

const CATEGORIES: CategoryDef[] = [
  { label: 'Scenes', icon: 'window', test: n => n.startsWith('Scene_') },
  { label: 'Windows', icon: 'browser', test: n => n.startsWith('Window_') },
  { label: 'Sprites', icon: 'symbol-color', test: n => n.startsWith('Sprite_') || n.startsWith('Spriteset_') },
  { label: 'Game Objects', icon: 'symbol-object', test: n => n.startsWith('Game_') },
  { label: 'Data / Managers', icon: 'server', test: n => n.endsWith('Manager') || n.startsWith('Data') },
  { label: 'Other', icon: 'symbol-misc', test: () => true },
];

// ---------------------------------------------------------------------------
// Tree item
// ---------------------------------------------------------------------------

export class HierarchyItem extends vscode.TreeItem {
  constructor(
    public readonly kind: ItemKind,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly className?: string,
    public readonly filePath?: string,
    public readonly fileLine?: number,
    public readonly categoryLabel?: string
  ) {
    super(label, collapsibleState);
  }
}

// ---------------------------------------------------------------------------
// Class scanner
// ---------------------------------------------------------------------------

const RMMZ_FILES = [
  'rmmz_core.js',
  'rmmz_managers.js',
  'rmmz_objects.js',
  'rmmz_scenes.js',
  'rmmz_sprites.js',
  'rmmz_windows.js',
];

class ClassScanner {
  private classes = new Map<string, ClassInfo>();

  getClasses(): Map<string, ClassInfo> {
    return this.classes;
  }

  clear(): void {
    this.classes.clear();
  }

  scanWorkspace(): void {
    this.classes.clear();
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    for (const folder of folders) {
      const jsDir = path.join(folder.uri.fsPath, 'js');
      if (!fs.existsSync(jsDir)) continue;

      // Scan core RMMZ files
      for (const file of RMMZ_FILES) {
        const filePath = path.join(jsDir, file);
        if (fs.existsSync(filePath)) {
          this.scanFile(filePath, file);
        }
      }

      // Scan plugins directory
      const pluginsDir = path.join(jsDir, 'plugins');
      if (fs.existsSync(pluginsDir)) {
        try {
          const entries = fs.readdirSync(pluginsDir);
          for (const entry of entries) {
            if (entry.endsWith('.js')) {
              const filePath = path.join(pluginsDir, entry);
              this.scanFile(filePath, entry);
            }
          }
        } catch {
          // ignore read errors
        }
      }
    }
  }

  private scanFile(filePath: string, source: string): void {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return;
    }

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // ES6 class: class Foo extends Bar {
      const es6Match = line.match(/^\s*class\s+(\w+)\s+extends\s+([\w.]+)/);
      if (es6Match) {
        const [, name, parent] = es6Match;
        this.ensureClass(name, filePath, source, i + 1);
        this.classes.get(name)!.parent = parent;
        // Scan class body for methods
        this.scanClassBody(lines, i, name, filePath);
        continue;
      }

      // ES6 class without extends: class Foo {
      const es6NoExtend = line.match(/^\s*class\s+(\w+)\s*\{/);
      if (es6NoExtend) {
        const name = es6NoExtend[1];
        this.ensureClass(name, filePath, source, i + 1);
        this.scanClassBody(lines, i, name, filePath);
        continue;
      }

      // Constructor pattern: function Foo() { this.initialize.apply(this, arguments); }
      const ctorMatch = line.match(/^\s*function\s+(\w+)\s*\(\)\s*\{\s*this\.initialize\.apply\s*\(/);
      if (ctorMatch) {
        const name = ctorMatch[1];
        this.ensureClass(name, filePath, source, i + 1);
        continue;
      }

      // Prototype chain: Foo.prototype = Object.create(Bar.prototype)
      const protoMatch = line.match(/^\s*(\w+)\.prototype\s*=\s*Object\.create\(\s*([\w.]+)\.prototype\s*\)/);
      if (protoMatch) {
        const [, name, parent] = protoMatch;
        this.ensureClass(name, filePath, source, i + 1);
        this.classes.get(name)!.parent = parent;
        continue;
      }

      // Prototype method: Foo.prototype.bar = function
      const methodMatch = line.match(/^\s*(\w+)\.prototype\.(\w+)\s*=\s*function/);
      if (methodMatch) {
        const [, className, methodName] = methodMatch;
        const cls = this.classes.get(className);
        if (cls) {
          // Avoid duplicate method entries
          if (!cls.methods.some(m => m.name === methodName && m.filePath === filePath)) {
            cls.methods.push({ name: methodName, filePath, line: i + 1 });
          }
        }
        continue;
      }
    }
  }

  private ensureClass(name: string, filePath: string, source: string, line: number): void {
    if (!this.classes.has(name)) {
      this.classes.set(name, {
        name,
        parent: undefined,
        methods: [],
        filePath,
        line,
        source,
      });
    }
  }

  private scanClassBody(lines: string[], startLine: number, className: string, filePath: string): void {
    // Find the opening brace and scan for method definitions inside the class body
    let braceDepth = 0;
    let started = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') {
          braceDepth++;
          started = true;
        } else if (ch === '}') {
          braceDepth--;
        }
      }

      if (started && braceDepth <= 0) break;

      // Match method definitions inside class body (depth 1)
      // Patterns: methodName(...) {  or  async methodName(...) {  or  static methodName(...) {
      if (braceDepth === 1) {
        const methodMatch = line.match(/^\s+(?:static\s+|async\s+|get\s+|set\s+)*(\w+)\s*\(/);
        if (methodMatch) {
          const methodName = methodMatch[1];
          // Skip constructor keyword as a method listing (it shows as class definition)
          if (methodName === 'constructor') continue;
          // Skip common false positives
          if (['if', 'for', 'while', 'switch', 'catch', 'return', 'throw', 'new', 'function'].includes(methodName)) continue;

          const cls = this.classes.get(className);
          if (cls && !cls.methods.some(m => m.name === methodName && m.filePath === filePath)) {
            cls.methods.push({ name: methodName, filePath, line: i + 1 });
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TreeDataProvider
// ---------------------------------------------------------------------------

export class HierarchyBrowserProvider implements vscode.TreeDataProvider<HierarchyItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HierarchyItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private scanner = new ClassScanner();
  private built = false;

  refresh(): void {
    this.scanner.clear();
    this.built = false;
    this._onDidChangeTreeData.fire();
  }

  private ensureScanned(): void {
    if (!this.built) {
      this.scanner.scanWorkspace();
      this.built = true;
    }
  }

  getTreeItem(element: HierarchyItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HierarchyItem): HierarchyItem[] {
    if (!isProLicensed()) return [];

    this.ensureScanned();

    const classes = this.scanner.getClasses();

    if (classes.size === 0 && !element) {
      const msg = new HierarchyItem(
        'message',
        'No RMMZ classes found (open an RPG Maker MZ project)',
        vscode.TreeItemCollapsibleState.None
      );
      msg.iconPath = new vscode.ThemeIcon('info');
      return [msg];
    }

    // Root level: show categories
    if (!element) {
      return this.buildCategoryItems(classes);
    }

    // Category level: show class hierarchy roots for that category
    if (element.kind === 'category' && element.categoryLabel) {
      return this.buildClassTree(classes, element.categoryLabel);
    }

    // Class level: show child classes first, then methods
    if (element.kind === 'class' && element.className) {
      return this.buildClassChildren(classes, element.className);
    }

    return [];
  }

  /** Build top-level category items. */
  private buildCategoryItems(classes: Map<string, ClassInfo>): HierarchyItem[] {
    const items: HierarchyItem[] = [];
    const assigned = new Set<string>();

    for (const cat of CATEGORIES) {
      const matching: string[] = [];
      for (const [name] of classes) {
        if (cat.label === 'Other') {
          if (!assigned.has(name)) matching.push(name);
        } else if (cat.test(name)) {
          matching.push(name);
          assigned.add(name);
        }
      }
      if (matching.length === 0) continue;

      const item = new HierarchyItem(
        'category',
        cat.label,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        undefined,
        undefined,
        cat.label
      );
      item.description = `${matching.length} classes`;
      item.iconPath = new vscode.ThemeIcon(cat.icon);
      items.push(item);
    }

    return items;
  }

  /** Build the inheritance tree for classes belonging to a specific category. */
  private buildClassTree(classes: Map<string, ClassInfo>, categoryLabel: string): HierarchyItem[] {
    const catDef = CATEGORIES.find(c => c.label === categoryLabel);
    if (!catDef) return [];

    const assigned = new Set<string>();
    if (catDef.label !== 'Other') {
      // Collect which classes belong to earlier categories (for the Other exclusion)
      for (const name of classes.keys()) {
        for (const c of CATEGORIES) {
          if (c.label === 'Other') break;
          if (c.test(name)) { assigned.add(name); break; }
        }
      }
    }

    // Determine which classes belong to this category
    const categoryClasses = new Set<string>();
    for (const name of classes.keys()) {
      if (catDef.label === 'Other') {
        if (!assigned.has(name)) categoryClasses.add(name);
      } else if (catDef.test(name)) {
        categoryClasses.add(name);
      }
    }

    // Find root classes within this category (parent not in category or doesn't exist)
    const roots: string[] = [];
    for (const name of categoryClasses) {
      const info = classes.get(name)!;
      if (!info.parent || !categoryClasses.has(info.parent)) {
        roots.push(name);
      }
    }
    roots.sort();

    return roots.map(name => this.makeClassItem(classes, name));
  }

  /** Build children of a class node: subclasses + methods. */
  private buildClassChildren(classes: Map<string, ClassInfo>, parentName: string): HierarchyItem[] {
    const items: HierarchyItem[] = [];

    // Child classes that extend this one
    const children: string[] = [];
    for (const [name, info] of classes) {
      if (info.parent === parentName) {
        children.push(name);
      }
    }
    children.sort();
    for (const name of children) {
      items.push(this.makeClassItem(classes, name));
    }

    // Methods of this class
    const cls = classes.get(parentName);
    if (cls) {
      const sortedMethods = [...cls.methods].sort((a, b) => a.name.localeCompare(b.name));
      for (const m of sortedMethods) {
        const item = new HierarchyItem(
          'method',
          m.name,
          vscode.TreeItemCollapsibleState.None,
          parentName,
          m.filePath,
          m.line
        );
        item.iconPath = new vscode.ThemeIcon('symbol-method');
        item.description = path.basename(m.filePath);
        item.tooltip = `${parentName}.prototype.${m.name} - ${path.basename(m.filePath)}:${m.line}`;
        item.command = {
          command: 'vscode.open',
          title: 'Go to Definition',
          arguments: [
            vscode.Uri.file(m.filePath),
            { selection: new vscode.Range(m.line - 1, 0, m.line - 1, 0) } as vscode.TextDocumentShowOptions,
          ],
        };
        items.push(item);
      }
    }

    return items;
  }

  /** Create a tree item for a single class. */
  private makeClassItem(classes: Map<string, ClassInfo>, name: string): HierarchyItem {
    const info = classes.get(name)!;

    // Determine if expandable: has child classes or methods
    const hasChildren = [...classes.values()].some(c => c.parent === name);
    const hasMethods = info.methods.length > 0;
    const collapsible = hasChildren || hasMethods
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new HierarchyItem(
      'class',
      name,
      collapsible,
      name,
      info.filePath,
      info.line
    );

    const methodCount = info.methods.length;
    item.description = methodCount > 0 ? `${methodCount} methods` : info.source;
    item.tooltip = `${name}${info.parent ? ` extends ${info.parent}` : ''} (${info.source}:${info.line})`;
    item.iconPath = new vscode.ThemeIcon('symbol-class');
    item.command = {
      command: 'vscode.open',
      title: 'Go to Definition',
      arguments: [
        vscode.Uri.file(info.filePath),
        { selection: new vscode.Range(info.line - 1, 0, info.line - 1, 0) } as vscode.TextDocumentShowOptions,
      ],
    };

    return item;
  }

  /** Get all class names for the search command. */
  getAllClassNames(): { name: string; info: ClassInfo }[] {
    this.ensureScanned();
    const result: { name: string; info: ClassInfo }[] = [];
    for (const [name, info] of this.scanner.getClasses()) {
      result.push({ name, info });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the Class Hierarchy Browser tree view and related commands.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  const provider = new HierarchyBrowserProvider();

  const treeView = vscode.window.createTreeView('rmmzClassHierarchy', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.refreshHierarchy', () => provider.refresh())
  );

  // Search command (QuickPick)
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.searchHierarchy', async () => {
      if (!requirePro('Class Hierarchy')) return;
      const allClasses = provider.getAllClassNames();
      if (allClasses.length === 0) {
        vscode.window.showInformationMessage('No RMMZ classes found. Open an RPG Maker MZ project first.');
        return;
      }

      const picks = allClasses.map(c => ({
        label: c.name,
        description: `${c.info.parent ? `extends ${c.info.parent}` : 'base class'} - ${c.info.source}`,
        detail: `${c.info.methods.length} methods`,
        info: c.info,
      }));

      const selected = await vscode.window.showQuickPick(picks, {
        placeHolder: 'Search RMMZ classes...',
        matchOnDescription: true,
      });

      if (selected) {
        // Open the file at the class definition
        const uri = vscode.Uri.file(selected.info.filePath);
        const options: vscode.TextDocumentShowOptions = {
          selection: new vscode.Range(selected.info.line - 1, 0, selected.info.line - 1, 0),
        };
        await vscode.commands.executeCommand('vscode.open', uri, options);

        // Reveal in tree
        try {
          const item = new HierarchyItem(
            'class',
            selected.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            selected.label,
            selected.info.filePath,
            selected.info.line
          );
          await treeView.reveal(item, { focus: true, select: true });
        } catch {
          // reveal may fail if the item isn't in the current tree state; ignore
        }
      }
    })
  );

  // Auto-refresh when JS files change
  const folders = vscode.workspace.workspaceFolders;
  if (folders) {
    for (const folder of folders) {
      const jsPattern = new vscode.RelativePattern(
        vscode.Uri.joinPath(folder.uri, 'js'),
        '**/*.js'
      );
      const watcher = vscode.workspace.createFileSystemWatcher(jsPattern);

      const onJsChange = () => provider.refresh();

      watcher.onDidChange(onJsChange);
      watcher.onDidCreate(onJsChange);
      watcher.onDidDelete(onJsChange);

      context.subscriptions.push(watcher);
    }
  }
}
