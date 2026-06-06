// ── drive.ts ──────────────────────────────────────────────────────────────────
// Google Drive integration for Glyph.
// Uses OAuth2 implicit flow + drive.appdata scope.

import { get, set, del } from 'idb-keyval';

const CLIENT_ID   = (window as any).__GOOGLE_CLIENT_ID__ ?? 'YOUR_CLIENT_ID_HERE';
const SCOPE       = 'https://www.googleapis.com/auth/drive.appdata';
const REDIRECT    = window.location.origin + window.location.pathname;
const FILE_NAME   = 'glyph-vault.ejson';
const FOLDER      = 'appDataFolder';

const IDB_TOKEN    = 'gd_access_token';
const IDB_EXPIRY   = 'gd_token_expiry';
const IDB_FILE_ID  = 'gd_file_id';
const IDB_ENABLED  = 'gd_enabled';

interface TokenState {
  accessToken: string | null;
  expiry:      number;
}

const tokenState: TokenState = { accessToken: null, expiry: 0 };

export async function loadTokenFromIdb(): Promise<void> {
  const token  = await get<string>(IDB_TOKEN);
  const expiry = await get<number>(IDB_EXPIRY);
  if (token && expiry && Date.now() < expiry) {
    tokenState.accessToken = token;
    tokenState.expiry      = expiry;
  }
}

export function isTokenValid(): boolean {
  return !!tokenState.accessToken && Date.now() < tokenState.expiry - 60_000;
}

export function getToken(): string | null {
  return isTokenValid() ? tokenState.accessToken : null;
}

async function persistToken(token: string, expiresInSeconds: number): Promise<void> {
  const expiry = Date.now() + expiresInSeconds * 1000;
  tokenState.accessToken = token;
  tokenState.expiry      = expiry;
  await set(IDB_TOKEN,  token);
  await set(IDB_EXPIRY, expiry);
}

export async function revokeToken(): Promise<void> {
  const token = tokenState.accessToken;
  tokenState.accessToken = null;
  tokenState.expiry      = 0;
  await del(IDB_TOKEN);
  await del(IDB_EXPIRY);
  await del(IDB_FILE_ID);
  await set(IDB_ENABLED, false);
  if (token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
  }
}

const STATE_KEY = 'gd_oauth_state';

export function startOAuthFlow(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT,
    response_type: 'token',
    scope:         SCOPE,
    state,
    prompt:        'consent',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleOAuthCallback(): Promise<boolean> {
  const hash      = new URLSearchParams(window.location.hash.replace('#', ''));
  const token     = hash.get('access_token');
  const expiresIn = hash.get('expires_in');
  const state     = hash.get('state');
  if (!token || !expiresIn) return false;

  const savedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (state !== savedState) { console.error('OAuth state mismatch'); return false; }

  await persistToken(token, parseInt(expiresIn, 10));
  await set(IDB_ENABLED, true);
  history.replaceState(null, '', window.location.pathname);
  return true;
}

export function silentRefresh(): Promise<boolean> {
  return new Promise(resolve => {
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT,
      response_type: 'token',
      scope:         SCOPE,
      state,
      prompt:        'none',
    });
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    const timer = setTimeout(() => { iframe.remove(); resolve(false); }, 10_000);
    iframe.addEventListener('load', async () => {
      clearTimeout(timer);
      try {
        const iHash = new URLSearchParams((iframe.contentWindow?.location.hash ?? '').replace('#', ''));
        const t  = iHash.get('access_token');
        const ex = iHash.get('expires_in');
        const is = iHash.get('state');
        if (t && ex && is === sessionStorage.getItem(STATE_KEY)) {
          sessionStorage.removeItem(STATE_KEY);
          await persistToken(t, parseInt(ex, 10));
          iframe.remove(); resolve(true); return;
        }
      } catch { /* cross-origin = needs re-auth */ }
      iframe.remove(); resolve(false);
    });
    document.body.appendChild(iframe);
  });
}

async function driveRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated with Google Drive');
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    await del(IDB_TOKEN); tokenState.accessToken = null;
    throw new Error('DRIVE_AUTH_EXPIRED');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive API error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

async function getFileId(): Promise<string | null> {
  const cached = await get<string>(IDB_FILE_ID);
  if (cached) return cached;
  const params = new URLSearchParams({ spaces: FOLDER, q: `name = '${FILE_NAME}'`, fields: 'files(id)' });
  const res  = await driveRequest(`https://www.googleapis.com/drive/v3/files?${params}`);
  const json = await res.json() as { files: { id: string }[] };
  if (json.files.length > 0) {
    const id = json.files[0]!.id;
    await set(IDB_FILE_ID, id);
    return id;
  }
  return null;
}

export async function isDriveEnabled(): Promise<boolean> {
  return (await get<boolean>(IDB_ENABLED)) === true;
}

export async function uploadVault(vaultJson: string): Promise<void> {
  const body   = new Blob([vaultJson], { type: 'application/json' });
  let   fileId = await getFileId();
  if (!fileId) {
    const meta = JSON.stringify({ name: FILE_NAME, parents: [FOLDER] });
    const form = new FormData();
    form.append('metadata', new Blob([meta], { type: 'application/json' }));
    form.append('file', body);
    const res  = await driveRequest(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', body: form }
    );
    const json = await res.json() as { id: string };
    fileId     = json.id;
    await set(IDB_FILE_ID, fileId);
  } else {
    await driveRequest(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }
    );
  }
}

export async function downloadVault(): Promise<string> {
  const fileId = await getFileId();
  if (!fileId) throw new Error('No vault found in Google Drive');
  const res = await driveRequest(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  return res.text();
}

/**
 * Fire-and-forget Drive backup after every local save.
 * Silently retries token refresh; never throws.
 */
export async function uploadAfterSave(vaultJson: string): Promise<void> {
  if (!(await isDriveEnabled())) return;
  if (!isTokenValid()) {
    const refreshed = await silentRefresh();
    if (!refreshed) return;
  }
  try {
    await uploadVault(vaultJson);
  } catch (err) {
    console.warn('[Glyph Drive] upload failed silently:', err);
  }
}
