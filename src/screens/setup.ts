// ── screens/setup.ts ──────────────────────────────────────────────────────────

import { saveVerificationToken } from '../storage';
import { encrypt }               from '../crypto';
import { unlock }                from '../auth';
import { navigate }              from '../router';
import { passwordStrength }      from '../utils/dateFormat';

const KNOWN_PLAINTEXT = 'glyph_v1_verification_token';

export function renderSetup(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom))">
        <div class="lock-icon">✦</div>
        <div class="screen-title">Glyph</div>
        <div class="screen-subtitle">Create a master password to encrypt your journal.<br>This cannot be recovered if lost.</div>

        <div class="warning-box">
          ⚠️ Your password is never stored or sent anywhere. If you forget it, your entries cannot be recovered.
        </div>

        <div class="form-group">
          <label class="label" for="pwd1">Master password</label>
          <input id="pwd1" type="password" class="input" placeholder="Min 8 characters" autocomplete="new-password">
          <div class="strength-bar-wrap"><div class="strength-bar" id="strength-bar" style="width:0%"></div></div>
          <div class="strength-label" id="strength-label"></div>
        </div>

        <div class="form-group">
          <label class="label" for="pwd2">Confirm password</label>
          <input id="pwd2" type="password" class="input" placeholder="Repeat password" autocomplete="new-password">
        </div>

        <div id="error-area"></div>

        <button id="create-btn" class="btn btn-primary">Create Vault</button>
      </div>
    </div>
  `;

  const pwd1     = container.querySelector<HTMLInputElement>('#pwd1')!;
  const pwd2     = container.querySelector<HTMLInputElement>('#pwd2')!;
  const bar      = container.querySelector<HTMLElement>('#strength-bar')!;
  const barLabel = container.querySelector<HTMLElement>('#strength-label')!;
  const errorEl  = container.querySelector<HTMLElement>('#error-area')!;
  const btn      = container.querySelector<HTMLButtonElement>('#create-btn')!;

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
      await unlock(p1);
      navigate('#home');
    } catch (e) {
      errorEl.innerHTML = `<div class="error-msg">Failed: ${(e as Error).message}</div>`;
      btn.disabled = false;
      btn.textContent = 'Create Vault';
    }
  });

  pwd1.focus();
}
