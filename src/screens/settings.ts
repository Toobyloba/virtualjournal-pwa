// ── screens/settings.ts ───────────────────────────────────────────────────────

import { loadSettings, saveSettings, readVault, writeVault,
         saveVerificationToken, loadVerificationToken,
         replaceAllEntries, validateVaultFile }   from '../storage';
import { encrypt, decrypt, reEncryptPayload,
         verifyPassword }                          from '../crypto';
import { getPassword, lock, refreshAutoLockSec }  from '../auth';
import { navigate }                               from '../router';
import { showToast }                              from '../utils/dateFormat';

const KNOWN_PLAINTEXT = 'glyph_v1_verification_token';

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately (30s)', value: 30  },
  { label: '1 minute',          value: 60  },
  { label: '2 minutes',         value: 120 },
  { label: '5 minutes',         value: 300 },
  { label: '15 minutes',        value: 900 },
  { label: 'Never',             value: 0   },
];

export async function renderSettings(container: HTMLElement): Promise<void> {
  const settings = await loadSettings();

  container.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">← Back</button>
        <span class="topbar-title">Settings</span>
      </div>
      <div class="scroll-area">

        <div class="settings-section">
          <div class="settings-section-title">Auto-Lock</div>
          ${AUTO_LOCK_OPTIONS.map(opt => `
            <div class="settings-row" data-lock="${opt.value}">
              <span class="settings-row-label">${opt.label}</span>
              <span class="settings-row-check" style="opacity:${settings.autoLockSeconds === opt.value ? 1 : 0}">✓</span>
            </div>
          `).join('')}
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Security</div>
          <div class="settings-row" id="change-pwd-row">
            <span class="settings-row-label">Change password</span>
            <span style="color:var(--text-faint)">→</span>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Backup &amp; Restore</div>
          <div class="settings-row" id="export-row">
            <span class="settings-row-label">Export vault</span>
            <span style="color:var(--text-faint)">↓</span>
          </div>
          <div class="settings-row" id="import-row">
            <span class="settings-row-label">Import vault</span>
            <span style="color:var(--text-faint)">↑</span>
          </div>
        </div>

        <div class="settings-section" id="drive-section">
          <!-- Drive section rendered dynamically -->
        </div>

        <div class="settings-section">
          <div class="settings-section-title">About</div>
          <div class="settings-row" style="cursor:default">
            <span class="settings-row-label">Glyph</span>
            <span style="color:var(--text-faint); font-size:13px">v1.0 PWA</span>
          </div>
        </div>

      </div>
    </div>

    <input type="file" id="import-input" accept=".ejson,.json" style="display:none">
  `;

  container.querySelector('#back-btn')!.addEventListener('click', () => navigate('#home'));
  renderDriveSection(container);

  container.querySelectorAll<HTMLElement>('[data-lock]').forEach(row => {
    row.addEventListener('click', async () => {
      const val = parseInt(row.dataset['lock']!);
      await saveSettings({ autoLockSeconds: val });
      await refreshAutoLockSec();
      await renderSettings(container);
    });
  });

  container.querySelector('#change-pwd-row')!.addEventListener('click', () => showChangePwdModal(container));
  container.querySelector('#export-row')!.addEventListener('click', () => exportVault());
  container.querySelector('#import-row')!.addEventListener('click', () => {
    container.querySelector<HTMLInputElement>('#import-input')!.click();
  });

  container.querySelector<HTMLInputElement>('#import-input')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await importVault(file);
  });
}

async function exportVault(): Promise<void> {
  try {
    const vault = await readVault();
    if (!vault) { showToast('No vault to export'); return; }
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'glyph-vault.ejson',
          types: [{ description: 'Encrypted Vault', accept: { 'application/json': ['.ejson', '.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast('Vault exported');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = 'glyph-vault.ejson';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('Vault exported to Downloads');
  } catch (e) {
    showToast(`Export failed: ${(e as Error).message}`);
  }
}

async function importVault(file: File): Promise<void> {
  try {
    const text = await file.text();
    const obj  = JSON.parse(text);
    if (!validateVaultFile(obj)) {
      showToast('Invalid vault file');
      return;
    }
    await writeVault(obj);
    showToast('Vault imported. Unlock with the backup\'s password.');
    lock();
  } catch (e) {
    showToast(`Import failed: ${(e as Error).message}`);
  }
}

function showChangePwdModal(container: HTMLElement): void {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Change Password</div>
      <div class="form-group">
        <label class="label">Current password</label>
        <input id="cp-current" type="password" class="input" placeholder="Current password" autocomplete="current-password">
      </div>
      <div class="form-group">
        <label class="label">New password</label>
        <input id="cp-new" type="password" class="input" placeholder="New password (min 8 chars)" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label class="label">Confirm new password</label>
        <input id="cp-confirm" type="password" class="input" placeholder="Confirm new password" autocomplete="new-password">
      </div>
      <div id="cp-error" class="error-msg"></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cp-cancel">Cancel</button>
        <button class="btn btn-primary"   id="cp-submit">Change</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#cp-cancel')!.addEventListener('click', () => overlay.remove());

  overlay.querySelector('#cp-submit')!.addEventListener('click', async () => {
    const currentPwd = (overlay.querySelector<HTMLInputElement>('#cp-current')!).value;
    const newPwd     = (overlay.querySelector<HTMLInputElement>('#cp-new')!).value;
    const confirmPwd = (overlay.querySelector<HTMLInputElement>('#cp-confirm')!).value;
    const errEl      = overlay.querySelector<HTMLElement>('#cp-error')!;
    const submitBtn  = overlay.querySelector<HTMLButtonElement>('#cp-submit')!;

    errEl.textContent = '';
    if (newPwd.length < 8)     { errEl.textContent = 'New password must be at least 8 characters.'; return; }
    if (newPwd !== confirmPwd) { errEl.textContent = 'Passwords do not match.'; return; }

    const token = await loadVerificationToken();
    if (!token) { errEl.textContent = 'No verification token found.'; return; }
    const valid = await verifyPassword(token, currentPwd);
    if (!valid) { errEl.textContent = 'Current password is wrong.'; return; }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    const progressOverlay = document.createElement('div');
    progressOverlay.className = 'overlay';
    progressOverlay.innerHTML = `
      <div class="modal" style="text-align:center; gap:20px">
        <div class="modal-title">Re-encrypting…</div>
        <div class="spinner" style="margin: 0 auto; width:32px; height:32px; border-width:3px"></div>
        <div id="reenc-progress" style="color:var(--text-muted); font-size:14px"></div>
      </div>
    `;
    document.body.appendChild(progressOverlay);
    overlay.remove();

    try {
      const vault   = await readVault();
      const entries = vault?.entries ?? [];
      const progEl  = progressOverlay.querySelector<HTMLElement>('#reenc-progress')!;
      const updated = [];

      for (let i = 0; i < entries.length; i++) {
        progEl.textContent = `Entry ${i + 1} of ${entries.length}`;
        const e = entries[i];
        const [newPayload, newPreview] = await Promise.all([
          reEncryptPayload(e.payload,        currentPwd, newPwd),
          reEncryptPayload(e.previewPayload, currentPwd, newPwd),
        ]);
        updated.push({ ...e, payload: newPayload, previewPayload: newPreview });
      }

      await replaceAllEntries(updated);
      const newToken = await encrypt(KNOWN_PLAINTEXT, newPwd);
      await saveVerificationToken(newToken);

      progressOverlay.remove();
      showToast('Password changed. Please log in again.');
      lock();
    } catch (err) {
      progressOverlay.remove();
      showToast(`Re-encryption failed: ${(err as Error).message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Change';
    }
  });

  (overlay.querySelector<HTMLInputElement>('#cp-current')!).focus();
}

