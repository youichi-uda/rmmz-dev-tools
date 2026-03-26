import * as vscode from 'vscode';
import { RmmzCompletionProvider } from './annotation/completionProvider';
import { RmmzHoverProvider } from './annotation/hoverProvider';
import { createValidator } from './annotation/validator';
import { promptIntelliSenseSetup, setupIntelliSense } from './intellisense/setup';
import { setupDebugger, watchPackageJson, prepareRelease } from './debugger/setup';
import { generatePluginTemplate } from './template/generator';
import { activate as activateDataHover } from './datalink/hover';
import { activate as activateConflictDetector } from './conflict/detector';
import { activate as activateAnnotationPreview } from './preview/annotationPreview';
import { activate as activateSceneReload } from './reload/sceneReload';
import { activate as activateDependencyGraph } from './dependency/graph';
import { activate as activateNoteTagIndex } from './notetag/provider';
import { activate as activateFormatter } from './annotation/formatter';
import { activate as activateColorProvider } from './annotation/colorProvider';
import { activate as activateCodeLens } from './conflict/codeLens';
import { activate as activateLicense, requirePro } from './license/gumroad';
import { activate as activateAssetChecker } from './asset/checker';
import { activate as activateDatabaseBrowser } from './database/browser';
import { activate as activateParamRename } from './annotation/renameProvider';
import { activate as activateConsole } from './testplay/console';
import { activate as activateStateInspector } from './testplay/stateInspector';
import { activate as activateFormulaEvaluator } from './datalink/formulaEvaluator';
import { activate as activateLangSync } from './annotation/langSync';
import { activate as activateNoteTagEditor } from './notetag/editor';
import { activate as activateLivePreview } from './testplay/livePreview';
import { activate as activatePluginRegistry } from './registry/manager';
import { activate as activateClassHierarchy } from './hierarchy/browser';
import { activate as activateQuickActions } from './sidebar/quickActions';
import { setupTypeScript } from './typescript/setup';
import { activate as activateTypeScriptBuild, restoreState as restoreTypeScriptBuildState } from './typescript/autoBuild';
import { initLocale, t } from './i18n';
import { messages as enMessages } from './messages/en';
import { messages as jaMessages } from './messages/ja';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Initialize i18n before anything else
  initLocale(enMessages, jaMessages);
  const jsSelector: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
  ];

  // Completion provider for annotation tags and @type values
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      jsSelector,
      new RmmzCompletionProvider(),
      '@', ' ' // trigger on @ and space (for @type values)
    )
  );

  // Hover provider for annotation tags
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(jsSelector, new RmmzHoverProvider())
  );

  // Diagnostics / validation
  createValidator(context);

  // IntelliSense setup command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.setupIntelliSense', async () => {
      const folder = await pickWorkspaceFolder();
      if (folder) await setupIntelliSense(folder);
    })
  );

  // Debugger setup command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.setupDebugger', async () => {
      if (!requirePro('Debugger Setup')) return;
      const folder = await pickWorkspaceFolder();
      if (folder) await setupDebugger(folder);
    })
  );

  // Plugin template generator command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.newPlugin', generatePluginTemplate)
  );

  // Prepare for Release command (remove debug port from package.json)
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.prepareRelease', async () => {
      const folder = await pickWorkspaceFolder();
      if (folder) await prepareRelease(folder);
    })
  );

  // Watch package.json for MZ editor overwrites (all workspace folders)
  const folders = vscode.workspace.workspaceFolders;
  if (folders) {
    for (const folder of folders) {
      watchPackageJson(context, folder);
    }
  }

  // Data hover preview (Phase 2: $dataXxx[N], switches, variables)
  activateDataHover(context);

  // Plugin conflict detection (prototype override analysis)
  activateConflictDetector(context);

  // Annotation preview webview (live MZ Plugin Manager preview)
  activateAnnotationPreview(context);

  // Quick Scene Reload (re-evaluate plugin + reload scene on save)
  activateSceneReload(context);

  // Plugin dependency graph webview
  activateDependencyGraph(context);

  // Note Tag Index sidebar (scan data files for note tags)
  activateNoteTagIndex(context);

  // Annotation formatter command
  activateFormatter(context);

  // Color picker for hex colors in annotation @default
  activateColorProvider(context);

  // CodeLens for prototype override detection
  activateCodeLens(context);

  // Asset reference checker (scan @dir/@require tags)
  activateAssetChecker(context);

  // Database browser sidebar (tree view of data/*.json)
  activateDatabaseBrowser(context);

  // Plugin parameter rename support (@param/@arg renaming)
  activateParamRename(context);

  // Testplay Console Viewer (pipe game console to output channel)
  activateConsole(context);

  // Game State Inspector (sidebar tree view of live game state)
  activateStateInspector(context);

  // Battle Formula Evaluator (hover preview for damage formulas)
  activateFormulaEvaluator(context);

  // Multi-language annotation sync (structural consistency between locale blocks)
  activateLangSync(context);

  // Visual Note Tag Editor (webview for editing data file note tags)
  activateNoteTagEditor(context);

  // Live Game Preview (CDP screenshot capture in webview)
  activateLivePreview(context);

  // Plugin Registry Integration (version checking and compatibility)
  activatePluginRegistry(context);

  // Class Hierarchy Browser (inheritance tree for RMMZ classes)
  activateClassHierarchy(context);

  // Quick Actions sidebar (button panel in RMMZ view container)
  activateQuickActions(context);

  // TypeScript setup command
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.setupTypeScript', async () => {
      if (!requirePro('TypeScript Setup')) return;
      const folder = await pickWorkspaceFolder();
      if (folder) await setupTypeScript(context, folder);
    })
  );

  // TypeScript auto-build (file watcher + tsc)
  activateTypeScriptBuild(context);

  // License management (Gumroad Pro license)
  await activateLicense(context);

  // Restore auto-build state now that license is initialized
  restoreTypeScriptBuildState();

  // Prompt IntelliSense setup on activation
  promptIntelliSenseSetup(context);

  console.log('RMMZ Dev Tools activated');
}

async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage(t('noWorkspaceFolder'));
    return undefined;
  }
  if (folders.length === 1) return folders[0];
  return vscode.window.showWorkspaceFolderPick({
    placeHolder: t('pickWorkspaceFolder'),
  });
}

export function deactivate(): void {
  // cleanup if needed
}
