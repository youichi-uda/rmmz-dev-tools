import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from '../i18n';

/**
 * Sets up TypeScript plugin development in an RMMZ project.
 * Creates tsconfig.json, ts/plugins/, and copies type definitions.
 */
export async function setupTypeScript(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
  const root = workspaceFolder.uri.fsPath;
  const tsconfigPath = path.join(root, 'tsconfig.json');

  // Check for existing tsconfig.json
  if (fs.existsSync(tsconfigPath)) {
    const overwrite = await vscode.window.showWarningMessage(
      t('typescript.overwritePrompt'),
      t('typescript.overwrite'),
      t('typescript.cancel')
    );
    if (overwrite !== t('typescript.overwrite')) return;
  }

  // Create ts/plugins/ directory
  const tsPluginsDir = path.join(root, 'ts', 'plugins');
  if (!fs.existsSync(tsPluginsDir)) {
    fs.mkdirSync(tsPluginsDir, { recursive: true });
  }

  // Copy typings from extension bundle to project
  const srcTypingsDir = path.join(context.extensionPath, 'typings', 'rmmz');
  const destTypingsDir = path.join(root, 'ts', 'typings', 'rmmz');

  if (fs.existsSync(srcTypingsDir)) {
    if (!fs.existsSync(destTypingsDir)) {
      fs.mkdirSync(destTypingsDir, { recursive: true });
    }
    const files = fs.readdirSync(srcTypingsDir);
    for (const file of files) {
      if (file.endsWith('.d.ts')) {
        fs.copyFileSync(
          path.join(srcTypingsDir, file),
          path.join(destTypingsDir, file)
        );
      }
    }
  }

  // Generate tsconfig.json
  // Note: rootDir is set to "ts" (not "ts/plugins") so that the typings
  // directory is within rootDir and visible to the TS language server.
  // This means tsc outputs to outDir preserving the "plugins/" subdirectory,
  // so outDir is set to "js" to produce "js/plugins/*.js".
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'none',
      outDir: 'js',
      rootDir: 'ts',
      removeComments: false,
      strict: true,
      sourceMap: true,
      declaration: false,
      skipLibCheck: true,
      lib: ['ES2020'],
    },
    include: [
      'ts/plugins/**/*.ts',
      'ts/typings/**/*.d.ts',
    ],
    exclude: [
      'node_modules',
      'js',
    ],
  };

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
  vscode.window.showInformationMessage(t('typescript.setupComplete'));
}
