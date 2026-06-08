// ── storage.ts ────────────────────────────────────────────────────────────────────────────────
// Vault OPFS file + IndexedDB settings/verification via idb-keyval.

import { get, set } from 'idb-keyval';
import { isDriveEnabled, uploadVault, isTokenValid } from './server';
import type { EncryptedPayload } from './crypto';

export interface JournalEntry {
  id:             string;
  createdAt:      string;
  updatedAt:      string;
  payload:        EncryptedPayload;
  previewPayload: EncryptedPayload;
}

export interface VaultFile {
  version:   number;
  createdAt: string;
  entries:   JournalEntry[];
}

export interface VaultSettings {
  autoLockSeconds: number;
  hasVault:        boolean;
}

const IDB_VERIFY   = 'vaultjournal_verify';
const IDB_SETTINGS = 'vaultjournal_settings';

// ── OPFS helpers ────────────────────────────────────────────────────────────────────────────────

async function getFileHandle(): Promise<FileSystemFileHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getFileHandle('vault.ejson', { create: true });
}

export async function readVault(): Promise<VaultFile | null> {
  try {
    const handle = await getFileHandle();
    const file   = await handle.getFile();
    const text   = await file.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as VaultFile;
  } catch {
    return null;
  }
}

export async function writeVault(vault: VaultFile): Promise<void> {
  const json     = JSON.stringify(vault);
  const handle   = await getFileHandle();
  const writable = await (handle as any).createWritable();
  await writable.write(json);
  await writable.close();

  // Background Drive sync — fire and forget, never blocks local save
  isDriveEnabled().then(enabled => {
    if (enabled && isTokenValid()) {
      uploadVault(json).catch(err => {
        console.warn('Server sync failed:', err.message);
      });
    }
  });
}

export async function vaultExists(): Promise<boolean> {
  const vault = await readVault();
  return vault !== null && Array.isArray(vault.entries);
}

export async function initVault(): Promise<void> {
  const vault: VaultFile = {
    version:   1,
    createdAt: new Date().toISOString(),
    entries:   [],
  };
  await writeVault(vault);
}

// ── Entry CRUD ────────────────────────────────────────────────────────────────────────────────

export async function addEntry(entry: JournalEntry): Promise<void> {
  let vault = await readVault();
  // Auto-init vault if it doesn't exist yet (e.g. first entry after setup)
  if (!vault) {
    await initVault();
    vault = await readVault();
  }
  if (!vault) throw new Error('Failed to initialise vault');
  vault.entries.unshift(entry);
  await writeVault(vault);
}

export async function updateEntry(updated: JournalEntry): Promise<void> {
  const vault = await readVault();
  if (!vault) throw new Error('No vault');
  const idx = vault.entries.findIndex(e => e.id === updated.id);
  if (idx !== -1) vault.entries[idx] = updated;
  await writeVault(vault);
}

export async function deleteEntry(id: string): Promise<void> {
  const vault = await readVault();
  if (!vault) throw new Error('No vault');
  vault.entries = vault.entries.filter(e => e.id !== id);
  await writeVault(vault);
}

export async function replaceAllEntries(entries: JournalEntry[]): Promise<void> {
  const vault = await readVault();
  if (!vault) throw new Error('No vault');
  vault.entries = entries;
  await writeVault(vault);
}

// ── IndexedDB: settings ───────────────────────────────────────────────────────────────────────

export async function loadSettings(): Promise<VaultSettings> {
  const s = await get<VaultSettings>(IDB_SETTINGS);
  return s ?? { autoLockSeconds: 60, hasVault: false };
}

export async function saveSettings(partial: Partial<VaultSettings>): Promise<void> {
  const current = await loadSettings();
  await set(IDB_SETTINGS, { ...current, ...partial });
}

// ── IndexedDB: verification token ─────────────────────────────────────────────────────

export async function saveVerificationToken(payload: EncryptedPayload): Promise<void> {
  await set(IDB_VERIFY, payload);
}

export async function loadVerificationToken(): Promise<EncryptedPayload | null> {
  return (await get<EncryptedPayload>(IDB_VERIFY)) ?? null;
}

// ── Import validation ─────────────────────────────────────────────────────────────────────────────

export function validateVaultFile(obj: unknown): obj is VaultFile {
  if (typeof obj !== 'object' || obj === null) return false;
  const v = obj as Record<string, unknown>;
  if (typeof v['version'] !== 'number' || !Array.isArray(v['entries'])) return false;
  // Validate each entry has the minimum required fields
  return (v['entries'] as unknown[]).every(e => {
    if (typeof e !== 'object' || e === null) return false;
    const entry = e as Record<string, unknown>;
    return typeof entry['id'] === 'string'
      && typeof entry['createdAt'] === 'string'
      && typeof entry['updatedAt'] === 'string'
      && typeof entry['payload'] === 'object' && entry['payload'] !== null
      && typeof entry['previewPayload'] === 'object' && entry['previewPayload'] !== null;
  });
}
