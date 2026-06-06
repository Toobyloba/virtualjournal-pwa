# Google Drive Setup — 5-minute guide

VaultJournal uses a **single OAuth client ID** that you (the developer) register once.
Every user just clicks "Connect Google Drive" and signs in with their Gmail — no API keys, no quota worries.

---

## Step 1 — Create a Google Cloud project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **Select a project → New Project**
3. Name it `VaultJournal` → **Create**

## Step 2 — Enable the Drive API

1. In the left menu: **APIs & Services → Library**
2. Search for **Google Drive API** → click it → **Enable**

## Step 3 — Create an OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in:
   - App name: `VaultJournal`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue** through the remaining steps (no scopes needed here yet)
5. On the **Summary** page → **Back to Dashboard**
6. Click **Publish App** (so real users can connect, not just test accounts)

## Step 4 — Create an OAuth 2.0 Client ID

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `VaultJournal Web`
4. Under **Authorised JavaScript origins** add:
   - `http://localhost:5173` (for local dev)
   - `https://yourdomain.com` (your production URL)
5. **Authorised redirect URIs** — same two URLs as above
6. Click **Create**
7. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

## Step 5 — Add the Client ID to the app

Open `dist/index.html` and replace `YOUR_CLIENT_ID_HERE`:

```html
<script>
  window.__GOOGLE_CLIENT_ID__ = '123456789-abc.apps.googleusercontent.com';
</script>
```

That's it. The Client ID is **not a secret** — it's safe to commit and ship in frontend code.

---

## How it works for users

1. User taps **Settings → Connect Google Drive**
2. Google sign-in popup opens — user picks their Gmail account
3. One permission screen: *"VaultJournal wants to store files in its own hidden folder"*
4. User taps **Allow**
5. From now on, every time an entry is saved, the encrypted vault is silently backed up to Drive
6. The vault file is stored in Drive's **App Data** folder — invisible to the user in their Drive UI, only accessible by VaultJournal

## Security notes

- Google only ever receives **encrypted ciphertext** — the password never leaves the device
- The `drive.appdata` scope is the narrowest possible — the app cannot read any other Drive files
- Disconnecting Drive (Settings → Disconnect) revokes the OAuth token immediately
- The local vault is always the source of truth; Drive is a backup only
