/** PKCE for Spotify OAuth (RFC 7636). */
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64UrlEncode(verifierBytes);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const challenge = base64UrlEncode(hash);
  return { verifier, challenge };
}

/**
 * Must match one Spotify Developer Dashboard → Redirect URIs entry exactly.
 * Spotify disallows localhost as the redirect host (use explicit loopback IP, e.g. http://127.0.0.1:PORT/...).
 * Set VITE_SPOTIFY_REDIRECT_URI in Web/frontend/.env to match the Dashboard character-for-character.
 */
export function spotifyRedirectUri(): string {
  const fixed = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined)?.trim();
  if (fixed) return fixed.replace(/\/+$/, "");
  const { protocol, hostname, port } = window.location;
  const p = port ? `:${port}` : "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//127.0.0.1${p}/spotify-callback`;
  }
  return `${window.location.origin}/spotify-callback`;
}