import { isDriveEnabled, isTokenValid, startOAuthFlow,
         revokeToken, downloadVault }   from '../server';

export async function renderDriveSection(container: HTMLElement): Promise<void> {
  const section = container.querySelector<HTMLElement>('#drive-section')!;
  const enabled = await isDriveEnabled();
  const authed  = isTokenValid();

  if (!enabled || !authed) {
    section.innerHTML = `
      <div class="settings-section-title">Server Storage</div>
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Automatically back up your encrypted vault to your server after every save.
        The server only sees ciphertext — your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="drive-connect-btn" style="margin-bottom:4px">
        Connect Server
      </button>
    `;
    section.querySelector('#drive-connect-btn')!.addEventListener('click', () => startOAuthFlow());
  } else {
    section.innerHTML = `
      <div class="settings-section-title">Server Storage</div>
      <div class="settings-row" style="cursor:default; margin-bottom:2px">
        <span class="settings-row-label">Status</span>
        <span style="color:var(--success); font-size:13px">● Connected</span>
      </div>
      <div class="settings-row" id="drive-restore-row">
        <span class="settings-row-label">Restore from Server</span>
        <span style="color:var(--text-faint)">↓</span>
      </div>
      <div class="settings-row" id="drive-disconnect-row" style="margin-top:2px">
        <span class="settings-row-label" style="color:var(--danger)">Disconnect Server</span>
        <span style="color:var(--text-faint)">→</span>
      </div>
    `;

    section.querySelector('#drive-restore-row')!.addEventListener('click', async () => {
      if (!confirm('Replace the local vault with the copy from the server?')) return;
      try {
        const json = await downloadVault();
        const obj  = JSON.parse(json);
        if (!validateVaultFile(obj)) { showToast('Invalid vault on server'); return; }
        await writeVault(obj);
        showToast('Vault restored from server. Please unlock again.');
        lock();
      } catch (e) {
        showToast(`Restore failed: ${(e as Error).message}`);
      }
    });

    section.querySelector('#drive-disconnect-row')!.addEventListener('click', async () => {
      if (!confirm('Disconnect server storage? Local vault is kept.')) return;
      await revokeToken();
      await renderDriveSection(container);
      showToast('Server storage disconnected');
    });
  }
}
