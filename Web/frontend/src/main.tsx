import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import SpotifyCallback from "./SpotifyCallback.tsx";

const root = document.getElementById("root")!;
const path = window.location.pathname.replace(/\/$/, "") || "/";
const isSpotifyCb = path === "/spotify-callback";

createRoot(root).render(
  <StrictMode>{isSpotifyCb ? <SpotifyCallback /> : <App />}</StrictMode>,
);
