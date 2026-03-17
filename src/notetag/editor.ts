import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { requirePro } from '../license/gumroad';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported data file types and their filenames. */
const DATA_TYPES: Record<string, string> = {
  Actors: 'Actors.json',
  Classes: 'Classes.json',
  Skills: 'Skills.json',
  Items: 'Items.json',
  Weapons: 'Weapons.json',
  Armors: 'Armors.json',
  Enemies: 'Enemies.json',
  States: 'States.json',
  Tilesets: 'Tilesets.json',
};

interface ParsedTag {
  kind: 'simple' | 'keyvalue' | 'block';
  name: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Note tag parsing
// ---------------------------------------------------------------------------

function parseNoteTags(note: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  const blockTagNames = new Set<string>();

  // Block tags first (multi-line)
  const blockPattern = /<(\w+)>\s*\n([\s\S]*?)\n\s*<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(note)) !== null) {
    blockTagNames.add(match[1]);
    tags.push({ kind: 'block', name: match[1], value: match[2].trim() });
  }

  // Simple and key-value tags (single-line)
  const simplePattern = /<(\w+)(?::([^>]*))?>/g;
  while ((match = simplePattern.exec(note)) !== null) {
    if (blockTagNames.has(match[1])) continue;
    if (match[1].startsWith('/')) continue; // closing tags
    if (match[2] !== undefined) {
      tags.push({ kind: 'keyvalue', name: match[1], value: match[2] });
    } else {
      tags.push({ kind: 'simple', name: match[1], value: '' });
    }
  }

  return tags;
}

