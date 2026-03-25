import * as vscode from 'vscode';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

// ---------------------------------------------------------------------------
// Types
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

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Finds the first `/*:` annotation block (not `:ja`, not struct) in the
 * document text and returns the raw lines inside it.
 */
function extractAnnotationLines(text: string): string[] | undefined {
  const lines = text.split('\n');
  let inBlock = false;
  let blockLines: string[] = [];

  for (const line of lines) {
    if (!inBlock) {
      // Match /*: but NOT /*:ja, /*:ko etc. and NOT /*~struct~
      if (/\/\*:\s*$|\/\*:\s/.test(line) && !/:[\w]/.test(line.replace('/*:', ''))) {
        // More robust check: must start with /*: and the character after
        // the colon (if any) must NOT be a letter (locale suffix).
        const idx = line.indexOf('/*:');
        if (idx === -1) continue;
        const after = line.substring(idx + 3).trimStart();
        if (after.length > 0 && /^[a-zA-Z]/.test(after)) continue; // locale block
        inBlock = true;
        blockLines = [];
        // Include the rest of this line after /*:
        continue;
      }
    }

    if (inBlock) {
      if (line.includes('*/')) {
        // Include content before the closer
        blockLines.push(line.substring(0, line.indexOf('*/')));
        break;
      }
      blockLines.push(line);
    }
  }

  return inBlock ? blockLines : undefined;
}

