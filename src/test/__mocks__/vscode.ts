// Minimal vscode module mock for unit testing

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;
  constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
    this.start = new Position(startLine, startChar);
    this.end = new Position(endLine, endChar);
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class Diagnostic {
  public severity: DiagnosticSeverity;
  public source?: string;
  public code?: string | number;

  constructor(
    public range: Range,
    public message: string,
    severity?: DiagnosticSeverity,
  ) {
    this.severity = severity ?? DiagnosticSeverity.Error;
  }
}

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  Reference = 17,
  File = 16,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

export class CompletionItem {
  public detail?: string;
  public insertText?: string | SnippetString;
  public filterText?: string;
  public kind?: CompletionItemKind;

  constructor(public label: string, kind?: CompletionItemKind) {
    this.kind = kind;
  }
}

export class SnippetString {
  constructor(public readonly value: string) {}
}

export class MarkdownString {
  constructor(public readonly value: string = '') {}
  appendMarkdown(_value: string): MarkdownString { return this; }
  appendCodeblock(_value: string, _language?: string): MarkdownString { return this; }
}

export class ThemeIcon {
  constructor(public readonly id: string) {}
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export class TreeItem {
  public label?: string;
  public collapsibleState?: TreeItemCollapsibleState;
  public description?: string;
  public tooltip?: string | MarkdownString;
  public iconPath?: ThemeIcon;
  public contextValue?: string;

  constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
  };
  fire(data: T): void {
    for (const l of this.listeners) l(data);
  }
  dispose(): void {
    this.listeners = [];
  }
}

export class RelativePattern {
  constructor(public base: string | { uri: { fsPath: string } }, public pattern: string) {}
}

export enum ViewColumn {
  One = 1,
  Two = 2,
  Three = 3,
}

export const Uri = {
  file(path: string) {
    return { scheme: 'file', fsPath: path, toString: () => `file://${path}` };
  },
  parse(str: string) {
    return { scheme: 'file', fsPath: str.replace('file://', ''), toString: () => str };
  },
};

export const workspace = {
  workspaceFolders: undefined as any,
  textDocuments: [] as any[],
  onDidOpenTextDocument: () => ({ dispose: () => {} }),
  onDidChangeTextDocument: () => ({ dispose: () => {} }),
  onDidCloseTextDocument: () => ({ dispose: () => {} }),
  createFileSystemWatcher: () => ({
    onDidChange: () => ({ dispose: () => {} }),
    onDidCreate: () => ({ dispose: () => {} }),
    onDidDelete: () => ({ dispose: () => {} }),
    dispose: () => {},
  }),
  getConfiguration: () => ({
    get: () => undefined,
    update: async () => {},
  }),
};

export const window = {
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  createOutputChannel: () => ({
    appendLine: () => {},
    append: () => {},
    clear: () => {},
    show: () => {},
    dispose: () => {},
  }),
  createWebviewPanel: () => ({
    webview: { html: '' },
    reveal: () => {},
    onDidDispose: () => ({ dispose: () => {} }),
    dispose: () => {},
  }),
};

export const languages = {
  createDiagnosticCollection: (name?: string) => ({
    name: name ?? '',
    set: () => {},
    delete: () => {},
    clear: () => {},
    dispose: () => {},
  }),
  registerCompletionItemProvider: () => ({ dispose: () => {} }),
};

export const commands = {
  registerCommand: (_command: string, _callback: (...args: any[]) => any) => ({
    dispose: () => {},
  }),
};

export type TextDocument = {
  getText: () => string;
  lineAt: (line: number) => { text: string; range: Range };
  offsetAt: (position: Position) => number;
  uri: ReturnType<typeof Uri.file>;
  languageId: string;
  lineCount: number;
};

export type CancellationToken = {
  isCancellationRequested: boolean;
  onCancellationRequested: () => { dispose: () => void };
};

export type CompletionContext = {
  triggerKind: number;
  triggerCharacter?: string;
};

export type ExtensionContext = {
  subscriptions: { dispose: () => void }[];
};

export type WorkspaceFolder = {
  uri: ReturnType<typeof Uri.file>;
  name: string;
  index: number;
};

export type DiagnosticCollection = ReturnType<typeof languages.createDiagnosticCollection>;
