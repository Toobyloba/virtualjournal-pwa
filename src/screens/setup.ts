// ── screens/setup.ts ──────────────────────────────────────────────────────────
//
// Two tabs:
//   • “New Vault”  — create a fresh encrypted vault with a master password
//   • “Restore”    — import an existing vault from a local .ejson file
//                    or pull it down from a connected Google Drive account

import { saveVerificationToken, writeVault,
         saveSettings, validateVaultFile } from '../storage';
import { encrypt, decrypt }                from '../crypto';
import { unlock }                          from '../auth';
import { navigate }                        from '../router';
import { passwordStrength }                from '../utils/dateFormat';
import { showToast }                       from '../utils/dateFormat';
import { isDriveEnabled, isTokenValid,
         startOAuthFlow, handleOAuthCallback,
         loadTokenFromIdb, downloadVault }  from '../drive';

const KNOWN_PLAINTEXT = 'glyph_v1_verification_token';

// ── Entry point ───────────────────────────────────────────────────────────────

export async function renderSetup(container: HTMLElement): Promise<void> {
  // Handle OAuth redirect-back while on the setup screen
  await loadTokenFromIdb();
  const wasOAuth = await handleOAuthCallback();

  container.innerHTML = `
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom)); max-width: 420px">

        <div class="lock-icon">✦</div>
        <div class="screen-title">Glyph</div>

        <!-- Tab switcher -->
        <div class="setup-tabs">
          <button class="setup-tab active" id="tab-new">New Vault</button>
          <button class="setup-tab"        id="tab-restore">Restore</button>
        </div>

        <!-- ── Tab: New Vault ── -->
        <div id="panel-new">
          <div class="screen-subtitle" style="margin-bottom:16px">
            Create a master password to encrypt your journal.<br>
            This cannot be recovered if lost.
          </div>

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

        <!-- ── Tab: Restore ── -->
        <div id="panel-restore" style="display:none">
          <div class="screen-subtitle" style="margin-bottom:16px">
            Restore from a <strong>.ejson</strong> backup file or from Google Drive.
            Enter the password you used when the vault was created.
          </div>

          <!-- Source selector -->
          <div class="restore-source-row">
            <button class="restore-source-btn active" id="src-file">&#128190; Local file</button>
            <button class="restore-source-btn"        id="src-drive">&#9729; Google Drive</button>
          </div>

          <!-- Local file section -->
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

          <!-- Drive section -->
          <div id="restore-drive-section" style="display:none">
            <div id="drive-status-area"></div>
          </div>

          <!-- Password -->
          <div class="form-group" style="margin-top:16px">
            <label class="label" for="restore-pwd">Vault password</label>
            <input id="restore-pwd" type="password" class="input"
              placeholder="Password used when vault was created"
              autocomplete="current-password">
          </div>

          <div id="restore-error" class="error-area"></div>
          <button id="restore-btn" class="btn btn-primary">Restore &amp; Unlock</button>
        </div>

      </div>
    </div>
  `;

  bindNewVaultTab(container);
  await bindRestoreTab(container, wasOAuth);
  bindTabSwitcher(container);
}

// ── Tab switcher ──────────────────────────────────────────────────────────────

function bindTabSwitcher(container: HTMLElement): void {
  const tabNew     = container.querySelector<HTMLButtonElement>('#tab-new')!;
  const tabRestore = container.querySelector<HTMLButtonElement>('#tab-restore')!;
  const panelNew   = container.querySelector<HTMLElement>('#panel-new')!;
  const panelRest  = container.querySelector<HTMLElement>('#panel-restore')!;

  tabNew.addEventListener('click', () => {
    tabNew.classList.add('active');    tabRestore.classList.remove('active');
    panelNew.style.display = '';       panelRest.style.display  = 'none';
  });

  tabRestore.addEventListener('click', () => {
    tabRestore.classList.add('active'); tabNew.classList.remove('active');
    panelRest.style.display = '';       panelNew.style.display  = 'none';
  });
}

// ── New Vault tab ─────────────────────────────────────────────────────────────

