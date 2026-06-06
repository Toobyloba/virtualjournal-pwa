// ── screens/lock.ts ───────────────────────────────────────────────────────────

import { unlock }                from '../auth';
import { loadVerificationToken } from '../storage';
import { verifyPassword }        from '../crypto';
import { navigate }              from '../router';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SEC  = 30;

let attempts   = 0;
let lockoutEnd = 0;

export async function renderLock(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="screen">
      <div class="center-screen" style="padding-bottom: calc(32px + env(safe-area-inset-bottom))">
        <div class="lock-icon">✦</div>
        <div class="screen-title">Glyph</div>
        <div class="screen-subtitle">Enter your password to unlock</div>

        <div class="form-group">
          <input id="pwd-input" type="password" class="input" placeholder="Password" autocomplete="current-password">
        </div>

        <div id="error-area"></div>

        <button id="unlock-btn" class="btn btn-primary">Unlock</button>
      </div>
    </div>
  `;

  const input     = container.querySelector<HTMLInputElement>('#pwd-input')!;
  const btn       = container.querySelector<HTMLButtonElement>('#unlock-btn')!;
  const errorArea = container.querySelector<HTMLElement>('#error-area')!;

  input.focus();

  const checkLockout = (): boolean => {
    const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
    if (remaining > 0) {
      errorArea.innerHTML = `<div class="error-box">Too many failed attempts. Wait ${remaining}s.</div>`;
      btn.disabled = true;
      setTimeout(checkLockout, 1000);
      return true;
    }
    btn.disabled = false;
    return false;
  };

  if (checkLockout()) return;

  const tryUnlock = async () => {
    if (checkLockout()) return;
    const password = input.value.trim();
    if (!password) return;

    btn.disabled = true;
    btn.textContent = 'Unlocking…';

    try {
      const token = await loadVerificationToken();
      if (!token) { navigate('#setup'); return; }

      const valid = await verifyPassword(token, password);
      if (valid) {
        attempts = 0;
        await unlock(password);
        navigate('#home');
      } else {
        attempts++;
        input.value = '';
        if (attempts >= MAX_ATTEMPTS) {
          lockoutEnd = Date.now() + LOCKOUT_SEC * 1000;
          checkLockout();
        } else {
          const left = MAX_ATTEMPTS - attempts;
          errorArea.innerHTML = `<div class="error-msg">Wrong password. ${left} attempt${left !== 1 ? 's' : ''} left.</div>`;
          btn.disabled = false;
          btn.textContent = 'Unlock';
          input.focus();
        }
      }
    } catch {
      errorArea.innerHTML = `<div class="error-msg">An error occurred. Please try again.</div>`;
      btn.disabled = false;
      btn.textContent = 'Unlock';
    }
  };

  btn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
}
