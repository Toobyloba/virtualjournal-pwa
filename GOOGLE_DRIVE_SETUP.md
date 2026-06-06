# Google Drive Setup — Glyph (5-minute guide)

Glyph uses a **single OAuth client ID** that you (the developer) register once.
Every user just clicks "Connect Google Drive" and signs in with their Gmail — no API keys, no quota worries.

---

## Step 1 — Create a Google Cloud project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **Select a project → New Project**
3. Name it `Glyph` → **Create**

## Step 2 — Enable the Drive API

1. In the left menu: **APIs & Services → Library**
2. Search for **Google Drive API** → click it → **Enable**

## Step 3 — Create an OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in:
   - App name: `Glyph`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue** through remaining steps
5. Click **Publish App** (so all Gmail users can connect)

## Step 4 — Create an OAuth 2.0 Client ID

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `Glyph Web`
4. **Authorised JavaScript origins:**
   - `http://localhost:5173`
   - `https://yourdomain.com`
5. **Authorised redirect URIs** — same two URLs
6. Click **Create** → copy the **Client ID**

## Step 5 — Add the Client ID to the app

Open `dist/index.html` and replace `YOUR_CLIENT_ID_HERE`:

```html
<script>
  window.__GOOGLE_CLIENT_ID__ = '123456789-abc.apps.googleusercontent.com';
</script>
```

The Client ID is **not a secret** — safe to commit and ship in frontend code.

---

## How it works for users

1. **Settings → Connect Google Drive**
2. Gmail sign-in opens → user picks their account
3. One permission: *"Glyph wants to store files in its own hidden folder"*
4. User taps **Allow**
5. Every entry save silently backs up the encrypted vault to Drive
6. Stored in Drive's **App Data** folder — invisible in the user's Drive UI

## Security notes

- Google only ever receives **encrypted ciphertext** — the password never leaves the device
- `drive.appdata` scope cannot read any other Drive files
- Disconnecting Drive (Settings → Disconnect) revokes the token immediately
- Local vault is always the source of truth; Drive is backup only
