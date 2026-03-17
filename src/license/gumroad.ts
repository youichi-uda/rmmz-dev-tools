import * as vscode from 'vscode';
import * as https from 'https';
import { t } from '../i18n';

const GUMROAD_PRODUCT_ID = 'ZW0MFMWTX2vvvkl1EA6h7A==';
const VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

const SECRET_KEY_LICENSE = 'rmmz.licenseKey';
const SECRET_KEY_VERIFIED_AT = 'rmmz.licenseVerifiedAt';
const PURCHASE_URL = 'https://y1uda.gumroad.com/l/rmmz?wanted=true';

/** Re-verify cached license every 7 days. */
const REVERIFY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// ── Gumroad API ─────────────────────────────────────────────────────────

interface GumroadVerifyResponse {
  success: boolean;
  purchase?: {
    refunded: boolean;
    chargebacked: boolean;
  };
}

function verifyLicenseKey(licenseKey: string): Promise<GumroadVerifyResponse> {
  return new Promise((resolve, reject) => {
    const body = `product_id=${encodeURIComponent(GUMROAD_PRODUCT_ID)}&license_key=${encodeURIComponent(licenseKey)}`;

    const url = new URL(VERIFY_URL);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as GumroadVerifyResponse;
          resolve(parsed);
        } catch {
          reject(new Error('Failed to parse Gumroad response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Gumroad API request timed out'));
    });

    req.write(body);
    req.end();
  });
}

// ── License Manager ─────────────────────────────────────────────────────

export class LicenseManager {
  private licensed = false;
  private secrets: vscode.SecretStorage;

  constructor(secrets: vscode.SecretStorage) {
    this.secrets = secrets;
  }

  isProLicensed(): boolean {
    return this.licensed;
  }

  async activate(key: string): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await verifyLicenseKey(key);

      if (!resp.success) {
        return { success: false, message: t('license.invalidKey') };
      }

      if (resp.purchase?.refunded) {
        return { success: false, message: t('license.refunded') };
      }

      if (resp.purchase?.chargebacked) {
        return { success: false, message: t('license.chargebacked') };
      }

      // Store in secret storage
      await this.secrets.store(SECRET_KEY_LICENSE, key);
      await this.secrets.store(SECRET_KEY_VERIFIED_AT, String(Date.now()));
      this.licensed = true;

      return { success: true, message: t('license.activated') };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: t('license.verifyFailed', msg) };
    }
  }

  async deactivate(): Promise<void> {
    await this.secrets.delete(SECRET_KEY_LICENSE);
    await this.secrets.delete(SECRET_KEY_VERIFIED_AT);
    this.licensed = false;
  }

  async checkOnStartup(): Promise<void> {
    const cachedKey = await this.secrets.get(SECRET_KEY_LICENSE);
    if (!cachedKey) {
      this.licensed = false;
      return;
    }

    const verifiedAtStr = await this.secrets.get(SECRET_KEY_VERIFIED_AT);
    const verifiedAt = verifiedAtStr ? parseInt(verifiedAtStr, 10) : 0;
    const needsReverify = Date.now() - verifiedAt > REVERIFY_INTERVAL_MS;

    if (!needsReverify) {
      // Cache is still fresh — trust it
      this.licensed = true;
      return;
    }

    // Attempt re-verification
    try {
      const resp = await verifyLicenseKey(cachedKey);
      if (resp.success && !resp.purchase?.refunded && !resp.purchase?.chargebacked) {
        await this.secrets.store(SECRET_KEY_VERIFIED_AT, String(Date.now()));
        this.licensed = true;
      } else {
        // License no longer valid
        this.licensed = false;
        await this.deactivate();
      }
    } catch {
      // Network error — trust the cache (offline grace)
      this.licensed = true;
    }
  }
}

// ── Status bar ──────────────────────────────────────────────────────────

let statusBarItem: vscode.StatusBarItem | null = null;

function updateStatusBar(manager: LicenseManager): void {
  if (!statusBarItem) return;
  if (manager.isProLicensed()) {
    statusBarItem.text = t('license.statusBarPro');
    statusBarItem.tooltip = t('license.tooltipPro');
  } else {
    statusBarItem.text = t('license.statusBarFree');
    statusBarItem.tooltip = t('license.tooltipFree');
  }
  statusBarItem.show();
}

// ── Pro feature gate ────────────────────────────────────────────────────

let _manager: LicenseManager | null = null;

/**
 * Silently check whether the user holds a Pro license.
 * Unlike `requirePro`, this does NOT show a dialog — use it in providers
 * that run automatically (hover, CodeLens, color, rename, tree, diagnostics).
 */
export function isProLicensed(): boolean {
  return _manager?.isProLicensed() ?? false;
}

/**
 * Check whether the user holds a Pro license.  If not, show a message
 * offering to enter a license key.  Returns `true` when licensed.
 */
export function requirePro(featureName: string): boolean {
  if (_manager?.isProLicensed()) return true;

  vscode.window
    .showInformationMessage(
      t('license.requirePro', featureName),
      t('license.enterKey'),
      t('license.purchase'),
    )
    .then((choice) => {
      if (choice === t('license.enterKey')) {
        vscode.commands.executeCommand('rmmz.activateLicense');
      } else if (choice === t('license.purchase')) {
        vscode.env.openExternal(vscode.Uri.parse(PURCHASE_URL));
      }
    });

  return false;
}

// ── Public activate (called from extension.ts) ──────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<LicenseManager> {
  const manager = new LicenseManager(context.secrets);
  _manager = manager;

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'rmmz.licenseStatus';
  context.subscriptions.push(statusBarItem);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.activateLicense', async () => {
      const key = await vscode.window.showInputBox({
        prompt: t('license.prompt'),
        placeHolder: t('license.placeholder'),
        ignoreFocusOut: true,
      });
      if (!key) return;

      const result = await manager.activate(key);
      if (result.success) {
        vscode.window.showInformationMessage(result.message);
      } else {
        vscode.window.showErrorMessage(result.message);
      }
      updateStatusBar(manager);
      vscode.commands.executeCommand('rmmz.refreshQuickActions');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.deactivateLicense', async () => {
      await manager.deactivate();
      vscode.window.showInformationMessage(t('license.deactivated'));
      updateStatusBar(manager);
      vscode.commands.executeCommand('rmmz.refreshQuickActions');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.licenseStatus', () => {
      if (manager.isProLicensed()) {
        vscode.window.showInformationMessage(t('license.statusActive'));
      } else {
        vscode.window.showInformationMessage(
          t('license.statusFree'),
          t('license.enterKey'),
          t('license.purchase'),
        ).then((choice) => {
          if (choice === t('license.enterKey')) {
            vscode.commands.executeCommand('rmmz.activateLicense');
          } else if (choice === t('license.purchase')) {
            vscode.env.openExternal(vscode.Uri.parse(PURCHASE_URL));
          }
        });
      }
    })
  );

  // Startup check (silent)
  await manager.checkOnStartup();
  updateStatusBar(manager);

  return manager;
}
