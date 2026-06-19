import { useEffect, useRef, useState } from "react";
import { aiApi } from "@/lib/api";
import { IC } from "./constants";
import type { AiSessionState, PlayerType, UiTrack } from "./types";
import { detectRecommendLocale, spotifyToUi } from "./utils";

export function AIChat({
  accent, accentB, pageScene, spotifyLinked, token, session, playerType, patchAiSession, onAppendTracks, onSwitchMain,
}: {
  accent: string; accentB: string; pageScene: string; spotifyLinked: boolean; token: string | null;
  session: AiSessionState; playerType: PlayerType;
  patchAiSession: (pt: PlayerType, patch: Partial<AiSessionState> | ((prev: AiSessionState) => AiSessionState)) => void;
  onAppendTracks: (tracks: UiTrack[]) => void; onSwitchMain: () => void;
}) {
  const { msgs, lastItems, input } = session;
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); });
    return () => cancelAnimationFrame(id);
  }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    const loc = detectRecommendLocale(txt);
    const pt = playerType;
    if (!token) {
      const deny = "Please sign in to EchoAtlas first (keypad on the door).";
      patchAiSession(pt, prev => ({ ...prev, input: "", msgs: [...prev.msgs, { role: "user", text: txt }, { role: "ai", text: deny }] }));
      return;
    }
    patchAiSession(pt, prev => ({ ...prev, input: "", msgs: [...prev.msgs, { role: "user", text: txt }] }));
    setLoading(true);
    try {
      const res = await aiApi.recommend(token, { userMessage: txt, mode: "MIXED", maxItems: 12, pageScene, locale: loc });
      const lines: string[] = [];
      if (res.data.summary) lines.push(res.data.summary);
      if (res.data.tracks?.length) {
        lines.push("");
        res.data.tracks.forEach((tr, i) => {
          const notePart = tr.note ? (loc === "zh" ? `（${tr.note}）` : ` (${tr.note})`) : "";
          lines.push(`${i + 1}. ${tr.title ?? "—"} — ${tr.artist ?? ""}${notePart}`);
        });
      }
      const aiText = lines.join("\n") || "(No text summary.)";
      patchAiSession(pt, prev => ({ ...prev, lastItems: res.data.tracks ?? [], msgs: [...prev.msgs, { role: "ai", text: aiText }] }));
    } catch (e) {
      const fail = e instanceof Error ? e.message : "Request failed.";
      patchAiSession(pt, prev => ({ ...prev, lastItems: [], msgs: [...prev.msgs, { role: "ai", text: fail }] }));
    } finally { setLoading(false); }
  };

  const resolveToSpotify = async () => {
    if (!token || !spotifyLinked || !lastItems.length) return;
    const pt = playerType;
    const sceneLabel =
      pageScene === "STUDY"
        ? "Study"
        : pageScene === "PARTY"
          ? "Party"
          : pageScene === "HEADPHONES"
            ? "Listening Room"
            : "Sports";
    setLoading(true);
    try {
      const items = lastItems.map(x => ({ title: x.title ?? "", artist: x.artist ?? "" }));
      const res = await aiApi.resolveTracks(token, { items });
      const mapped: UiTrack[] = [];
      for (const it of res.data.items ?? []) {
        if (it.matched && it.spotify) mapped.push(spotifyToUi(it.spotify, false));
      }
      if (mapped.length) {
        onAppendTracks(mapped);
        const ok = `Added ${mapped.length} track(s) to the "${sceneLabel}" list — open the playlist on the left to listen.`;
        patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: ok }] }));
        onSwitchMain();
      } else {
        const bad = "No matching Spotify tracks. Try different wording or check regional availability.";
        patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: bad }] }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to resolve tracks.";
      patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: msg }] }));
    } finally { setLoading(false); }
  };

  return (
    <div className="mpin" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div style={{ padding: "22px 24px 12px", borderBottom: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: accent, display: "flex", opacity: 0.95 }}>{IC.musicSm()}</span>
          AI Music
        </h2>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>
          Describe your mood or the type of music you want, and AI will recommend tracks for you.
        </p>
        {lastItems.length > 0 && spotifyLinked && token && (
          <button type="button" onClick={resolveToSpotify} disabled={loading}
            style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, border: "none", cursor: loading ? "wait" : "pointer", fontSize: 13, fontWeight: 600, color: "#fff", background: `linear-gradient(135deg,${accent},${accentB})`, boxShadow: `0 3px 12px ${accent}55` }}>
            Add this round of recommendations to Spotify (main list)
          </button>
        )}
        {lastItems.length > 0 && !spotifyLinked && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            After connecting Spotify, you can turn recommendations into playable tracks.
          </p>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? `linear-gradient(135deg,${accent}88,${accentB}66)` : "rgba(255,255,255,0.45)", border: m.role === "user" ? `1px solid ${accent}44` : "1px solid rgba(0,0,0,0.08)", fontSize: 14, color: m.role === "user" ? "#fff" : "rgba(0,0,0,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <span className="mp-dot" /><span className="mp-dot" /><span className="mp-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "11px 14px", borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", gap: 8, flexShrink: 0 }}>
        <input className="mp-chat-in" value={input}
          onChange={e => patchAiSession(playerType, prev => ({ ...prev, input: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="e.g. calm focus music for studying…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 11, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.12)", color: "#1a1a1a", fontSize: 14 }} />
        <button type="button" className="mp-btn" onClick={send}
          style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg,${accent},${accentB})`, border: "none", color: "#fff", cursor: "pointer", boxShadow: `0 3px 12px ${accent}55` }}>
          {IC.send()}
        </button>
      </div>
    </div>
  );
}
