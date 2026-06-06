// ── screens/entryview.ts ──────────────────────────────────────────────────────

import { readVault, deleteEntry } from '../storage';
import { decrypt }                from '../crypto';
import { getPassword }            from '../auth';
import { navigate }               from '../router';
import { formatDateLong }         from '../utils/dateFormat';
import { showToast }              from '../utils/dateFormat';

export async function renderEntryView(container: HTMLElement, entryId: string): Promise<void> {
  container.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">← Back</button>
        <span style="flex:1"></span>
        <button class="icon-btn" id="edit-btn" title="Edit">✏️</button>
        <button class="icon-btn danger" id="delete-btn" title="Delete">🗑️</button>
      </div>
      <div style="padding: 8px 20px; border-bottom: 1px solid var(--border); flex-shrink:0">
        <div id="entry-date" style="font-size:13px; color: var(--text-faint); display:flex; gap:12px; flex-wrap:wrap"></div>
      </div>
      <div class="entry-body" id="entry-body">
        <div class="skeleton skeleton-line long" style="margin: 20px"></div>
        <div class="skeleton skeleton-line mid"  style="margin: 0 20px 12px"></div>
        <div class="skeleton skeleton-line long" style="margin: 0 20px 12px"></div>
      </div>
    </div>
  `;

  const password = getPassword();
  if (!password) { navigate('#lock'); return; }

  container.querySelector('#back-btn')!.addEventListener('click', () => navigate('#home'));
  container.querySelector('#edit-btn')!.addEventListener('click', () => navigate(`#editor?id=${entryId}`));
  container.querySelector('#delete-btn')!.addEventListener('click', async () => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    await deleteEntry(entryId);
    showToast('Entry deleted');
    navigate('#home');
  });

  try {
    const vault = await readVault();
    const entry = vault?.entries.find(e => e.id === entryId);
    if (!entry) { navigate('#home'); return; }

    const text   = await decrypt(entry.payload, password);
    const dateEl = container.querySelector<HTMLElement>('#entry-date')!;
    const bodyEl = container.querySelector<HTMLElement>('#entry-body')!;

    const sameDay = entry.createdAt.slice(0, 10) === entry.updatedAt.slice(0, 10);

    dateEl.innerHTML = sameDay
      ? `<span>Created ${formatDateLong(entry.createdAt)}</span>`
      : `<span>Created ${formatDateLong(entry.createdAt)}</span><span>Edited ${formatDateLong(entry.updatedAt)}</span>`;

    bodyEl.textContent = text;
  } catch (e) {
    const bodyEl = container.querySelector<HTMLElement>('#entry-body')!;
    bodyEl.innerHTML = `<div class="error-box" style="margin:20px">Failed to decrypt entry: ${(e as Error).message}</div>`;
  }
}
