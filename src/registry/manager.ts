import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegistryEntry {
  version: string;
  url?: string;
  compatibility?: string[];
  incompatible?: string[];
  notes?: string;
}

interface PluginRegistry {
  plugins: Record<string, RegistryEntry>;
}

interface InstalledPlugin {
  name: string;
  version: string;
  url: string;
  filePath: string;
}

// ---------------------------------------------------------------------------
// Plugin annotation parsing
// ---------------------------------------------------------------------------

/**
 * Extracts plugin metadata from the annotation block of a JS file.
 * Looks for @plugindesc (to confirm it's a plugin), @url, and version patterns.
 */
function parsePluginAnnotation(content: string): { version: string; url: string; pluginName: string } | undefined {
  // Find the first /*: block
  const blockMatch = content.match(/\/\*:\s*[\s\S]*?\*\//);
  if (!blockMatch) return undefined;

  const block = blockMatch[0];

  // Must have @plugindesc to be considered a plugin
  if (!/@plugindesc/.test(block)) return undefined;

  // Extract @url
  const urlMatch = block.match(/@url\s+(.+)/);
  const url = urlMatch ? urlMatch[1].trim() : '';

  // Extract version - try multiple patterns
  // @version tag
  let version = '';
  const versionTagMatch = block.match(/@version\s+(.+)/);
  if (versionTagMatch) {
    version = versionTagMatch[1].trim();
  }

  // Also check @plugindesc for version pattern like "v1.2.3" or "Version 1.2"
  if (!version) {
    const descMatch = block.match(/@plugindesc\s+(.+)/);
    if (descMatch) {
      const versionInDesc = descMatch[1].match(/v?(\d+\.\d+(?:\.\d+)?)/i);
      if (versionInDesc) {
        version = versionInDesc[1];
      }
    }
  }

  // Extract plugin name from @plugindesc or filename
  const nameMatch = block.match(/@plugindesc\s+(.+)/);
  const pluginName = nameMatch ? nameMatch[1].trim() : '';

  return { version: version || 'unknown', url, pluginName };
}

// ---------------------------------------------------------------------------
// Registry I/O
// ---------------------------------------------------------------------------

function findRegistryPath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return undefined;

  for (const folder of folders) {
    // Check data/plugin-registry.json first
    const dataPath = path.join(folder.uri.fsPath, 'data', 'plugin-registry.json');
    if (fs.existsSync(dataPath)) return dataPath;

    // Check root plugin-registry.json
    const rootPath = path.join(folder.uri.fsPath, 'plugin-registry.json');
    if (fs.existsSync(rootPath)) return rootPath;
  }

  return undefined;
}

function loadRegistry(registryPath: string): PluginRegistry | undefined {
  try {
    const raw = fs.readFileSync(registryPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.plugins === 'object') {
      return parsed as PluginRegistry;
    }
  } catch {
    // invalid registry file
  }
  return undefined;
}

