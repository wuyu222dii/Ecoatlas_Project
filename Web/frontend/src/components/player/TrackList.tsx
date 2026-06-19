import type { ReactNode } from "react";
import { IC } from "./constants";
import type { UiTrack } from "./types";

export function TrackList({
  tracks, title, desc, duration, accent, accentB, grad, cover, coverObjectFit = "cover", coverPad = 0, currentId, onSelect, onToggleLike,
  primaryLabel, primaryIcon, onPrimaryAction, primaryDisabled,
}: {
  tracks: UiTrack[]; title: string; desc: string; duration: string;
  accent: string; accentB: string; grad: string; cover: string;
  /** Headphone art is taller than square — use contain so nothing is cropped. */
  coverObjectFit?: "cover" | "contain";
  /** Inner padding inside the poster (px) when scaling with contain. */
  coverPad?: number;
  currentId: string;
  onSelect: (t: UiTrack) => void; onToggleLike: (t: UiTrack) => void;
  primaryLabel: string;
  primaryIcon: ReactNode;
  onPrimaryAction: () => void | Promise<void>;
  primaryDisabled?: boolean;
}) {
  return (
    <div className="mpin" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 22, padding: "22px 24px 14px", alignItems: "flex-start", flexShrink: 0 }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 16,
            flexShrink: 0,
            background: grad,
            border: "1px solid rgba(255,255,255,0.22)",
            overflow: "hidden",
            boxShadow: `0 6px 24px rgba(0,0,0,0.2), 0 0 20px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.25)`,
            boxSizing: "border-box",
            padding: coverPad,
            display: coverObjectFit === "contain" ? "flex" : "block",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: coverObjectFit, objectPosition: "center center" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <h2 style={{ margin: "0 0 5px", fontSize: 25, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{title}</h2>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{desc}</p>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{tracks.length} tracks · {duration}</p>
          <button type="button" className="mp-btn" onClick={() => void onPrimaryAction()} disabled={primaryDisabled}
            style={{ gap: 6, color: "#fff", cursor: primaryDisabled ? "wait" : "pointer", opacity: primaryDisabled ? 0.72 : 1, background: `linear-gradient(135deg,${accent},${accentB})`, border: "none", padding: "9px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600, boxShadow: `0 4px 14px ${accent}55` }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {primaryIcon}
              {primaryLabel}
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 50px 28px 28px", gap: 8, padding: "4px 12px", fontSize: 11, color: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(0,0,0,0.1)", marginBottom: 2, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", alignItems: "center", flexShrink: 0 }}>
        <span>#</span><span>Title</span><span>Artist</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}>{IC.clock()}</span>
        <span /><span />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 6px", minHeight: 0 }}>
        {tracks.map((t, idx) => {
          const isActive = currentId === t.id;
          return (
            <div key={t.id} className="mp-track" onClick={() => onSelect(t)}
              style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 50px 28px 28px", gap: 8, padding: "9px 6px", alignItems: "center", background: isActive ? `${accent}28` : "transparent" }}>
              <span style={{ fontSize: 12, color: isActive ? accent : "rgba(0,0,0,0.38)", textAlign: "center", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
                {isActive ? "▶" : idx + 1}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: t.color + "28", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: isActive ? 600 : 500, color: isActive ? "#1a1a1a" : "rgba(0,0,0,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "rgba(0,0,0,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist}</span>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", textAlign: "right", fontFamily: "'DM Mono',monospace" }}>{t.dur}</span>
              <button type="button" className="mp-btn" onClick={e => { e.stopPropagation(); onToggleLike(t); }} style={{ color: t.liked ? accent : "rgba(0,0,0,0.25)", transition: "color .2s" }}>
                {IC.heart(t.liked)}
              </button>
              <button type="button" className="mp-btn" onClick={e => e.stopPropagation()} style={{ color: "rgba(0,0,0,0.25)" }}>
                {IC.more()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
