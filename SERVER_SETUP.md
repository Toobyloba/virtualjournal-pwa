# Glyph Server — Deployment Guide

Deploy the Glyph backend on Cloudflare Workers and the frontend on Cloudflare Pages.
Takes about 10 minutes.

---

## Step 1 — Install wrangler

```bash
cd worker
npm install
```

## Step 2 — Create a KV namespace

```bash
npx wrangler kv:namespace create VAULT_STORE
```

Copy the `id` from the output and paste it into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "VAULT_STORE"
id = "abc123..."   # ← paste the id here
```

## Step 3 — Set your API key

Generate a random API key (keep this safe — you'll enter it in the app):

```bash
# Generate a 32-character random key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Then set it as a secret on the worker:

```bash
npx wrangler secret put API_KEY
# Paste the key when prompted
```

## Step 4 — Deploy the worker

```bash
npx wrangler deploy
```

Note the worker URL — something like `https://glyph-server.your-subdomain.workers.dev`.

## Step 5 — Deploy the frontend to Cloudflare Pages

1. Push your repo to GitHub
2. Go to [Cloudflare Dashboard → Workers & Pages → Pages](https://dash.cloudflare.com/?to=/:account/pages)
3. Click **Create a project → Connect to Git**
4. Select your repo
5. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables (optional):** `__SERVER_URL__` = your worker URL

## Step 6 — Connect the app

1. Open your deployed Pages site
2. Go to **Settings → Server Storage → Connect Server**
3. Enter your worker URL (`https://glyph-server.your-subdomain.workers.dev`)
4. Enter your API key
5. Click **Connect**

Every save will now silently back up to your worker.

---

## Architecture

```
Browser (Glyph PWA)
  │
  │  AES-256-GCM ciphertext (encrypted in-browser)
  │
  ├─ GET  /api/vault  ──► Cloudflare Worker ──► KV: VAULT_STORE
  └─ PUT  /api/vault  ──► Cloudflare Worker ──► KV: VAULT_STORE
```

The worker never sees plaintext — it's a dumb pipe for an already-encrypted blob.

## Security

- **API key** stored as a Worker secret (encrypted at rest, never in source)
- **KV** stores only ciphertext — even if the KV were leaked, entries can't be read without the password
- **CORS** configurable via `CORS_ORIGIN` variable — lock it down to your Pages domain
- **No user data logged** — the worker never inspects the request body beyond validating JSON