function scanInstalledPlugins(): InstalledPlugin[] {
  const plugins: InstalledPlugin[] = [];
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return plugins;

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

      const filePath = path.join(pluginDir, filename);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const meta = parsePluginAnnotation(content);
        if (meta) {
          plugins.push({
            name: filename.replace('.js', ''),
            version: meta.version,
            url: meta.url,
            filePath,
          });
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  return plugins;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function checkPluginUpdates(): void {
  if (!requirePro('Plugin Registry')) return;
  const registryPath = findRegistryPath();
  const registry = registryPath ? loadRegistry(registryPath) : undefined;
  const plugins = scanInstalledPlugins();

  if (plugins.length === 0) {
    vscode.window.showInformationMessage(t('registry.noPlugins'));
    return;
  }

  const outputChannel = vscode.window.createOutputChannel(t('registry.updateHeader'));
  outputChannel.clear();
  outputChannel.show(true);

  outputChannel.appendLine(t('registry.updateHeader'));
  outputChannel.appendLine('========================');
  outputChannel.appendLine('');

  if (!registry) {
    outputChannel.appendLine(
      registryPath
        ? t('registry.registryLoaded', registryPath)
        : t('registry.noRegistry')
    );
    outputChannel.appendLine('');
  } else {
    outputChannel.appendLine(t('registry.registry', registryPath!));
    outputChannel.appendLine('');
  }

  let updatesAvailable = 0;
  let compatibilityIssues = 0;

  for (const plugin of plugins) {
    const registryEntry = registry?.plugins[plugin.name];

    let statusIcon = '  ';
    let versionInfo = `v${plugin.version}`;

    if (registryEntry) {
      if (registryEntry.version && registryEntry.version !== plugin.version) {
        statusIcon = '!!';
        versionInfo += ` -> v${registryEntry.version} ${t('registry.updateAvailable')}`;
        updatesAvailable++;
      } else {
        statusIcon = 'OK';
        versionInfo += ` ${t('registry.upToDate')}`;
      }
    } else {
      versionInfo += ` ${t('registry.notInRegistry')}`;
    }

    outputChannel.appendLine(`[${statusIcon}] ${plugin.name}`);
    outputChannel.appendLine(`     Version: ${versionInfo}`);

    if (plugin.url) {
      outputChannel.appendLine(`     URL: ${plugin.url}`);
    }

    if (registryEntry) {
      if (registryEntry.compatibility && registryEntry.compatibility.length > 0) {
        outputChannel.appendLine(`     Compatible with: ${registryEntry.compatibility.join(', ')}`);
      }
      if (registryEntry.incompatible && registryEntry.incompatible.length > 0) {
        // Check if any incompatible plugins are installed
        const installedNames = new Set(plugins.map(p => p.name));
        const conflicts = registryEntry.incompatible.filter(n => installedNames.has(n));
        if (conflicts.length > 0) {
          outputChannel.appendLine(`     ${t('registry.conflict', conflicts.join(', '))}`);
          compatibilityIssues++;
        } else {
          outputChannel.appendLine(`     Incompatible with: ${registryEntry.incompatible.join(', ')}`);
        }
      }
      if (registryEntry.notes) {
        outputChannel.appendLine(`     Note: ${registryEntry.notes}`);
      }
    }

    outputChannel.appendLine('');
  }

  outputChannel.appendLine('------------------------');
  outputChannel.appendLine(t('registry.totalPlugins', plugins.length));
  if (registry) {
    outputChannel.appendLine(t('registry.updatesAvailable', updatesAvailable));
    outputChannel.appendLine(t('registry.compatIssues', compatibilityIssues));
  }
}

function showPluginInfo(): void {
  if (!requirePro('Plugin Registry')) return;
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage(t('registry.noActiveEditor'));
    return;
  }

  const document = editor.document;
  const content = document.getText();
  const meta = parsePluginAnnotation(content);

  if (!meta) {
    vscode.window.showInformationMessage(t('registry.noAnnotation'));
    return;
  }

  const fileName = path.basename(document.fileName, '.js');
  const registryPath = findRegistryPath();
  const registry = registryPath ? loadRegistry(registryPath) : undefined;
  const registryEntry = registry?.plugins[fileName];

  const outputChannel = vscode.window.createOutputChannel('RMMZ Plugin Info');
  outputChannel.clear();
  outputChannel.show(true);

  outputChannel.appendLine(`Plugin: ${fileName}`);
  outputChannel.appendLine('='.repeat(40));
  outputChannel.appendLine('');
  outputChannel.appendLine(`Description: ${meta.pluginName}`);
  outputChannel.appendLine(`Version: ${meta.version}`);
  if (meta.url) {
    outputChannel.appendLine(`URL: ${meta.url}`);
  }
  outputChannel.appendLine(`File: ${document.fileName}`);

  if (registryEntry) {
    outputChannel.appendLine('');
    outputChannel.appendLine('Registry Info:');
    outputChannel.appendLine(`  Latest version: ${registryEntry.version}`);
    if (registryEntry.url) {
      outputChannel.appendLine(`  Registry URL: ${registryEntry.url}`);
    }
    if (registryEntry.compatibility && registryEntry.compatibility.length > 0) {
      outputChannel.appendLine(`  Compatible with: ${registryEntry.compatibility.join(', ')}`);
    }
    if (registryEntry.incompatible && registryEntry.incompatible.length > 0) {
      outputChannel.appendLine(`  Incompatible with: ${registryEntry.incompatible.join(', ')}`);
    }
    if (registryEntry.notes) {
      outputChannel.appendLine(`  Notes: ${registryEntry.notes}`);
    }

    if (registryEntry.version !== meta.version) {
      outputChannel.appendLine('');
      outputChannel.appendLine(t('registry.updateAvailableDetail', meta.version, registryEntry.version));
    }
  } else {
    outputChannel.appendLine('');
    outputChannel.appendLine(t('registry.notInPluginRegistry'));
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Registers the plugin registry commands.
 * Call from the main `activate` function.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.checkPluginUpdates', checkPluginUpdates)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.showPluginInfo', showPluginInfo)
  );
}
