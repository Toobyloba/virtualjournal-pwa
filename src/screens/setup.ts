// ── screens/setup.ts ──────────────────────────────────────────────────────────
//
// Single entry-point for all auth/onboarding flows. Three tabs:
//
//   • Login      — shown by default when a vault already exists on this device
//   • Restore    — import a backup (.ejson) from a local file or Google Drive
//   • New Vault  — create a fresh vault with a new master password
//
// The `initialTab` parameter lets the router pre-select a tab.

import { saveVerificationToken, writeVault, loadVerificationToken,
         saveSettings, vaultExists, validateVaultFile } from '../storage';
import { encrypt, verifyPassword }                      from '../crypto';
import { unlock }                                       from '../auth';
import { navigate }                                     from '../router';
import { passwordStrength, showToast }                  from '../utils/dateFormat';
import { isDriveEnabled, isTokenValid, startOAuthFlow,
         handleOAuthCallback, loadTokenFromIdb,
         downloadVault }                                from '../drive';

const KNOWN_PLAINTEXT = 'glyph_v1_verification_token';
const MAX_ATTEMPTS    = 5;
const LOCKOUT_SEC     = 30;

// Module-level lockout state (persists across re-renders within same session)
let loginAttempts = 0;
let lockoutEnd    = 0;

export type SetupTab = 'login' | 'restore' | 'new';

// ── Entry point ───────────────────────────────────────────────────────────────

export async function renderSetup(
  container: HTMLElement,
  initialTab?: SetupTab
): Promise<void> {
  // Handle OAuth redirect-back (token in URL hash)
  await loadTokenFromIdb();
  const wasOAuth = await handleOAuthCallback();

  // Decide default tab: login if vault exists, new otherwise
  const hasVault = await vaultExists();
  const startTab: SetupTab = initialTab ?? (hasVault ? 'login' : 'new');

  container.innerHTML = `
    <div class="screen">
      <div class="center-screen setup-center">

        <div class="lock-icon">✦</div>
        <div class="screen-title">Glyph</div>

        <!-- Tab bar -->
        <div class="setup-tabs" id="setup-tab-bar">
          <button class="setup-tab${startTab === 'login'   ? ' active' : ''}" data-tab="login"
            ${!hasVault ? 'style="display:none"' : ''}>
            Unlock
          </button>
          <button class="setup-tab${startTab === 'restore' ? ' active' : ''}" data-tab="restore">
            Restore
          </button>
          <button class="setup-tab${startTab === 'new'     ? ' active' : ''}" data-tab="new">
            New Vault
          </button>
        </div>

        <!-- ──────── Panel: Login ──────── -->
        <div id="panel-login" class="setup-panel${startTab === 'login' ? ' active' : ''}">
          <p class="screen-subtitle">Welcome back. Enter your password to unlock.</p>

          <div class="form-group">
            <label class="label" for="login-pwd">Password</label>
            <input id="login-pwd" type="password" class="input"
              placeholder="Your master password"
              autocomplete="current-password">
          </div>

          <div id="login-error" class="error-area"></div>
          <button id="login-btn" class="btn btn-primary">Unlock</button>
        </div>

        <!-- ──────── Panel: Restore ──────── -->
        <div id="panel-restore" class="setup-panel${startTab === 'restore' ? ' active' : ''}">
          <p class="screen-subtitle">
            Restore from a <strong>.ejson</strong> backup or from Google Drive.
          </p>

          <!-- Source toggle -->
          <div class="restore-source-row">
            <button class="restore-source-btn active" id="src-file">💾 Local file</button>
            <button class="restore-source-btn"        id="src-drive">☁️ Google Drive</button>
          </div>

          <!-- Local file -->
          <div id="restore-file-section">
            <div class="drop-zone" id="drop-zone">
              <span id="drop-label">Drop .ejson here or <u>browse</u></span>
              <input type="file" id="file-input" accept=".ejson,.json" style="display:none">
            </div>
            <div id="file-chosen" style="display:none" class="file-chosen-row">
              <span id="file-name"></span>
              <button class="icon-btn" id="file-clear">✕</button>
            </div>
          </div>

          <!-- Drive -->
          <div id="restore-drive-section" style="display:none">
            <div id="drive-status-area"></div>
          </div>

          <div class="form-group" style="margin-top:4px">
            <label class="label" for="restore-pwd">Vault password</label>
            <input id="restore-pwd" type="password" class="input"
              placeholder="Password used when vault was created"
              autocomplete="current-password">
          </div>

          <div id="restore-error" class="error-area"></div>
          <button id="restore-btn" class="btn btn-primary">Restore &amp; Unlock</button>
        </div>

        <!-- ──────── Panel: New Vault ──────── -->
        <div id="panel-new" class="setup-panel${startTab === 'new' ? ' active' : ''}">
          <p class="screen-subtitle">
            Create a master password to encrypt your journal.
            This cannot be recovered if lost.
          </p>

          <div class="warning-box">
            ⚠️ Your password is never stored or sent anywhere.
            If you forget it, your entries cannot be recovered.
          </div>

          <div class="form-group">
            <label class="label" for="pwd1">Master password</label>
            <input id="pwd1" type="password" class="input"
              placeholder="Min 8 characters" autocomplete="new-password">
            <div class="strength-bar-wrap">
              <div class="strength-bar" id="strength-bar" style="width:0%"></div>
            </div>
            <div class="strength-label" id="strength-label"></div>
          </div>

          <div class="form-group">
            <label class="label" for="pwd2">Confirm password</label>
            <input id="pwd2" type="password" class="input"
              placeholder="Repeat password" autocomplete="new-password">
          </div>

          <div id="new-error" class="error-area"></div>
          <button id="create-btn" class="btn btn-primary">Create Vault</button>
        </div>

      </div>
    </div>
  `;

  bindTabSwitcher(container);
  bindLoginTab(container);
  await bindRestoreTab(container, wasOAuth);
  bindNewVaultTab(container);

  // Auto-focus the right input
  if (startTab === 'login') {
    container.querySelector<HTMLInputElement>('#login-pwd')?.focus();
  } else if (startTab === 'new') {
    container.querySelector<HTMLInputElement>('#pwd1')?.focus();
  }
}

