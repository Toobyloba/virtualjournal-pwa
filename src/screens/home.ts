// ── screens/home.ts ───────────────────────────────────────────────────────────

import { readVault, deleteEntry } from '../storage';
import { decrypt }                from '../crypto';
import { getPassword, lock }      from '../auth';
import { navigate }               from '../router';
import { formatDate, formatDateFull } from '../utils/dateFormat';
import { showToast }              from '../utils/dateFormat';

const isDesktop = () => window.innerWidth >= 768;

export async function renderHome(container: HTMLElement): Promise<void> {
  if (isDesktop()) {
    await renderDesktopHome(container);
  } else {
    await renderMobileHome(container);
  }
}

async function renderMobileHome(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="icon-btn" id="settings-btn" title="Settings">⚙️</button>
        <button class="icon-btn" id="lock-btn" title="Lock">🔒</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${skeletons(3)}
      </div>
      <button class="fab" id="new-btn" title="New entry">＋</button>
    </div>
  `;
  container.querySelector('#settings-btn')!.addEventListener('click', () => navigate('#settings'));
  container.querySelector('#lock-btn')!.addEventListener('click', () => { lock(); });
  container.querySelector('#new-btn')!.addEventListener('click',  () => navigate('#editor'));
  await loadEntries(container, null);
}

async function renderDesktopHome(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div id="sidebar">
      <div class="topbar">
        <span class="topbar-title">Glyph</span>
        <span class="topbar-meta" id="entry-count"></span>
        <button class="fab icon-btn" id="new-btn" title="New entry">＋</button>
        <button class="icon-btn" id="settings-btn" title="Settings">⚙️</button>
        <button class="icon-btn" id="lock-btn"     title="Lock">🔒</button>
      </div>
      <div class="scroll-area" id="entry-list">
        ${skeletons(4)}
      </div>
    </div>
    <div id="main-panel">
      <div class="welcome-pane">
        <div class="welcome-icon">✦</div>
        <div class="welcome-title">Select an entry</div>
        <div class="welcome-desc">Choose an entry from the list, or create a new one.</div>
        <button class="btn btn-primary" id="welcome-new-btn" style="max-width:220px; margin-top:8px">＋ New Entry</button>
      </div>
    </div>
  `;

  container.querySelector('#settings-btn')!.addEventListener('click', () => navigate('#settings'));
  container.querySelector('#lock-btn')!.addEventListener('click',     () => { lock(); });
  container.querySelector('#new-btn')!.addEventListener('click',      () => navigate('#editor'));
  container.querySelector('#welcome-new-btn')!.addEventListener('click', () => navigate('#editor'));

  await loadEntries(container, null);
}

async function loadEntries(container: HTMLElement, activeId: string | null): Promise<void> {
  const list     = container.querySelector<HTMLElement>('#entry-list')!;
  const countEl  = container.querySelector<HTMLElement>('#entry-count')!;
  const password = getPassword();
  if (!password) { navigate('#lock'); return; }

  try {
    const vault   = await readVault();
    const entries = vault?.entries ?? [];
    countEl.textContent = `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`;

    if (entries.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✦</div>
          <div class="empty-title">No entries yet</div>
          <div class="empty-desc">Tap + to write your first entry.</div>
        </div>`;
      return;
    }

    const previews = await Promise.all(
      entries.map(async e => {
        try {
          const text = await decrypt(e.previewPayload, password);
          return { id: e.id, createdAt: e.createdAt, updatedAt: e.updatedAt, text };
        } catch {
          return { id: e.id, createdAt: e.createdAt, updatedAt: e.updatedAt, text: '[Decryption failed]' };
        }
      })
    );

    list.innerHTML = previews.map(p => `
      <div class="card${p.id === activeId ? ' active' : ''}" data-id="${p.id}">
        <div class="card-date">
          <span class="card-date-relative">${formatDate(p.createdAt)}</span>
          <span class="card-date-full">${formatDateFull(p.createdAt)}</span>
        </div>
        <div class="card-preview">${escHtml(p.text)}</div>
      </div>
    `).join('');

    list.querySelectorAll<HTMLElement>('.card').forEach(card => {
      const id = card.dataset['id']!;
      card.addEventListener('click', () => navigate(`#entry?id=${id}`));

      let pressTimer: ReturnType<typeof setTimeout>;
      card.addEventListener('pointerdown', () => {
        pressTimer = setTimeout(async () => {
          if (!confirm('Delete this entry? This cannot be undone.')) return;
          await deleteEntry(id);
          showToast('Entry deleted');
          await loadEntries(container, null);
        }, 600);
      });
      card.addEventListener('pointerup',    () => clearTimeout(pressTimer));
      card.addEventListener('pointerleave', () => clearTimeout(pressTimer));
    });

  } catch (e) {
    list.innerHTML = `<div class="error-box">Failed to load entries: ${(e as Error).message}</div>`;
  }
}

function skeletons(n: number): string {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line mid"></div>
    </div>
  `).join('');
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
