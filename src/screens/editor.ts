// ── screens/editor.ts ─────────────────────────────────────────────────────────

import { readVault, addEntry, updateEntry } from '../storage';
import { encrypt, decrypt }                 from '../crypto';
import { getPassword, resetAutoLockTimer }  from '../auth';
import { navigate }                         from '../router';

export async function renderEditor(container: HTMLElement, entryId?: string): Promise<void> {
  container.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button class="icon-btn" id="back-btn">← Back</button>
        <span style="flex:1"></span>
        <span class="save-status unsaved" id="save-status"></span>
      </div>
      <textarea class="editor-textarea" id="editor" placeholder="Start writing…" spellcheck="true"></textarea>
    </div>
  `;

  const textarea   = container.querySelector<HTMLTextAreaElement>('#editor')!;
  const statusEl   = container.querySelector<HTMLElement>('#save-status')!;
  const backBtn    = container.querySelector<HTMLButtonElement>('#back-btn')!;
  const password   = getPassword();
  if (!password) { navigate('#lock'); return; }

  let dirty       = false;
  let saveTimer:  ReturnType<typeof setTimeout> | null = null;
  let currentId   = entryId ?? null;

  // Load existing entry
  if (entryId) {
    statusEl.textContent = 'Loading…';
    try {
      const vault = await readVault();
      const entry = vault?.entries.find(e => e.id === entryId);
      if (entry) {
        textarea.value = await decrypt(entry.payload, password);
      }
    } catch {
      statusEl.textContent = 'Load error';
    }
    statusEl.textContent = '';
  }

  textarea.focus();

  const setStatus = (s: 'saving' | 'saved' | 'unsaved' | '') => {
    statusEl.className = `save-status ${s}`;
    statusEl.textContent = s === 'saving' ? '⏳ Saving…' : s === 'saved' ? '✓ Saved' : s === 'unsaved' ? '● Unsaved' : '';
  };

  const save = async () => {
    const body = textarea.value;
    if (!body.trim()) return;
    const pwd = getPassword();
    if (!pwd) return;

    setStatus('saving');
    try {
      const [payload, previewPayload] = await Promise.all([
        encrypt(body, pwd),
        encrypt(body.slice(0, 120), pwd),
      ]);

      const now = new Date().toISOString();
      if (!currentId) {
        currentId = crypto.randomUUID();
        await addEntry({ id: currentId, createdAt: now, updatedAt: now, payload, previewPayload });
      } else {
        const vault = await readVault();
        const existing = vault?.entries.find(e => e.id === currentId);
        await updateEntry({
          id: currentId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          payload,
          previewPayload,
        });
      }
      setStatus('saved');
    } catch {
      setStatus('unsaved');
    }
  };

  textarea.addEventListener('input', () => {
    dirty = true;
    setStatus('unsaved');
    resetAutoLockTimer();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await save();
      dirty = false;
    }, 1500);
  });

  const goBack = async () => {
    if (saveTimer) clearTimeout(saveTimer);
    if (dirty) await save();
    navigate('#home');
  };

  backBtn.addEventListener('click', goBack);

  // Handle Android back gesture via popstate
  window.addEventListener('popstate', goBack, { once: true });
}
