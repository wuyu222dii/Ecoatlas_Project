import type { CSSProperties } from "react";

export const PRESET_AVATARS = [
  { key: "preset:cookie", emoji: "🍪", ring: "rgba(116,170,255,0.6)" },
  { key: "preset:cat", emoji: "🐱", ring: "rgba(255,177,117,0.66)" },
  { key: "preset:dog", emoji: "🐶", ring: "rgba(165,205,255,0.68)" },
  { key: "preset:fox", emoji: "🦊", ring: "rgba(255,157,94,0.66)" },
  { key: "preset:bear", emoji: "🐻", ring: "rgba(203,166,120,0.66)" },
  { key: "preset:panda", emoji: "🐼", ring: "rgba(196,201,214,0.66)" },
  { key: "preset:rabbit", emoji: "🐰", ring: "rgba(255,180,205,0.7)" },
  { key: "preset:star", emoji: "🌟", ring: "rgba(255,224,130,0.72)" },
  { key: "preset:rocket", emoji: "🚀", ring: "rgba(154,193,255,0.72)" },
  { key: "preset:music", emoji: "🎧", ring: "rgba(191,158,255,0.72)" },
] as const;

export type PresetAvatarKey = (typeof PRESET_AVATARS)[number]["key"];

function getPreset(avatarUrl?: string | null) {
  const legacyAlias: Record<string, string> = {
    "preset:book": "preset:star",
    "preset:sports": "preset:rocket",
    "preset:party": "preset:music",
  };
  const normalizedKey = avatarUrl ? legacyAlias[avatarUrl] ?? avatarUrl : avatarUrl;
  return PRESET_AVATARS.find((item) => item.key === normalizedKey) ?? null;
}

export function UserAvatar({
  avatarUrl,
  name,
  size = 56,
  style,
}: {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const preset = getPreset(avatarUrl);
  const common: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...style,
  };

  if (preset) {
    return (
      <div
        style={{
          ...common,
          border: `2px solid ${preset.ring}`,
          background: "rgba(255,255,255,0.18)",
          fontSize: Math.round(size * 0.5),
          lineHeight: 1,
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
        }}
        aria-label={name ? `${name} avatar` : "User avatar"}
      >
        {preset.emoji}
      </div>
    );
  }

  if (avatarUrl && !avatarUrl.startsWith("preset:")) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `${name} avatar` : "User avatar"}
        style={{
          ...common,
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.55)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...common,
        background: "rgba(255,255,255,0.85)",
        color: "rgba(65,74,86,0.95)",
        border: "2px solid rgba(255,255,255,0.6)",
        fontSize: Math.round(size * 0.42),
        boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
      }}
      aria-label={name ? `${name} avatar` : "User avatar"}
    >
      👤
    </div>
  );
}
