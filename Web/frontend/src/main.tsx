import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import App from "@/app/App";
import SpotifyCallback from "@/pages/SpotifyCallback";

const root = document.getElementById("root")!;
const path = window.location.pathname.replace(/\/$/, "") || "/";
const isSpotifyCb = path === "/spotify-callback";

createRoot(root).render(
  <StrictMode>{isSpotifyCb ? <SpotifyCallback /> : <App />}</StrictMode>,
);
