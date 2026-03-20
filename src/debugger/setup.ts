import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../i18n';

const CHROMIUM_ARGS = '--remote-debugging-port=9222';

/** Suppress watcher restore after intentional removal (prepareRelease). */
let suppressRestoreUntil = 0;

/**
 * Resolves the nw.exe path from the configured RMMZ install path.
 * If not configured, prompts the user to select the folder.
 * Returns the nw.exe path or undefined if cancelled.
 */
async function resolveNwExePath(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('rmmz');
  let installPath: string = config.get('rmmzInstallPath', '');

  if (installPath) {
    const nwExe = path.join(installPath, 'nwjs-win', 'nw.exe');
    if (fs.existsSync(nwExe)) {
      return nwExe;
    }
    // Configured path is invalid — fall through to prompt
    vscode.window.showWarningMessage(t('debugger.nwExeNotFound', installPath));
  }

  // Ask user to select the RMMZ install folder
  const selected = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: t('debugger.selectInstallFolder'),
    title: t('debugger.selectInstallFolderTitle'),
  });

  if (!selected || selected.length === 0) {
    return undefined;
  }

  const selectedPath = selected[0].fsPath;
  const nwExe = path.join(selectedPath, 'nwjs-win', 'nw.exe');

  if (!fs.existsSync(nwExe)) {
    vscode.window.showErrorMessage(t('debugger.nwExeNotFoundSelected', selectedPath));
    return undefined;
  }

  // Save the path to settings
  await config.update('rmmzInstallPath', selectedPath, vscode.ConfigurationTarget.Global);
  return nwExe;
}

/**
 * Generates launch.json for NW.js debugger attachment.
 */
export async function setupDebugger(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const root = workspaceFolder.uri.fsPath;
  const vscodeDir = path.join(root, '.vscode');
  const launchPath = path.join(vscodeDir, 'launch.json');

  // Ensure .vscode directory exists
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }

  // Resolve the nw.exe path
  const nwExePath = await resolveNwExePath();
  if (!nwExePath) {
    return;
  }

  // Check if launch.json already has an nwjs config — update runtimeExecutable if so
  if (fs.existsSync(launchPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(launchPath, 'utf-8'));
      const nwjsLaunch = existing.configurations?.find(
        (c: { type?: string; request?: string; name?: string }) =>
          (c.type === 'chrome' || c.type === 'nwjs') && c.request === 'launch' && c.name?.includes('RMMZ')
      );
      if (nwjsLaunch) {
        nwjsLaunch.runtimeExecutable = nwExePath;
        fs.writeFileSync(launchPath, JSON.stringify(existing, null, 2), 'utf-8');
        vscode.window.showInformationMessage(t('debugger.updated'));
        ensureChromiumArgs(root);
        return;
      }
    } catch {
      // Invalid JSON, will overwrite
    }
  }

  const launchConfig = {
    version: '0.2.0',
    configurations: [
      {
        type: 'chrome',
        request: 'launch',
        name: 'RMMZ Testplay (Debug)',
        runtimeExecutable: nwExePath,
        runtimeArgs: [
          '.',
          `--${CHROMIUM_ARGS.replace('--', '')}`,
        ],
        webRoot: '${workspaceFolder}',
        port: 9222,
        sourceMapPathOverrides: {
          'ts/plugins/*': '${workspaceFolder}/ts/plugins/*',
        },
      },
      {
        type: 'chrome',
        request: 'attach',
        name: 'Attach to RMMZ Testplay',
        port: 9222,
        webRoot: '${workspaceFolder}',
        sourceMapPathOverrides: {
          'ts/plugins/*': '${workspaceFolder}/ts/plugins/*',
        },
      },
    ],
  };

  // Merge with existing launch.json if present
  if (fs.existsSync(launchPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(launchPath, 'utf-8'));
      if (Array.isArray(existing.configurations)) {
        existing.configurations.push(...launchConfig.configurations);
        fs.writeFileSync(launchPath, JSON.stringify(existing, null, 2), 'utf-8');
        vscode.window.showInformationMessage(t('debugger.addedToExisting'));
        ensureChromiumArgs(root);
        return;
      }
    } catch {
      // Fall through to overwrite
    }
  }

  fs.writeFileSync(launchPath, JSON.stringify(launchConfig, null, 2), 'utf-8');
  vscode.window.showInformationMessage(t('debugger.created'));
  ensureChromiumArgs(root);
}

/**
 * Ensures package.json has the chromium-args for remote debugging.
 */
function ensureChromiumArgs(root: string): void {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    // MZ's package.json has chromium-args at the top level
    const currentArgs: string = pkg['chromium-args'] || '';
    if (!currentArgs.includes('remote-debugging-port')) {
      pkg['chromium-args'] = currentArgs
        ? `${currentArgs} ${CHROMIUM_ARGS}`
        : CHROMIUM_ARGS;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
    }
  } catch {
    // Not a JSON file or can't parse
  }
}

/**
 * Removes chromium-args (remote-debugging-port) from package.json
 * to prepare the project for release/distribution.
 */
export async function prepareRelease(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const root = workspaceFolder.uri.fsPath;
  const pkgPath = path.join(root, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    vscode.window.showWarningMessage(t('release.noPackageJson'));
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const currentArgs: string = pkg['chromium-args'] || '';

    if (!currentArgs.includes('remote-debugging-port')) {
      vscode.window.showInformationMessage(t('release.alreadyClean'));
      return;
    }

    // Remove the remote-debugging-port arg
    const cleaned = currentArgs
      .replace(/--remote-debugging-port=\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned) {
      pkg['chromium-args'] = cleaned;
    } else {
      delete pkg['chromium-args'];
    }

    suppressRestoreUntil = Date.now() + 3000; // suppress watcher for 3s
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
    vscode.window.showInformationMessage(t('release.done'));
  } catch {
    vscode.window.showErrorMessage(t('release.error'));
  }
}

/**
 * Watches the project's package.json and re-injects chromium-args
 * when RPG Maker MZ editor overwrites it.
 */
export function watchPackageJson(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder
): void {
  const root = workspaceFolder.uri.fsPath;
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  // Only watch if we've previously set up debugging
  const launchPath = path.join(root, '.vscode', 'launch.json');
  if (!fs.existsSync(launchPath)) return;

  try {
    const launch = JSON.parse(fs.readFileSync(launchPath, 'utf-8'));
    const hasNwjs = launch.configurations?.some(
      (c: { type?: string; name?: string }) =>
        (c.type === 'chrome' || c.type === 'nwjs') && c.name?.includes('RMMZ')
    );
    if (!hasNwjs) return;
  } catch {
    return;
  }

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, 'package.json')
  );

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const onPackageJsonChange = () => {
    // Debounce — MZ may write multiple times
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (Date.now() < suppressRestoreUntil) return;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const currentArgs: string = pkg['chromium-args'] || '';
        if (!currentArgs.includes('remote-debugging-port')) {
          pkg['chromium-args'] = currentArgs
            ? `${currentArgs} ${CHROMIUM_ARGS}`
            : CHROMIUM_ARGS;
          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
          vscode.window.showInformationMessage(
            t('debugger.restoredPort')
          );
        }
      } catch {
        // Ignore parse errors during write
      }
    }, 500);
  };

  watcher.onDidChange(onPackageJsonChange);
  watcher.onDidCreate(onPackageJsonChange);
  context.subscriptions.push(watcher);
}