// ── Tab switcher ──────────────────────────────────────────────────────────────

function bindTabSwitcher(container: HTMLElement): void {
  const tabs   = container.querySelectorAll<HTMLButtonElement>('.setup-tab');
  const panels = container.querySelectorAll<HTMLElement>('.setup-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset['tab']!;

      tabs.forEach(t   => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      container.querySelector<HTMLElement>(`#panel-${target}`)?.classList.add('active');

      // Auto-focus
      const focusMap: Record<string, string> = {
        login:   '#login-pwd',
        restore: '#restore-pwd',
        new:     '#pwd1',
      };
      container.querySelector<HTMLInputElement>(focusMap[target] ?? '')?.focus();
    });
  });
}

// ── Login tab ──────────────────────────────────────────────────────────────────

function bindLoginTab(container: HTMLElement): void {
  const input   = container.querySelector<HTMLInputElement>('#login-pwd')!;
  const btn     = container.querySelector<HTMLButtonElement>('#login-btn')!;
  const errorEl = container.querySelector<HTMLElement>('#login-error')!;

  const checkLockout = (): boolean => {
    const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
    if (remaining > 0) {
      errorEl.innerHTML = `<div class="error-box">Too many failed attempts. Try again in ${remaining}s.</div>`;
      btn.disabled = true;
      setTimeout(() => {
        if (checkLockout() === false) {
          errorEl.innerHTML = '';
          btn.disabled = false;
        }
      }, 1000);
      return true;
    }
    return false;
  };

  if (checkLockout()) { /* already locked out from previous render */ }

  const tryUnlock = async () => {
    if (checkLockout()) return;
    const password = input.value.trim();
    if (!password) return;

    btn.disabled     = true;
    btn.innerHTML    = '<span class="spinner"></span> Unlocking…';
    errorEl.innerHTML = '';

    try {
      const token = await loadVerificationToken();
      if (!token) {
        // No vault yet — switch to New Vault tab
        container.querySelector<HTMLButtonElement>('[data-tab="new"]')?.click();
        return;
      }

      const valid = await verifyPassword(token, password);
      if (valid) {
        loginAttempts = 0;
        await unlock(password);
        navigate('#home');
      } else {
        loginAttempts++;
        input.value = '';
        if (loginAttempts >= MAX_ATTEMPTS) {
          lockoutEnd = Date.now() + LOCKOUT_SEC * 1000;
          checkLockout();
        } else {
          const left = MAX_ATTEMPTS - loginAttempts;
          errorEl.innerHTML = `<div class="error-msg">Wrong password — ${left} attempt${left !== 1 ? 's' : ''} left.</div>`;
          btn.disabled   = false;
          btn.textContent = 'Unlock';
          input.focus();
        }
      }
    } catch {
      errorEl.innerHTML = '<div class="error-msg">An error occurred. Please try again.</div>';
      btn.disabled   = false;
      btn.textContent = 'Unlock';
    }
  };

  btn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
}

