import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

/** Lets Google sign-in iframe/popup talk to the opener via postMessage (avoids COOP console errors). */
const coopForOAuth: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

/** Spotify OAuth redirects to /spotify-callback — dev/preview must fall back to index.html */
function spotifyCallbackSpaFallback(): Plugin {
  return {
    name: "spotify-callback-spa-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split("?")[0];
        if (path === "/spotify-callback") {
          const q = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
          req.url = "/" + q;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split("?")[0];
        if (path === "/spotify-callback") {
          const q = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
          req.url = "/" + q;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spotifyCallbackSpaFallback()],
  resolve: {
    alias: {
      "@": path.resolve(srcDir, "src"),
    },
  },
  server: {
    /**
     * With default localhost-only binding, some systems refuse IPv4 127.0.0.1:5173 while
     * http://localhost:5173 works. Spotify expects loopback IP callbacks, so listen on all interfaces.
     */
    host: true,
    headers: coopForOAuth,
  },
  preview: {
    host: true,
    headers: coopForOAuth,
  },
});
