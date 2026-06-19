# Spotify connection — step-by-step (EchoAtlas)

This guide explains **why** EchoAtlas uses two backend endpoints and **what** you must configure so **Connect Spotify** works locally.

---

## What “Connect Spotify” means

EchoAtlas has its **own** login (email/Google → **JWT**). Spotify is a **separate** account.

**Connecting Spotify** means: while you are logged into EchoAtlas, you **also** authorize EchoAtlas (via OAuth **PKCE**) so our **backend** can call Spotify Web API (search, track metadata, library actions) **on your behalf**.

It is **not** “sign into EchoAtlas with Spotify”. It is **bind your Spotify account** to your EchoAtlas user (tokens stored server-side).

Backend endpoints involved:

| Endpoint | Role |
|----------|------|
| `POST /spotify/oauth/authorize-url` | Returns the Spotify **authorize URL** plus a one-time **`state`** (CSRF protection). |
| `POST /spotify/oauth/exchange` | Sends the **`code`** from Spotify’s redirect + PKCE **`code_verifier`** → backend exchanges with Spotify → stores **tokens** in DB. |

Until **exchange** succeeds, endpoints such as `POST /spotify/search` expect a linked Spotify account.

---

## Before you start

### 1. EchoAtlas logged in

- Complete registration/login so the frontend holds a **JWT** (commonly `localStorage` key like `auth_token`).
- Every Spotify-related **POST** from the frontend must send:

```http
Authorization: Bearer <YOUR_JWT>
Content-Type: application/json
```

### 2. Spotify Developer Dashboard

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Copy **Client ID** and **Client Secret** into backend `application.yml`:

   - `spotify.client-id`
   - `spotify.client-secret`

3. Add **Redirect URI** — must match the frontend callback **exactly** (scheme, host, port, path).

Recommended local callback:

- `http://127.0.0.1:5173/spotify-callback`

**Use `127.0.0.1`, not `localhost`** — Spotify and browser behaviour around loopback names vary; this project standardises on `127.0.0.1`.

Set the same value in:

- Spotify Dashboard → Redirect URIs  
- Backend `spotify.default-redirect-uri` (must match character-for-character).

#### Development mode: who may connect

New Spotify apps default to **Development** mode. Only Spotify accounts listed under **Dashboard → your app → Settings → User management** can complete OAuth and call Web API as that user.

If you see **`The user is not registered for this application`** (often as HTTP **403** on `/v1/me` after a successful token exchange), add the **Spotify login email** you use on Spotify’s consent screen — not your EchoAtlas email unless they are the same.

### 3. PKCE (what you need to know)

Spotify requires **PKCE** for this flow:

- **`code_verifier`** — random secret; kept in the browser (e.g. `sessionStorage`), **not** sent in the first authorize URL.
- **`code_challenge`** — derived from the verifier (S256); sent when requesting the authorize URL via the backend.

The frontend helper lives at `Web/frontend/src/lib/pkce.ts`.  
On **Connect Spotify**, the app stores `code_verifier` in **`sessionStorage`**; the **`/spotify-callback`** page reads it back for **`exchange`**.

---

## Flow (chronological)

### Step A — Generate PKCE in the browser

(Usually automatic when you click **Connect Spotify**.)

1. Generate **`code_verifier`** (length per Spotify rules, commonly 43–128 chars).  
2. Compute **`code_challenge`** = Base64URL( SHA256( verifier ) ), method **S256**.  
3. Store **`code_verifier`** in **`sessionStorage`** (do not clear before callback completes).

### Step B — `POST /spotify/oauth/authorize-url`

Example backend URL: `http://localhost:8080/spotify/oauth/authorize-url`

**Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`

**Body** typically includes `codeChallenge`, `codeChallengeMethod` (`S256`), `redirectUri` (must match Dashboard + `application.yml`).

**Response:** `{ authorizeUrl, state }` — open **`authorizeUrl`** in the **same browser** (full-page navigation or popup per UX).

### Step C — User approves on Spotify

Spotify redirects the browser to:

`http://127.0.0.1:5173/spotify-callback?code=...&state=...`

### Step D — `POST /spotify/oauth/exchange`

**Headers:** `Authorization: Bearer <JWT>`

**Body:** includes **`code`** from the query string, **`redirectUri`** (same as above), **`codeVerifier`** from **`sessionStorage`**.

On success, the backend persists tokens → Spotify is **linked** for this EchoAtlas user.

---

## Local URLs (quick reference)

| Purpose | URL |
|---------|-----|
| Frontend (use this in browser) | `http://127.0.0.1:5173` |
| Spotify Redirect URI | `http://127.0.0.1:5173/spotify-callback` |
| Backend API (default) | `http://localhost:8080` |

---

## Common problems

| Symptom | What to check |
|---------|----------------|
| Redirect mismatch | Redirect URI in Dashboard **exactly** equals `spotify.default-redirect-uri` and what the frontend sends. |
| Used `localhost` | Switch to **`127.0.0.1`** for both open tab and Redirect URI. |
| `exchange` fails | `code_verifier` missing from `sessionStorage` (wrong tab, cleared storage, or incognito). |
| localhost Spotify warning | MusicPlayer may show that Spotify does not allow **localhost** as redirect — use **127.0.0.1**. |
| HTTP **403** / `not registered for this application` | App is in **Development** mode → add your Spotify account under **User management** on the Dashboard (see section above). |
| 401 on Spotify APIs | JWT expired → log in again; or Spotify not linked → run Connect flow again. |

---

## Related docs in this repo

- `Web/backend/docs/SPOTIFY_WEB_PLAYBACK_SETUP.md` — playback / embed notes (if present).  
- `Web/backend/docs/SPOTIFY_AND_LIBRARY_API.md` — API behaviour (if present).  
- Root **`README.md`** — quick **Connect Spotify** steps for markers.

---

## Summary

1. Configure **Client ID / Secret** and **Redirect URI** (`127.0.0.1`).  
2. Log into **EchoAtlas** (JWT).  
3. Click **Connect Spotify** → PKCE → Spotify approve → **exchange** saves tokens.  
4. Use **`http://127.0.0.1:5173`** for local testing.