function serializeNoteTags(tags: ParsedTag[]): string {
  const parts: string[] = [];
  for (const tag of tags) {
    switch (tag.kind) {
      case 'simple':
        parts.push(`<${tag.name}>`);
        break;
      case 'keyvalue':
        parts.push(`<${tag.name}:${tag.value}>`);
        break;
      case 'block':
        parts.push(`<${tag.name}>\n${tag.value}\n</${tag.name}>`);
        break;
    }
  }
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Data file I/O
// ---------------------------------------------------------------------------

function resolveDataDir(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return undefined;

  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, 'data');
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function loadDataFile(dataDir: string, dataType: string): unknown[] | undefined {
  const filename = DATA_TYPES[dataType];
  if (!filename) return undefined;
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return undefined;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function saveDataFile(dataDir: string, dataType: string, data: unknown[]): boolean {
  const filename = DATA_TYPES[dataType];
  if (!filename) return false;
  const filePath = path.join(dataDir, filename);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
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

function renderWebviewHtml(
  dataTypes: string[],
  entries: { id: number; name: string }[],
  selectedType: string,
  selectedId: number,
  tags: ParsedTag[],
  nonce: string
): string {
  const typeOptions = dataTypes.map(t =>
    `<option value="${escapeHtml(t)}"${t === selectedType ? ' selected' : ''}>${escapeHtml(t)}</option>`
  ).join('');

  const entryOptions = entries.map(e =>
    `<option value="${e.id}"${e.id === selectedId ? ' selected' : ''}>${escapeHtml(e.name)} (#${e.id})</option>`
  ).join('');

  const tagsHtml = tags.map((tag, idx) => {
    switch (tag.kind) {
      case 'simple':
        return `<div class="tag-row">
          <label class="tag-label">
            <input type="checkbox" checked data-idx="${idx}" data-kind="simple" />
            &lt;${escapeHtml(tag.name)}&gt;
          </label>
          <button class="remove-btn" data-idx="${idx}" title="Remove">&times;</button>
        </div>`;
      case 'keyvalue':
        return `<div class="tag-row">
          <span class="tag-name">&lt;${escapeHtml(tag.name)}:</span>
          <input type="text" class="tag-input" value="${escapeHtml(tag.value)}" data-idx="${idx}" data-kind="keyvalue" />
          <span class="tag-name">&gt;</span>
          <button class="remove-btn" data-idx="${idx}" title="Remove">&times;</button>
        </div>`;
      case 'block':
        return `<div class="tag-row tag-block">
          <span class="tag-name">&lt;${escapeHtml(tag.name)}&gt;</span>
          <button class="remove-btn" data-idx="${idx}" title="Remove">&times;</button>
          <textarea class="tag-textarea" data-idx="${idx}" data-kind="block" rows="4">${escapeHtml(tag.value)}</textarea>
          <span class="tag-name">&lt;/${escapeHtml(tag.name)}&gt;</span>
        </div>`;
      default:
        return '';
    }
  }).join('');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
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
  .selector-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
  }
  select, input[type="text"] {
    background: #313244;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    font-family: inherit;
  }
  select:focus, input:focus, textarea:focus {
    outline: none;
    border-color: #89b4fa;
  }
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #89b4fa;
    margin: 16px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tag-row {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 8px 12px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tag-block {
    flex-direction: column;
    align-items: flex-start;
  }
  .tag-block .tag-name { margin-bottom: 4px; }
  .tag-label {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    color: #f5c2e7;
    cursor: pointer;
  }
  .tag-name {
    color: #f5c2e7;
    font-weight: 500;
  }
  .tag-input {
    flex: 1;
    min-width: 120px;
  }
  .tag-textarea {
    width: 100%;
    background: #1e1e2e;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 8px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    resize: vertical;
  }
  .remove-btn {
    background: none;
    border: none;
    color: #f38ba8;
    cursor: pointer;
    font-size: 18px;
    padding: 0 4px;
    line-height: 1;
  }
  .remove-btn:hover { color: #eba0ac; }
  .button-row {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }
  button.primary {
    background: #89b4fa;
    color: #1e1e2e;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  button.primary:hover { background: #74c7ec; }
  button.secondary {
    background: #45475a;
    color: #cdd6f4;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-size: 13px;
    cursor: pointer;
  }
  button.secondary:hover { background: #585b70; }
  .empty {
    color: #6c7086;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }
  .add-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    align-items: center;
  }
  .add-row select {
    width: 100px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Note Tag Editor</h1>
  </div>

  <div class="selector-row">
    <label>Data Type:</label>
    <select id="dataType">${typeOptions}</select>
    <label>Entry:</label>
    <select id="entry">${entryOptions}</select>
    <button class="secondary" id="loadBtn">Load</button>
  </div>

  <div class="section-title">Note Tags</div>
  <div id="tagsContainer">
    ${tags.length > 0 ? tagsHtml : '<div class="empty">No note tags on this entry</div>'}
  </div>

  <div class="add-row">
    <select id="newTagKind">
      <option value="simple">Simple</option>
      <option value="keyvalue">Key:Value</option>
      <option value="block">Block</option>
    </select>
    <input type="text" id="newTagName" placeholder="Tag name" />
    <button class="secondary" id="addBtn">Add Tag</button>
  </div>

  <div class="button-row">
    <button class="primary" id="saveBtn">Save</button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    document.getElementById('loadBtn').addEventListener('click', () => {
      vscode.postMessage({
        type: 'load',
        dataType: document.getElementById('dataType').value,
        entryId: parseInt(document.getElementById('entry').value, 10)
      });
    });

    document.getElementById('dataType').addEventListener('change', () => {
      vscode.postMessage({
        type: 'changeType',
        dataType: document.getElementById('dataType').value
      });
    });

    document.getElementById('addBtn').addEventListener('click', () => {
      const name = document.getElementById('newTagName').value.trim();
      if (!name) return;
      const kind = document.getElementById('newTagKind').value;
      vscode.postMessage({ type: 'addTag', kind, name });
      document.getElementById('newTagName').value = '';
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      const tags = collectTags();
      vscode.postMessage({ type: 'save', tags });
    });

    // Delegate remove button clicks
    document.getElementById('tagsContainer').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        const idx = parseInt(e.target.dataset.idx, 10);
        vscode.postMessage({ type: 'removeTag', idx });
      }
    });

    function collectTags() {
      const tags = [];
      const container = document.getElementById('tagsContainer');

      // Checkboxes (simple tags)
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) {
          // Find the tag name from the label text
          const label = cb.closest('.tag-label');
          const text = label ? label.textContent.trim() : '';
          const nameMatch = text.match(/<(\\w+)>/);
          tags.push({
            kind: 'simple',
            name: cb.dataset.idx,
            value: '',
            checked: true
          });
        }
      });

      // Text inputs (key-value tags)
      container.querySelectorAll('input[type="text"][data-kind="keyvalue"]').forEach(input => {
        tags.push({
          kind: 'keyvalue',
          idx: parseInt(input.dataset.idx, 10),
          value: input.value
        });
      });

      // Textareas (block tags)
      container.querySelectorAll('textarea[data-kind="block"]').forEach(ta => {
        tags.push({
          kind: 'block',
          idx: parseInt(ta.dataset.idx, 10),
          value: ta.value
        });
      });

      return tags;
    }
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Webview management
// ---------------------------------------------------------------------------

let currentPanel: vscode.WebviewPanel | undefined;
let currentDataType = 'Actors';
let currentEntryId = 1;
let currentTags: ParsedTag[] = [];
let currentDataDir: string | undefined;

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function getEntries(dataDir: string, dataType: string): { id: number; name: string }[] {
  const data = loadDataFile(dataDir, dataType);
  if (!data) return [];

  const entries: { id: number; name: string }[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.id === 'number' ? e.id : 0;
    const name = typeof e.name === 'string' ? e.name : `#${id}`;
    if (id > 0) entries.push({ id, name });
  }
  return entries;
}

function updatePanel(): void {
  if (!currentPanel || !currentDataDir) return;

  const dataTypes = Object.keys(DATA_TYPES);
  const entries = getEntries(currentDataDir, currentDataType);
  const nonce = getNonce();

  currentPanel.webview.html = renderWebviewHtml(
    dataTypes, entries, currentDataType, currentEntryId, currentTags, nonce
  );
}

function loadEntry(): void {
  if (!currentDataDir) return;

  const data = loadDataFile(currentDataDir, currentDataType);
  if (!data) {
    currentTags = [];
    updatePanel();
    return;
  }

  const entry = data.find((e: unknown) => {
    if (!e || typeof e !== 'object') return false;
    return (e as Record<string, unknown>).id === currentEntryId;
  }) as Record<string, unknown> | undefined;

  if (entry && typeof entry.note === 'string') {
    currentTags = parseNoteTags(entry.note);
  } else {
    currentTags = [];
  }

  updatePanel();
}

function saveEntry(updatedValues: unknown[]): void {
  if (!currentDataDir) return;

  const data = loadDataFile(currentDataDir, currentDataType);
  if (!data) {
    vscode.window.showErrorMessage('Could not load data file for saving.');
    return;
  }

  // Apply updated values from the webview to currentTags
  if (Array.isArray(updatedValues)) {
    for (const update of updatedValues) {
      const u = update as Record<string, unknown>;
      const idx = typeof u.idx === 'number' ? u.idx : -1;
      if (idx >= 0 && idx < currentTags.length) {
        if (typeof u.value === 'string') {
          currentTags[idx].value = u.value;
        }
      }
    }
  }

  // Remove unchecked simple tags
  const checkedSimple = new Set<number>();
  if (Array.isArray(updatedValues)) {
    for (const update of updatedValues) {
      const u = update as Record<string, unknown>;
      if (u.kind === 'simple' && u.checked) {
        const idx = parseInt(String(u.name), 10);
        if (!isNaN(idx)) checkedSimple.add(idx);
      }
    }
  }

  const newNote = serializeNoteTags(currentTags);

  // Find and update the entry
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (e.id === currentEntryId) {
      e.note = newNote;
      break;
    }
  }

  if (saveDataFile(currentDataDir, currentDataType, data)) {
    vscode.window.showInformationMessage(
      `Saved note tags for ${currentDataType} #${currentEntryId}.`
    );
  } else {
    vscode.window.showErrorMessage('Failed to save data file.');
  }
}

function showNoteTagEditor(): void {
  if (!requirePro('Note Tag Editor')) return;
  currentDataDir = resolveDataDir();
  if (!currentDataDir) {
    vscode.window.showErrorMessage('No data/ directory found in workspace.');
    return;
  }

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Active);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'rmmzNoteTagEditor',
    'RMMZ Note Tag Editor',
    vscode.ViewColumn.Active,
    { enableScripts: true }
  );

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });

  currentPanel.webview.onDidReceiveMessage((msg: Record<string, unknown>) => {
    switch (msg.type) {
      case 'load':
        currentDataType = String(msg.dataType);
        currentEntryId = typeof msg.entryId === 'number' ? msg.entryId : 1;
        loadEntry();
        break;
      case 'changeType':
        currentDataType = String(msg.dataType);
        currentEntryId = 1;
        loadEntry();
        break;
      case 'addTag': {
        const kind = String(msg.kind) as ParsedTag['kind'];
        const name = String(msg.name);
        currentTags.push({ kind, name, value: '' });
        updatePanel();
        break;
      }
      case 'removeTag': {
        const idx = typeof msg.idx === 'number' ? msg.idx : -1;
        if (idx >= 0 && idx < currentTags.length) {
          currentTags.splice(idx, 1);
          updatePanel();
        }
        break;
      }
      case 'save':
        saveEntry(msg.tags as unknown[]);
        break;
    }
  });

  loadEntry();
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the `rmmz.editNoteTags` command.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.editNoteTags', showNoteTagEditor)
  );
}
