// ── screens/setup.ts ──────────────────────────────────────────────────────────

import { encrypt }                           from '../crypto';
import { initVault, saveSettings, saveVerificationToken } from '../storage';
import { unlock }                            from '../auth';
import { navigate }                          from '../router';
import { checkStrength }                     from '../utils/dateFormat';

const KNOWN_PLAINTEXT = 'vaultjournal_v1_verification_token';

export function renderSetup(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom)); overflow-y: auto; justify-content: flex-start; padding-top: calc(48px + env(safe-area-inset-top))">
        <div class="lock-icon">📓</div>
        <div class="screen-title">Create Vault</div>
        <div class="screen-subtitle">Set a strong password. It encrypts everything.</div>

        <div class="warning-box">
          ⚠️ This password cannot be recovered. If you forget it, your entries are permanently lost. Write it down somewhere safe.
        </div>

        <div class="form-group">
          <label class="label" for="pwd1">Password</label>
          <input id="pwd1" type="password" class="input" placeholder="Choose a password" autocomplete="new-password">
          <div class="strength-bar-wrap"><div class="strength-bar" id="str-bar" style="width:0%"></div></div>
          <div class="strength-label" id="str-label"></div>
        </div>

        <div class="form-group">
          <label class="label" for="pwd2">Confirm password</label>
          <input id="pwd2" type="password" class="input" placeholder="Confirm password" autocomplete="new-password">
        </div>

        <div id="error-area"></div>

        <button id="create-btn" class="btn btn-primary">Create Vault</button>
      </div>
    </div>
  `;

  const pwd1     = container.querySelector<HTMLInputElement>('#pwd1')!;
  const pwd2     = container.querySelector<HTMLInputElement>('#pwd2')!;
  const strBar   = container.querySelector<HTMLElement>('#str-bar')!;
  const strLabel = container.querySelector<HTMLElement>('#str-label')!;
  const errArea  = container.querySelector<HTMLElement>('#error-area')!;
  const createBtn= container.querySelector<HTMLButtonElement>('#create-btn')!;

  pwd1.addEventListener('input', () => {
    const { score, label, color } = checkStrength(pwd1.value);
    strBar.style.width      = `${(score / 4) * 100}%`;
    strBar.style.background = color;
    strLabel.style.color    = color;
    strLabel.textContent    = pwd1.value ? label : '';
  });

  const submit = async () => {
    const p1 = pwd1.value;
    const p2 = pwd2.value;
    errArea.innerHTML = '';

    if (p1.length < 8) {
      errArea.innerHTML = '<div class="error-msg">Password must be at least 8 characters.</div>';
      return;
    }
    if (p1 !== p2) {
      errArea.innerHTML = '<div class="error-msg">Passwords do not match.</div>';
      return;
    }

    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="spinner"></span> Creating vault…';

    try {
      await initVault();
      const token = await encrypt(KNOWN_PLAINTEXT, p1);
      await saveVerificationToken(token);
      await saveSettings({ autoLockSeconds: 60, hasVault: true });
      await unlock(p1);
      navigate('#home');
    } catch (e) {
      errArea.innerHTML = `<div class="error-msg">Failed to create vault: ${(e as Error).message}</div>`;
      createBtn.disabled = false;
      createBtn.textContent = 'Create Vault';
    }
  };

  createBtn.addEventListener('click', submit);
  pwd2.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  pwd1.focus();
}
