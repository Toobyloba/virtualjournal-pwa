// ── Glyph Server — Cloudflare Worker ──────────────────────────────────────────
// Dumb pipe for the encrypted vault. Two endpoints:
//
//   GET  /api/vault   → download the vault (200) or 404 if no vault yet
//   PUT  /api/vault   → upload the vault (200)
//   GET  /api/health  → health check (public, no auth)
//
// Auth: Bearer token checked against the API_KEY secret.

export interface Env {
  VAULT_STORE: KVNamespace;
  API_KEY: string;
  CORS_ORIGIN?: string;
}

const VAULT_KEY = 'glyph-vault.ejson';

// ── Helpers ───────────────────────────────────────────────────────────────────

function cors(request: Request, env: Env): Headers {
  const headers = new Headers();
  const allowed = env.CORS_ORIGIN || request.headers.get('Origin') || '*';
  headers.set('Access-Control-Allow-Origin', allowed);
  headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function requireAuth(request: Request, env: Env): Response | null {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || token !== env.API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null; // auth passed
}

function json(data: unknown, status: number, extraHeaders?: Headers): Response {
  const body = JSON.stringify(data);
  const h = extraHeaders ?? new Headers();
  h.set('Content-Type', 'application/json');
  return new Response(body, { status, headers: h });
}

// ── Routes ────────────────────────────────────────────────────────────────────

async function handleGetVault(env: Env): Promise<Response> {
  const data = await env.VAULT_STORE.get(VAULT_KEY);
  if (!data) {
    return new Response('No vault found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handlePutVault(request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  if (!body.trim()) {
    return new Response('Empty body', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Basic validation: must be valid JSON
  try {
    JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  await env.VAULT_STORE.put(VAULT_KEY, body);
  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request, env) });
    }

    // Public health check
    if (path === '/api/health') {
      const headers = cors(request, env);
      return json({ status: 'ok' }, 200, headers);
    }

    // All vault routes require auth
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const corsHeaders = cors(request, env);

    // GET /api/vault — download
    if (path === '/api/vault' && request.method === 'GET') {
      const res = await handleGetVault(env);
      corsHeaders.forEach((v, k) => res.headers.set(k, v));
      return res;
    }

    // PUT /api/vault — upload
    if (path === '/api/vault' && request.method === 'PUT') {
      const res = await handlePutVault(request, env);
      corsHeaders.forEach((v, k) => res.headers.set(k, v));
      return res;
    }

    // 404 for everything else
    return new Response('Not Found', {
      status: 404,
      headers: { ...Object.fromEntries(corsHeaders), 'Content-Type': 'text/plain' },
    });
  },
};
