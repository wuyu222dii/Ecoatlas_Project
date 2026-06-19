import { useEffect, useState } from "react";
import { getToken, spotifyApi } from "@/lib/api";
import { spotifyRedirectUri } from "@/lib/auth/pkce";

const PKCE_KEY = "spotify_pkce_verifier";

/**
 * OAuth return path: exchange ?code= & state= for tokens, then redirect home.
 * Must match Spotify Dashboard / server default-redirect-uri exactly.
 */
export default function SpotifyCallback() {
  const [msg, setMsg] = useState("Connecting to Spotify…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");
    const token = getToken();
    const verifier = sessionStorage.getItem(PKCE_KEY);

    if (err) {
      setMsg(`Authorization did not complete: ${err}`);
      return;
    }
    if (!code || !state) {
      setMsg("Missing authorization parameters. Start Connect Spotify from the app again.");
      return;
    }
    if (!verifier) {
      setMsg(
        "Missing PKCE verifier: return from the same origin you used for Connect Spotify. If you use localhost but the callback is 127.0.0.1, open the site at http://127.0.0.1:5173 and connect again.",
      );
      return;
    }
    if (!token) {
      setMsg(
        "Not signed in: JWT must be same-origin as this page. Open http://127.0.0.1:5173, sign in, then use Connect Spotify.",
      );
      return;
    }

    (async () => {
      try {
        await spotifyApi.exchange(token, {
          code,
          state,
          codeVerifier: verifier,
          redirectUri: spotifyRedirectUri(),
        });
        sessionStorage.removeItem(PKCE_KEY);
        window.location.replace("/");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Connection failed.");
      }
    })();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0c12",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "system-ui,sans-serif",
        padding: 24,
      }}
    >
      <p style={{ maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>{msg}</p>
    </div>
  );
}