// ── Restore tab ───────────────────────────────────────────────────────────────

async function bindRestoreTab(
  container: HTMLElement,
  wasOAuth: boolean
): Promise<void> {
  const srcFile  = container.querySelector<HTMLButtonElement>('#src-file')!;
  const srcDrive = container.querySelector<HTMLButtonElement>('#src-drive')!;
  const secFile  = container.querySelector<HTMLElement>('#restore-file-section')!;
  const secDrive = container.querySelector<HTMLElement>('#restore-drive-section')!;

  srcFile.addEventListener('click', () => {
    srcFile.classList.add('active');   srcDrive.classList.remove('active');
    secFile.style.display = '';        secDrive.style.display  = 'none';
  });

  srcDrive.addEventListener('click', () => {
    srcDrive.classList.add('active');  srcFile.classList.remove('active');
    secDrive.style.display = '';       secFile.style.display   = 'none';
    renderDriveStatus(container);
  });

  // After OAuth redirect — auto switch to restore + drive
  if (wasOAuth) {
    container.querySelector<HTMLButtonElement>('[data-tab="restore"]')?.click();
    srcDrive.click();
    showToast('✓ Google Drive connected — enter your password to restore');
  }

  // Drop-zone
  const dropZone   = container.querySelector<HTMLElement>('#drop-zone')!;
  const fileInput  = container.querySelector<HTMLInputElement>('#file-input')!;
  const fileChosen = container.querySelector<HTMLElement>('#file-chosen')!;
  const fileName   = container.querySelector<HTMLElement>('#file-name')!;
  const fileClear  = container.querySelector<HTMLButtonElement>('#file-clear')!;
  let chosenFile: File | null = null;

  const setFile = (f: File) => {
    chosenFile = f;
    fileName.textContent     = f.name;
    fileChosen.style.display = '';
    dropZone.style.display   = 'none';
  };
  const clearFile = () => {
    chosenFile = null;
    fileInput.value          = '';
    fileChosen.style.display = 'none';
    dropZone.style.display   = '';
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { const f = fileInput.files?.[0]; if (f) setFile(f); });
  fileClear.addEventListener('click', clearFile);
  dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const f = e.dataTransfer?.files[0];
    if (f) setFile(f);
  });

  // Restore button
  const restoreBtn = container.querySelector<HTMLButtonElement>('#restore-btn')!;
  const errorEl    = container.querySelector<HTMLElement>('#restore-error')!;

  restoreBtn.addEventListener('click', async () => {
    errorEl.innerHTML = '';
    const pwd     = container.querySelector<HTMLInputElement>('#restore-pwd')!.value;
    const isDrive = srcDrive.classList.contains('active');

    if (!pwd) {
      errorEl.innerHTML = '<div class="error-msg">Enter the vault password.</div>'; return;
    }
    if (!isDrive && !chosenFile) {
      errorEl.innerHTML = '<div class="error-msg">Select a backup file.</div>'; return;
    }
    if (isDrive && !isTokenValid()) {
      errorEl.innerHTML = '<div class="error-msg">Connect Google Drive first.</div>'; return;
    }

    restoreBtn.disabled  = true;
    restoreBtn.innerHTML = '<span class="spinner"></span> Restoring…';

    try {
      const vaultJson = isDrive ? await downloadVault() : await chosenFile!.text();
      const vaultObj  = JSON.parse(vaultJson);
      if (!validateVaultFile(vaultObj)) throw new Error('Not a valid Glyph vault file.');

      const token = await encrypt(KNOWN_PLAINTEXT, pwd);
      await writeVault(vaultObj);
      await saveVerificationToken(token);
      await saveSettings({ hasVault: true });
      await unlock(pwd);
      showToast('✓ Vault restored');
      navigate('#home');
    } catch (e) {
      errorEl.innerHTML        = `<div class="error-msg">${(e as Error).message}</div>`;
      restoreBtn.disabled      = false;
      restoreBtn.textContent   = 'Restore & Unlock';
    }
  });
}

