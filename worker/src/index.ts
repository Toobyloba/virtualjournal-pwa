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

const VAULT_KEY      = 'glyph-vault.ejson';
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Rate limiter (in-memory, per-isolate) ────────────────────────────────────

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateMap = new Map<string, RateEntry>();
const RATE_LIMIT = 100;      // max requests
const RATE_WINDOW = 60_000;  // per minute

function checkRate(ip: string): boolean {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW };
    rateMap.set(ip, entry);
  }
  entry.count++;
  // Lazy cleanup: clear expired entries when we happen to visit them
  if (entry.count % 50 === 0) {
    for (const [k, v] of rateMap) {
      if (now > v.resetAt) rateMap.delete(k);
    }
  }
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

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

/** Constant-time string comparison — prevents timing leaks on API key check. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function requireAuth(request: Request, env: Env): Response | null {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || !timingSafeEqual(token, env.API_KEY)) {
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
  // Check content-length before reading the body
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', {
      status: 413,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const body = await request.text();
  if (!body.trim()) {
    return new Response('Empty body', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Defensive: enforce size limit on the actual body too
  if (body.length > MAX_BODY_BYTES) {
    return new Response('Payload too large', {
      status: 413,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Must be valid JSON
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

    // Rate limit by IP (skip preflight)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRate(ip)) {
      return new Response('Too Many Requests', { status: 429 });
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