/**
 * Parses annotation lines into a structured AnnotationData object.
 */
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

  const tagRegex = /^\s*\*?\s*@(\w+)\s*(.*?)?\s*$/;

  for (const rawLine of lines) {
    const m = rawLine.match(tagRegex);

    if (!m) {
      // Continuation line — only relevant for @help
      if (inHelp) {
        const trimmed = rawLine.replace(/^\s*\*?\s?/, '');
        helpLines.push(trimmed);
      }
      continue;
    }

    const tag = m[1];
    const rest = (m[2] ?? '').trim();

    // End help accumulation when we hit any new tag
    if (inHelp && tag !== 'help') {
      data.help = helpLines.join('\n').trimEnd();
      inHelp = false;
    }

    // Scope-changing tags ---------------------------------------------------
    if (tag === 'param') {
      // Flush previous param
      if (currentParam) data.params.push(currentParam);
      currentParam = makeParam(rest);
      currentArg = undefined;
      scope = 'param';
      continue;
    }

    if (tag === 'command') {
      // Flush previous param/command
      if (currentParam) { data.params.push(currentParam); currentParam = undefined; }
      if (currentArg && currentCommand) { currentCommand.args.push(currentArg); currentArg = undefined; }
      if (currentCommand) data.commands.push(currentCommand);
      currentCommand = { name: rest, text: rest, desc: '', args: [] };
      scope = 'command';
      continue;
    }

    if (tag === 'arg') {
      // Flush previous arg into current command
      if (currentArg && currentCommand) currentCommand.args.push(currentArg);
      // Flush param if we were in param scope
      if (currentParam) { data.params.push(currentParam); currentParam = undefined; }
      currentArg = makeArg(rest);
      scope = 'arg';
      continue;
    }

    // Top-level tags --------------------------------------------------------
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

    // Sub-tags for param / arg ----------------------------------------------
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

  // Flush remaining help
  if (inHelp) {
    data.help = helpLines.join('\n').trimEnd();
  }

  // Flush remaining items
  if (currentArg && currentCommand) currentCommand.args.push(currentArg);
  if (currentParam) data.params.push(currentParam);
  if (currentCommand) data.commands.push(currentCommand);

  return data;
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

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(data: AnnotationData): string {
  const paramsHtml = data.params.length > 0
    ? data.params.map(p => renderParam(p)).join('')
    : '<tr><td class="empty" colspan="4">No parameters defined</td></tr>';

  const commandsHtml = data.commands.length > 0
    ? data.commands.map(c => renderCommand(c)).join('')
    : '<div class="empty">No commands defined</div>';

  const helpHtml = data.help
    ? escapeHtml(data.help).replace(/\n/g, '<br>')
    : '<span class="empty">No help text</span>';

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 20px;
    line-height: 1.5;
  }
  .header {
    border-bottom: 2px solid #89b4fa;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .header h1 {
    font-size: 20px;
    color: #89b4fa;
    font-weight: 600;
  }
  .header .author {
    font-size: 13px;
    color: #a6adc8;
    margin-top: 4px;
  }
  .header .url {
    font-size: 12px;
    margin-top: 2px;
  }
  .header .url a {
    color: #89b4fa;
    text-decoration: none;
  }
  .header .url a:hover { text-decoration: underline; }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #89b4fa;
    margin: 20px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Parameters table */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    text-align: left;
    padding: 6px 10px;
    background: #313244;
    color: #89b4fa;
    font-weight: 600;
    border-bottom: 1px solid #45475a;
  }
  td {
    padding: 5px 10px;
    border-bottom: 1px solid #45475a;
    vertical-align: top;
  }
  tr:hover td { background: #313244; }
  .param-name { color: #f5c2e7; font-weight: 500; }
  .param-type {
    color: #a6e3a1;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
  }
  .param-default {
    color: #fab387;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
  }
  .param-desc { color: #a6adc8; font-size: 12px; }
  .param-meta {
    font-size: 11px;
    color: #6c7086;
    margin-top: 2px;
  }
  .param-child td:first-child {
    padding-left: 28px;
  }
  .param-child td:first-child::before {
    content: '\\2514\\0020';
    color: #45475a;
  }
  .param-options {
    font-size: 11px;
    color: #6c7086;
    margin-top: 2px;
  }

  /* Commands */
  .command-card {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .command-name {
    color: #f5c2e7;
    font-weight: 600;
    font-size: 14px;
  }
  .command-id {
    color: #6c7086;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 11px;
    margin-left: 8px;
  }
  .command-desc {
    color: #a6adc8;
    font-size: 12px;
    margin-top: 4px;
  }
  .command-args {
    margin-top: 8px;
    padding-left: 12px;
    border-left: 2px solid #45475a;
  }
  .command-arg {
    font-size: 12px;
    margin-bottom: 4px;
  }
  .command-arg .arg-name { color: #cdd6f4; font-weight: 500; }
  .command-arg .arg-type { color: #a6e3a1; margin-left: 6px; }
  .command-arg .arg-desc { color: #6c7086; display: block; margin-left: 0; }

  /* Help text */
  .help-box {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 12px 14px;
    font-size: 13px;
    white-space: pre-wrap;
    font-family: 'Consolas', 'Courier New', monospace;
    line-height: 1.6;
  }

  .empty { color: #6c7086; font-style: italic; }
  .badge {
    display: inline-block;
    background: #45475a;
    color: #cdd6f4;
    border-radius: 3px;
    padding: 0 5px;
    font-size: 11px;
    margin-left: 6px;
    vertical-align: middle;
  }

  .no-block {
    text-align: center;
    margin-top: 60px;
    color: #6c7086;
  }
  .no-block h2 { color: #45475a; font-size: 18px; margin-bottom: 8px; }
  .no-block p { font-size: 13px; }
</style>
</head>
<body>
${data.plugindesc ? `
  <div class="header">
    <h1>${escapeHtml(data.plugindesc)}</h1>
    ${data.author ? `<div class="author">by ${escapeHtml(data.author)}</div>` : ''}
    ${data.url ? `<div class="url"><a href="${escapeHtml(data.url)}">${escapeHtml(data.url)}</a></div>` : ''}
  </div>

  <div class="section-title">Parameters</div>
  <table>
    <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
    ${paramsHtml}
  </table>

  <div class="section-title">Plugin Commands</div>
  ${commandsHtml}

  <div class="section-title">Help</div>
  <div class="help-box">${helpHtml}</div>
` : `
  <div class="no-block">
    <h2>No Annotation Block Found</h2>
    <p>Open a file containing a <code>/*: ... */</code> annotation block.</p>
  </div>
`}
</body>
</html>`;
}

function renderParam(p: ParamInfo): string {
  const isChild = !!p.parent;
  const rowClass = isChild ? ' class="param-child"' : '';

  let descCell = escapeHtml(p.desc);
  const metaParts: string[] = [];
  if (p.min !== undefined) metaParts.push(`min: ${escapeHtml(p.min)}`);
  if (p.max !== undefined) metaParts.push(`max: ${escapeHtml(p.max)}`);
  if (p.on) metaParts.push(`on: "${escapeHtml(p.on)}"`);
  if (p.off) metaParts.push(`off: "${escapeHtml(p.off)}"`);
  if (metaParts.length > 0) {
    descCell += `<div class="param-meta">${metaParts.join(' | ')}</div>`;
  }
  if (p.options.length > 0) {
    const opts = p.options.map(o =>
      o.value !== undefined ? `${escapeHtml(o.text)} (${escapeHtml(o.value)})` : escapeHtml(o.text)
    ).join(', ');
    descCell += `<div class="param-options">Options: ${opts}</div>`;
  }

  return `<tr${rowClass}>
    <td class="param-name">${escapeHtml(p.text || p.name)}<span class="badge">${escapeHtml(p.name)}</span></td>
    <td class="param-type">${escapeHtml(p.type)}</td>
    <td class="param-default">${escapeHtml(p.default) || '<span class="empty">—</span>'}</td>
    <td class="param-desc">${descCell || '<span class="empty">—</span>'}</td>
  </tr>`;
}

function renderCommand(c: CommandInfo): string {
  let argsHtml = '';
  if (c.args.length > 0) {
    const argItems = c.args.map(a =>
      `<div class="command-arg">
        <span class="arg-name">${escapeHtml(a.text || a.name)}</span>
        <span class="arg-type">${escapeHtml(a.type)}</span>
        ${a.desc ? `<span class="arg-desc">${escapeHtml(a.desc)}</span>` : ''}
      </div>`
    ).join('');
    argsHtml = `<div class="command-args">${argItems}</div>`;
  }

  return `<div class="command-card">
    <span class="command-name">${escapeHtml(c.text || c.name)}</span>
    ${c.name !== c.text ? `<span class="command-id">${escapeHtml(c.name)}</span>` : ''}
    ${c.desc ? `<div class="command-desc">${escapeHtml(c.desc)}</div>` : ''}
    ${argsHtml}
  </div>`;
}

// ---------------------------------------------------------------------------
// Webview management
// ---------------------------------------------------------------------------

let currentPanel: vscode.WebviewPanel | undefined;

/** Track the last known text editor document so focus changes to the
 *  webview panel don't cause us to lose the document reference. */
let lastDocument: vscode.TextDocument | undefined;

/**
 * Creates or reveals the Annotation Preview webview panel.
 * Reads the active editor and renders the parsed annotation data.
 */
export function showAnnotationPreview(): void {
  if (!requirePro('Annotation Preview')) return;
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    lastDocument = editor.document;
  }

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside, true);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'rmmzAnnotationPreview',
      t('preview.panelTitle'),
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: false }
    );

    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    });
  }

  // Use setTimeout to ensure the panel is ready before setting content
  setTimeout(() => updatePreview(lastDocument), 50);
}

function updatePreview(document: vscode.TextDocument | undefined): void {
  if (!currentPanel) return;

  if (!document) {
    currentPanel.webview.html = renderHtml({
      plugindesc: '',
      author: '',
      url: '',
      help: '',
      params: [],
      commands: [],
    });
    return;
  }

  const lines = extractAnnotationLines(document.getText());
  if (!lines) {
    currentPanel.webview.html = renderHtml({
      plugindesc: '',
      author: '',
      url: '',
      help: '',
      params: [],
      commands: [],
    });
    return;
  }

  const data = parseAnnotation(lines);
  currentPanel.webview.html = renderHtml(data);
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the `rmmz.previewAnnotation` command and sets up live-update
 * listeners for the annotation preview panel.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.previewAnnotation', showAnnotationPreview)
  );

  // Live-update on text changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (!currentPanel) return;
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document) {
        updatePreview(e.document);
      }
    })
  );

  // Update when switching editors (ignore when focus moves to webview)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!currentPanel) return;
      if (editor) {
        lastDocument = editor.document;
        updatePreview(editor.document);
      }
    })
  );
}