// ── New Vault tab ──────────────────────────────────────────────────────────────

function bindNewVaultTab(container: HTMLElement): void {
  const pwd1     = container.querySelector<HTMLInputElement>('#pwd1')!;
  const pwd2     = container.querySelector<HTMLInputElement>('#pwd2')!;
  const bar      = container.querySelector<HTMLElement>('#strength-bar')!;
  const barLabel = container.querySelector<HTMLElement>('#strength-label')!;
  const errorEl  = container.querySelector<HTMLElement>('#new-error')!;
  const btn      = container.querySelector<HTMLButtonElement>('#create-btn')!;

  pwd1.addEventListener('input', () => {
    const { score, label, color } = passwordStrength(pwd1.value);
    bar.style.width      = `${score * 25}%`;
    bar.style.background = color;
    barLabel.textContent = pwd1.value.length ? label : '';
  });

  btn.addEventListener('click', async () => {
    errorEl.innerHTML = '';
    const p1 = pwd1.value;
    const p2 = pwd2.value;

    if (p1.length < 8) {
      errorEl.innerHTML = '<div class="error-msg">Password must be at least 8 characters.</div>'; return;
    }
    if (p1 !== p2) {
      errorEl.innerHTML = '<div class="error-msg">Passwords do not match.</div>'; return;
    }

    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';

    try {
      const token = await encrypt(KNOWN_PLAINTEXT, p1);
      await saveVerificationToken(token);
      await saveSettings({ hasVault: true });
      await unlock(p1);
      navigate('#home');
    } catch (e) {
      errorEl.innerHTML = `<div class="error-msg">Failed: ${(e as Error).message}</div>`;
      btn.disabled      = false;
      btn.textContent   = 'Create Vault';
    }
  });
}

// ── Drive status widget ───────────────────────────────────────────────────────────

async function renderDriveStatus(container: HTMLElement): Promise<void> {
  const area    = container.querySelector<HTMLElement>('#drive-status-area')!;
  const enabled = await isDriveEnabled();
  const authed  = isTokenValid();

  if (enabled && authed) {
    area.innerHTML = `
      <div class="drive-status-connected">
        <span style="color:var(--success)">● Connected to Google Drive</span>
        <span style="color:var(--text-muted); font-size:13px">
          Encrypted vault will be downloaded from Drive.
        </span>
      </div>`;
  } else {
    area.innerHTML = `
      <div style="color:var(--text-muted); font-size:13px; margin-bottom:10px; line-height:1.6">
        Connect Google Drive to download your encrypted backup.
        Your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="setup-drive-connect">Connect Google Drive</button>`;
    area.querySelector('#setup-drive-connect')!.addEventListener('click', () => {
      startOAuthFlow();
    });
  }
}
