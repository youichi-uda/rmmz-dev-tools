import * as vscode from 'vscode';
import { isProLicensed } from '../license/gumroad';
import { t } from '../i18n';

/**
 * Provides the Quick Actions webview in the RMMZ sidebar.
 * Shows categorized buttons for common commands.
 * Pro features show a badge when not licensed.
 */
export class QuickActionsProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'rmmzQuickActions';

  private _view?: vscode.WebviewView;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    this.updateHtml();

    webviewView.webview.onDidReceiveMessage((msg: { command: string }) => {
      vscode.commands.executeCommand(msg.command);
    });
  }

  /** Re-render (e.g., after license state changes). */
  refresh(): void {
    this.updateHtml();
  }

  private updateHtml(): void {
    if (!this._view) return;
    this._view.webview.html = this.getHtml(isProLicensed());
  }

  private btn(cmd: string, icon: string, label: string, pro: boolean, licensed: boolean): string {
    const badge = (pro && !licensed) ? '<span class="pro">PRO</span>' : '';
    return `<button class="btn" onclick="send('${cmd}')"><span class="icon">${icon}</span>${label}${badge}</button>`;
  }

  private getHtml(licensed: boolean): string {
    const b = (cmd: string, icon: string, label: string, pro = false) =>
      this.btn(cmd, icon, label, pro, licensed);

    const body = `
  <div class="section">
    <div class="section-title">${t('quickActions.plugin')}</div>
    ${b('rmmz.newPlugin', '+', t('quickActions.newPlugin'))}
    ${b('rmmz.previewAnnotation', '&#x25A3;', t('quickActions.annotationPreview'), true)}
    ${b('rmmz.formatAnnotation', '&#x2261;', t('quickActions.formatAnnotation'))}
  </div>

  <div class="section">
    <div class="section-title">${t('quickActions.analysis')}</div>
    ${b('rmmz.showConflicts', '&#x26A0;', t('quickActions.pluginConflicts'))}
    ${b('rmmz.showDependencyGraph', '&#x2B95;', t('quickActions.dependencyGraph'), true)}
    ${b('rmmz.checkAssets', '&#x1F50D;', t('quickActions.checkAssets'))}
    ${b('rmmz.checkPluginUpdates', '&#x21BB;', t('quickActions.checkUpdates'), true)}
  </div>

  <div class="section">
    <div class="section-title">${t('quickActions.data')}</div>
    ${b('rmmz.editNoteTags', '&#x270E;', t('quickActions.editNoteTags'), true)}
    ${b('rmmz.searchHierarchy', '&#x1F50E;', t('quickActions.searchClasses'), true)}
  </div>

  <div class="section">
    <div class="section-title">${t('quickActions.testplay')}</div>
    ${b('rmmz.toggleSceneReload', '&#x26A1;', t('quickActions.toggleSceneReload'), true)}
    ${b('rmmz.showConsole', '&#x25B6;', t('quickActions.console'), true)}
    ${b('rmmz.showLivePreview', '&#x1F3AE;', t('quickActions.livePreview'), true)}
  </div>

  <div class="section">
    <div class="section-title">${t('quickActions.setup')}</div>
    ${b('rmmz.setupIntelliSense', '&#x2699;', t('quickActions.setupIntelliSense'))}
    ${b('rmmz.setupDebugger', '&#x1F41E;', t('quickActions.setupDebugger'), true)}
  </div>`;

    return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    padding: 8px;
  }
  .section {
    margin-bottom: 12px;
  }
  .section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 4px;
    padding: 0 2px;
  }
  .btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 5px 8px;
    margin-bottom: 2px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--vscode-foreground);
    font-family: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    line-height: 1.4;
  }
  .btn:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .btn .icon {
    display: inline-block;
    width: 18px;
    text-align: center;
    margin-right: 4px;
    opacity: 0.8;
    flex-shrink: 0;
  }
  .pro {
    margin-left: auto;
    padding: 0 5px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    flex-shrink: 0;
  }
</style>
</head>
<body>
  ${body}
  <script>
    const vscode = acquireVsCodeApi();
    function send(command) {
      vscode.postMessage({ command });
    }
  </script>
</body>
</html>`;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new QuickActionsProvider();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      QuickActionsProvider.viewType,
      provider
    )
  );

  // Refresh badge when license state may have changed
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.refreshQuickActions', () => {
      provider.refresh();
    })
  );
}