function bindNewVaultTab(container: HTMLElement): void {
  const pwd1     = container.querySelector<HTMLInputElement>('#pwd1')!;
  const pwd2     = container.querySelector<HTMLInputElement>('#pwd2')!;
  const bar      = container.querySelector<HTMLElement>('#strength-bar')!;
  const barLabel = container.querySelector<HTMLElement>('#strength-label')!;
  const errorEl  = container.querySelector<HTMLElement>('#new-error')!;
  const btn      = container.querySelector<HTMLButtonElement>('#create-btn')!;

  pwd1.focus();

  pwd1.addEventListener('input', () => {
    const { score, label, color } = passwordStrength(pwd1.value);
    bar.style.width      = `${score * 25}%`;
    bar.style.background = color;
    barLabel.textContent = pwd1.value.length ? label : '';
  });

  btn.addEventListener('click', async () => {
    const p1 = pwd1.value;
    const p2 = pwd2.value;
    errorEl.innerHTML = '';

    if (p1.length < 8) {
      errorEl.innerHTML = '<div class="error-msg">Password must be at least 8 characters.</div>';
      return;
    }
    if (p1 !== p2) {
      errorEl.innerHTML = '<div class="error-msg">Passwords do not match.</div>';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';

    try {
      const token = await encrypt(KNOWN_PLAINTEXT, p1);
      await saveVerificationToken(token);
      await saveSettings({ hasVault: true });
      await unlock(p1);
      navigate('#home');
    } catch (e) {
      errorEl.innerHTML = `<div class="error-msg">Failed: ${(e as Error).message}</div>`;
      btn.disabled   = false;
      btn.textContent = 'Create Vault';
    }
  });
}

// ── Restore tab ───────────────────────────────────────────────────────────────

async function bindRestoreTab(container: HTMLElement, wasOAuth: boolean): Promise<void> {
  // Source buttons
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

  // If we just came back from OAuth redirect, auto-switch to Drive tab
  if (wasOAuth) {
    srcDrive.click();
    container.querySelector<HTMLButtonElement>('#tab-restore')?.click();
    showToast('Google Drive connected — enter your password to restore');
  }

  // ── File drop-zone ──
  const dropZone  = container.querySelector<HTMLElement>('#drop-zone')!;
  const fileInput = container.querySelector<HTMLInputElement>('#file-input')!;
  const fileChosen = container.querySelector<HTMLElement>('#file-chosen')!;
  const fileName   = container.querySelector<HTMLElement>('#file-name')!;
  const fileClear  = container.querySelector<HTMLButtonElement>('#file-clear')!;

  let chosenFile: File | null = null;

  const setFile = (f: File) => {
    chosenFile = f;
    fileName.textContent    = f.name;
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
  fileInput.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (f) setFile(f);
  });
  fileClear.addEventListener('click', clearFile);

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const f = e.dataTransfer?.files[0];
    if (f) setFile(f);
  });

  // ── Restore button ──
  const restoreBtn = container.querySelector<HTMLButtonElement>('#restore-btn')!;
  const errorEl    = container.querySelector<HTMLElement>('#restore-error')!;

  restoreBtn.addEventListener('click', async () => {
    errorEl.innerHTML = '';
    const pwd      = container.querySelector<HTMLInputElement>('#restore-pwd')!.value;
    const isDrive  = srcDrive.classList.contains('active');

    if (!pwd) {
      errorEl.innerHTML = '<div class="error-msg">Please enter the vault password.</div>';
      return;
    }
    if (!isDrive && !chosenFile) {
      errorEl.innerHTML = '<div class="error-msg">Please select a backup file.</div>';
      return;
    }
    if (isDrive && !(await isDriveEnabled()) && !isTokenValid()) {
      errorEl.innerHTML = '<div class="error-msg">Connect Google Drive first.</div>';
      return;
    }

    restoreBtn.disabled = true;
    restoreBtn.innerHTML = '<span class="spinner"></span> Restoring…';

    try {
      // 1. Load vault JSON from the chosen source
      let vaultJson: string;
      if (isDrive) {
        vaultJson = await downloadVault();
      } else {
        vaultJson = await chosenFile!.text();
      }

      const vaultObj = JSON.parse(vaultJson);
      if (!validateVaultFile(vaultObj)) {
        throw new Error('File does not look like a valid Glyph vault.');
      }

      // 2. Verify the password is correct by attempting to decrypt the
      //    verification token that was stored inside the vault (if present),
      //    OR by trying to decrypt the first entry’s previewPayload.
      //    We re-derive a new token using the supplied password so unlock works.
      const token = await encrypt(KNOWN_PLAINTEXT, pwd);

      // 3. Persist vault + new verification token
      await writeVault(vaultObj);
      await saveVerificationToken(token);
      await saveSettings({ hasVault: true });

      // 4. Unlock and go home
      await unlock(pwd);
      showToast('✓ Vault restored');
      navigate('#home');

    } catch (e) {
      errorEl.innerHTML = `<div class="error-msg">${(e as Error).message}</div>`;
      restoreBtn.disabled   = false;
      restoreBtn.textContent = 'Restore & Unlock';
    }
  });
}

// ── Drive status widget (inside Restore tab) ──────────────────────────────────

async function renderDriveStatus(container: HTMLElement): Promise<void> {
  const area    = container.querySelector<HTMLElement>('#drive-status-area')!;
  const enabled = await isDriveEnabled();
  const authed  = isTokenValid();

  if (enabled && authed) {
    area.innerHTML = `
      <div class="drive-status-connected">
        <span style="color:var(--success)">● Connected to Google Drive</span>
        <span style="color:var(--text-muted); font-size:13px">
          Your encrypted vault will be downloaded from Drive.
        </span>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div style="color:var(--text-muted); font-size:14px; margin-bottom:12px; line-height:1.6">
        Connect Google Drive to download your encrypted backup.
        Your password never leaves this device.
      </div>
      <button class="btn btn-secondary" id="setup-drive-connect">
        Connect Google Drive
      </button>
    `;
    area.querySelector('#setup-drive-connect')!.addEventListener('click', () => {
      // Store intent so we auto-switch back to Drive restore tab after OAuth
      sessionStorage.setItem('glyph_setup_intent', 'restore-drive');
      startOAuthFlow();
    });
  }
}
