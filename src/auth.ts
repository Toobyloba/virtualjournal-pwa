// ── auth.ts ───────────────────────────────────────────────────────────────────
// In-memory session state. Never persisted.

import { loadSettings } from './storage';

interface AuthState {
  password:   string | null;
  lockTimer:  ReturnType<typeof setTimeout> | null;
  autoLockSec: number;
}

const state: AuthState = {
  password:    null,
  lockTimer:   null,
  autoLockSec: 60,
};

type LockCallback = () => void;
let onLockCb: LockCallback | null = null;

export function onLock(cb: LockCallback): void {
  onLockCb = cb;
}

export function getPassword(): string | null {
  return state.password;
}

export function isLocked(): boolean {
  return state.password === null;
}

export async function unlock(password: string): Promise<void> {
  const settings = await loadSettings();
  state.password    = password;
  state.autoLockSec = settings.autoLockSeconds;
  resetAutoLockTimer();
}

export function lock(): void {
  state.password = null;
  if (state.lockTimer) clearTimeout(state.lockTimer);
  state.lockTimer = null;
  if (onLockCb) onLockCb();
}

export function resetAutoLockTimer(): void {
  if (state.lockTimer) clearTimeout(state.lockTimer);
  if (state.autoLockSec === 0) return;
  state.lockTimer = setTimeout(lock, state.autoLockSec * 1000);
}

export async function refreshAutoLockSec(): Promise<void> {
  const settings = await loadSettings();
  state.autoLockSec = settings.autoLockSeconds;
}

// Lock on tab hide
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && !isLocked()) {
    lock();
  }
});

// Reset timer on any user interaction
document.addEventListener('pointerdown', () => {
  if (!isLocked()) resetAutoLockTimer();
});
