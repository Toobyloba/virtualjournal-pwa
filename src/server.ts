// ── server.ts ──────────────────────────────────────────────────────────────────
// Server storage integration for Glyph.
// Simple REST API with Bearer token auth — PUT/GET /api/vault
//
// The server is a dumb pipe: vault is encrypted client-side before upload.
// The server only ever sees AES-256-GCM ciphertext.

import { get, set, del } from 'idb-keyval';
import { showToast }      from './utils/dateFormat';
import { encrypt, decrypt } from './crypto';
import type { EncryptedPayload } from './crypto';

const IDB_SERVER_URL     = 'srv_url';
const IDB_ENCRYPTED_KEY  = 'srv_encrypted_key';
const IDB_ENABLED        = 'srv_enabled';

interface ServerConfig {
  url: string;
  apiKey: string;              // decrypted in-memory only
  encryptedKey: EncryptedPayload | null; // stored in IDB
}

const config: ServerConfig = { url: '', apiKey: '', encryptedKey: null };

// ── Public API (mirrors drive.ts surface) ─────────────────────────────────────

export async function loadTokenFromIdb(): Promise<void> {
  const url          = await get<string>(IDB_SERVER_URL);
  const encryptedKey = await get<EncryptedPayload>(IDB_ENCRYPTED_KEY);
  if (url) {
    config.url          = url;
    config.encryptedKey = encryptedKey ?? null;
  }
}

export async function decryptServerKey(password: string): Promise<void> {
  if (!config.encryptedKey) return;
  try {
    config.apiKey = await decrypt(config.encryptedKey, password);
  } catch {
    // wrong password or corrupted data — key stays empty
    config.apiKey = '';
  }
}

export function lockServerKey(): void {
  config.apiKey = '';
}

export async function reEncryptServerKey(oldPwd: string, newPwd: string): Promise<void> {
  if (!config.encryptedKey) return;
  try {
    const plainKey = await decrypt(config.encryptedKey, oldPwd);
    config.encryptedKey = await encrypt(plainKey, newPwd);
    await set(IDB_ENCRYPTED_KEY, config.encryptedKey);
    config.apiKey = plainKey;
  } catch {
    // If decryption fails, clear the stored key
    config.encryptedKey = null;
    config.apiKey = '';
    await del(IDB_ENCRYPTED_KEY);
  }
}

export function isTokenValid(): boolean {
  return config.url !== '' && config.apiKey !== '';
}

export function getToken(): string | null {
  return isTokenValid() ? config.apiKey : null;
}

export async function isDriveEnabled(): Promise<boolean> {
  return (await get<boolean>(IDB_ENABLED)) === true;
}

export function silentRefresh(): Promise<boolean> {
  // API keys don't expire — always "valid"
  return Promise.resolve(true);
}

export async function handleOAuthCallback(): Promise<boolean> {
  // No OAuth redirect for server storage — always no-op
  return false;
}

// ── Connect flow ──────────────────────────────────────────────────────────────

export function startOAuthFlow(): void {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Connect Server Storage</div>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin-bottom:8px">
        Your vault is encrypted before upload — the server only stores ciphertext.
      </p>
      <div class="form-group">
        <label class="label" for="srv-url">Server URL</label>
        <input id="srv-url" type="url" class="input" placeholder="https://your-server.com" autocomplete="url">
      </div>
      <div class="form-group">
        <label class="label" for="srv-key">API Key</label>
        <input id="srv-key" type="password" class="input" placeholder="Your API key" autocomplete="off">
      </div>
      <div id="srv-error" class="error-msg"></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="srv-cancel">Cancel</button>
        <button class="btn btn-primary"   id="srv-connect">Connect</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#srv-cancel')!.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const urlInput   = overlay.querySelector<HTMLInputElement>('#srv-url')!;
  const keyInput   = overlay.querySelector<HTMLInputElement>('#srv-key')!;
  const errEl      = overlay.querySelector<HTMLElement>('#srv-error')!;
  const connectBtn = overlay.querySelector<HTMLButtonElement>('#srv-connect')!;

  const onConnect = async () => {
    const rawUrl = urlInput.value.trim();
    const apiKey = keyInput.value.trim();

    errEl.textContent = '';
    if (!rawUrl) { errEl.textContent = 'Enter a server URL.'; return; }
    if (!apiKey) { errEl.textContent = 'Enter an API key.'; return; }

    const cleanUrl = rawUrl.replace(/\/+$/, '');

    // Enforce HTTPS
    if (!cleanUrl.startsWith('https://')) {
      errEl.textContent = 'Server URL must use HTTPS.';
      return;
    }

    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="spinner"></span> Testing…';

    try {
      // Test the connection — 200 or 404 both mean the server is reachable
      const res = await fetch(`${cleanUrl}/api/vault`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok && res.status !== 404) {
        throw new Error(`Server returned ${res.status}`);
      }
      await persistConfig(cleanUrl, apiKey);
      overlay.remove();
      showToast('✓ Connected to server storage');
    } catch (e) {
      errEl.textContent = `Connection failed: ${(e as Error).message}`;
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect';
    }
  };

  connectBtn.addEventListener('click', onConnect);
  keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') onConnect(); });
  urlInput.focus();
}

// ── Disconnect ────────────────────────────────────────────────────────────────

export async function revokeToken(): Promise<void> {
  config.url          = '';
  config.apiKey       = '';
  config.encryptedKey = null;
  await del(IDB_SERVER_URL);
  await del(IDB_ENCRYPTED_KEY);
  await set(IDB_ENABLED, false);
}

// ── Vault upload / download ───────────────────────────────────────────────────

async function serverRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error('Not connected to server storage');

  const url = `${config.url}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error('SERVER_AUTH_EXPIRED');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Server error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

export async function uploadVault(vaultJson: string): Promise<void> {
  await serverRequest('/api/vault', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: vaultJson,
  });
}

export async function downloadVault(): Promise<string> {
  const res = await serverRequest('/api/vault');
  return res.text();
}

// ── Fire-and-forget save hook ─────────────────────────────────────────────────

export async function uploadAfterSave(vaultJson: string): Promise<void> {
  if (!(await isDriveEnabled())) return;
  if (!isTokenValid()) return;
  try {
    await uploadVault(vaultJson);
  } catch (err) {
    console.warn('[Glyph Server] upload failed silently:', err);
  }
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function persistConfig(url: string, apiKey: string): Promise<void> {
  config.url    = url;
  config.apiKey = apiKey;

  // Encrypt API key with the master password before persisting
  const { getPassword } = await import('./auth');
  const pwd = getPassword();
  if (pwd) {
    const encryptedKey = await encrypt(apiKey, pwd);
    config.encryptedKey = encryptedKey;
    await set(IDB_ENCRYPTED_KEY, encryptedKey);
  }

  await set(IDB_SERVER_URL, url);
  await set(IDB_ENABLED, true);
}
