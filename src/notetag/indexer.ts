import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteTagOccurrence {
  source: string;
  id: number;
  name: string;
  value?: string;
}

export interface NoteTagIndex {
  /** tag name -> list of occurrences in data files */
  tags: Map<string, NoteTagOccurrence[]>;
  /** tag names declared via @noteParam in plugins */
  declared: Set<string>;
  /** tags found in data but not declared by any plugin */
  orphaned: string[];
  /** tags declared by plugins but not found in data */
  unused: string[];
}

// ---------------------------------------------------------------------------
// Data file scanning
// ---------------------------------------------------------------------------

/** Data files that may contain entries with a `note` field. */
const DATA_FILES = [
  'Actors.json',
  'Classes.json',
  'Skills.json',
  'Items.json',
  'Weapons.json',
  'Armors.json',
  'Enemies.json',
  'States.json',
  'Tilesets.json',
];

/**
 * Regex patterns for note tags:
 *  - `<TagName>`             (simple flag)
 *  - `<TagName:value>`       (key-value)
 *  - `<TagName>\n...\n</TagName>` (block)
 */
const SIMPLE_TAG_PATTERN = /<(\w+)(?::([^>]*))?>/g;
const BLOCK_TAG_PATTERN = /<(\w+)>\s*\n([\s\S]*?)\n\s*<\/\1>/g;

/** Pattern for @noteParam in plugin annotation blocks. */
const NOTE_PARAM_PATTERN = /@noteParam\s+(\w+)/g;

// ---------------------------------------------------------------------------
// NoteTagIndexer
// ---------------------------------------------------------------------------

export class NoteTagIndexer {
  private dataDir: string | undefined;

  /** Locate the `data/` directory in the first workspace folder that has one. */
  private resolveDataDir(): string | undefined {
    if (this.dataDir) return this.dataDir;

    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return undefined;

    for (const folder of folders) {
      const candidate = path.join(folder.uri.fsPath, 'data');
      if (fs.existsSync(candidate)) {
        this.dataDir = candidate;
        return this.dataDir;
      }
    }
    return undefined;
  }

  /** Build a complete note tag index from all data files and plugins. */
  async buildIndex(): Promise<NoteTagIndex> {
    const tags = new Map<string, NoteTagOccurrence[]>();
    const declared = new Set<string>();

    const dataDir = this.resolveDataDir();
    if (dataDir) {
      this.scanDataFiles(dataDir, tags);
      this.scanMapFiles(dataDir, tags);
    }

    this.scanPlugins(declared);

    const tagNames = new Set(tags.keys());
    const orphaned = [...tagNames].filter(t => !declared.has(t)).sort();
    const unused = [...declared].filter(t => !tagNames.has(t)).sort();

    return { tags, declared, orphaned, unused };
  }

  /** Scan standard data files for note tags. */
  private scanDataFiles(
    dataDir: string,
    tags: Map<string, NoteTagOccurrence[]>
  ): void {
    for (const filename of DATA_FILES) {
      const filePath = path.join(dataDir, filename);
      if (!fs.existsSync(filePath)) continue;

      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        const source = filename.replace('.json', '');
        for (const entry of parsed) {
          if (!entry || typeof entry.note !== 'string' || !entry.note) continue;
          this.extractTags(entry.note, source, entry.id ?? 0, entry.name ?? '', tags);
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  /** Scan Map*.json files for note tags on the map itself. */
  private scanMapFiles(
    dataDir: string,
    tags: Map<string, NoteTagOccurrence[]>
  ): void {
    let files: string[];
    try {
      files = fs.readdirSync(dataDir);
    } catch {
      return;
    }

    for (const filename of files) {
      if (!/^Map\d+\.json$/.test(filename)) continue;

      const filePath = path.join(dataDir, filename);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.note === 'string' && parsed.note) {
          const mapId = parseInt(filename.match(/\d+/)![0], 10);
          const source = filename.replace('.json', '');
          this.extractTags(parsed.note, source, mapId, parsed.displayName || source, tags);
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  /** Extract note tags from a note string and add them to the index. */
  private extractTags(
    note: string,
    source: string,
    id: number,
    name: string,
    tags: Map<string, NoteTagOccurrence[]>
  ): void {
    // Block tags (multi-line)
    BLOCK_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    const blockTagNames = new Set<string>();

    while ((match = BLOCK_TAG_PATTERN.exec(note)) !== null) {
      const tagName = match[1];
      const value = match[2].trim();
      blockTagNames.add(tagName);
      this.addOccurrence(tags, tagName, { source, id, name, value });
    }

    // Simple tags (single-line) -- skip if already captured as block tag
    SIMPLE_TAG_PATTERN.lastIndex = 0;
    while ((match = SIMPLE_TAG_PATTERN.exec(note)) !== null) {
      const tagName = match[1];
      if (blockTagNames.has(tagName)) continue;
      const value = match[2] || undefined;
      this.addOccurrence(tags, tagName, { source, id, name, value });
    }
  }

  /** Add an occurrence entry for a tag. */
  private addOccurrence(
    tags: Map<string, NoteTagOccurrence[]>,
    tagName: string,
    occurrence: NoteTagOccurrence
  ): void {
    let list = tags.get(tagName);
    if (!list) {
      list = [];
      tags.set(tagName, list);
    }
    list.push(occurrence);
  }

  /** Scan plugin JS files for @noteParam declarations. */
  private scanPlugins(declared: Set<string>): void {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    for (const folder of folders) {
      const pluginDir = path.join(folder.uri.fsPath, 'js', 'plugins');
      if (!fs.existsSync(pluginDir)) continue;

      let files: string[];
      try {
        files = fs.readdirSync(pluginDir);
      } catch {
        continue;
      }

      for (const filename of files) {
        if (!filename.endsWith('.js')) continue;
        try {
          const raw = fs.readFileSync(path.join(pluginDir, filename), 'utf-8');
          NOTE_PARAM_PATTERN.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = NOTE_PARAM_PATTERN.exec(raw)) !== null) {
            declared.add(match[1]);
          }
        } catch {
          // skip unreadable files
        }
      }
    }
  }
}
