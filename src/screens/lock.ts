// ── screens/lock.ts ───────────────────────────────────────────────────────────
// The separate lock screen has been merged into setup.ts (3-tab layout).
// This shim keeps the #lock route working by delegating to renderSetup
// with the 'login' tab pre-selected.

import { renderSetup } from './setup';

export async function renderLock(container: HTMLElement): Promise<void> {
  await renderSetup(container, 'login');
}
