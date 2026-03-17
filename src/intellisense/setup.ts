import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../i18n';

/**
 * Checks if the workspace looks like an RPG Maker MZ project.
 */
export function isRmmzProject(workspaceFolder: vscode.WorkspaceFolder): boolean {
  const root = workspaceFolder.uri.fsPath;
  const hasPluginsDir = fs.existsSync(path.join(root, 'js', 'plugins'));
  const hasDataDir = fs.existsSync(path.join(root, 'data'));
  return hasPluginsDir && hasDataDir;
}

/**
 * Offers to set up IntelliSense for the MZ project.
 * Generates jsconfig.json pointing to the core scripts.
 */
export async function setupIntelliSense(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const root = workspaceFolder.uri.fsPath;
  const jsconfigPath = path.join(root, 'jsconfig.json');

  if (fs.existsSync(jsconfigPath)) {
    const existing = fs.readFileSync(jsconfigPath, 'utf-8');
    try {
      const config = JSON.parse(existing);
      // Check if already configured
      if (config.compilerOptions?.checkJs !== undefined) {
        vscode.window.showInformationMessage(t('intellisense.alreadyExists'));
        return;
      }
    } catch {
      // Invalid JSON, offer to recreate
    }

    const overwrite = await vscode.window.showWarningMessage(
      t('intellisense.overwritePrompt'),
      t('intellisense.overwrite'),
      t('intellisense.cancel')
    );
    if (overwrite !== t('intellisense.overwrite')) return;
  }

  const jsconfig = {
    compilerOptions: {
      checkJs: false,
      target: 'ES2020',
      moduleResolution: 'node',
      baseUrl: '.',
    },
    include: [
      'js/**/*.js',
    ],
    exclude: [
      'node_modules',
    ],
  };

  fs.writeFileSync(jsconfigPath, JSON.stringify(jsconfig, null, 2), 'utf-8');
  vscode.window.showInformationMessage(t('intellisense.created'));
}

/**
 * Prompts the user to set up IntelliSense if this looks like an MZ project.
 */
export function promptIntelliSenseSetup(context: vscode.ExtensionContext): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;

  for (const folder of folders) {
    if (!isRmmzProject(folder)) continue;

    const jsconfigPath = path.join(folder.uri.fsPath, 'jsconfig.json');
    if (fs.existsSync(jsconfigPath)) continue;

    // Check if we've already prompted
    const promptedKey = `rmmz.intellisensePrompted.${folder.uri.fsPath}`;
    if (context.globalState.get<boolean>(promptedKey)) continue;

    vscode.window
      .showInformationMessage(
        t('intellisense.detected'),
        t('intellisense.setup'),
        t('intellisense.notNow'),
        t('intellisense.dontAsk')
      )
      .then(choice => {
        if (choice === t('intellisense.setup')) {
          setupIntelliSense(folder);
        }
        if (choice === t('intellisense.dontAsk') || choice === t('intellisense.setup')) {
          context.globalState.update(promptedKey, true);
        }
      });
  }
}
