import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getToken, libraryApi, resonanceApi, type SavedTrackResponse } from "@/lib/api";
import { DEFAULT_MOOD, MEMORY_FORM_ID, MOOD_OPTIONS, normalizeMood } from "./constants";
import type { MemoryFormDraft, UiVisuals } from "./types";

export function ResonanceForm({
  draft,
  isDark,
  isMobile,
  uiTheme,
  onLibraryTrackPick,
}: {
  draft?: MemoryFormDraft | null;
  isDark: boolean;
  isMobile: boolean;
  uiTheme: UiVisuals;
  /** Pass null to clear selected library track */
  onLibraryTrackPick: (track: SavedTrackResponse | null) => void;
}) {
  const [loc, setLoc] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [titleStr, setTitleStr] = useState("");
  const [storyStr, setStoryStr] = useState("");
  const [moodStr, setMoodStr] = useState(DEFAULT_MOOD);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [acItems, setAcItems] = useState<{ placeId: string | null; description: string | null }[]>(
    [],
  );
  const [acOpen, setAcOpen] = useState(false);
  const [acLoading, setAcLoading] = useState(false);
  const acTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationBoxRef = useRef<HTMLDivElement>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [libTracks, setLibTracks] = useState<SavedTrackResponse[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libFilter, setLibFilter] = useState("");

  const fieldClass =
    "border rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 focus-within:ring-1 focus-within:ring-[#e8845a]/45 focus-within:border-[#e8845a]/45 transition-colors";
  const inputClass =
    `bg-transparent border-none focus:ring-0 text-[13px] w-full outline-none ${
      isDark
        ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
        : "text-[#2f2723] placeholder:text-[#6f625b]/55"
    }`;
  const coordinateInputClass = `${inputClass} cursor-not-allowed opacity-70`;
  const labelStyle = { color: isDark ? "rgba(213,202,193,0.72)" : "#6f625b" };
  const fieldStyle = {
    background: uiTheme.fieldSurface,
    borderColor: uiTheme.border,
  };

  useEffect(() => {
    setLoc(draft?.location ?? "");
    setLatStr(draft?.lat ?? "");
    setLngStr(draft?.lng ?? "");
    setTitleStr(draft?.title ?? "");
    setStoryStr(draft?.story ?? "");
    setMoodStr(normalizeMood(draft?.mood));
    setPhotoPreview(null);
    setAcItems([]);
    setAcOpen(false);
    setLibOpen(false);
    setLibFilter("");
  }, [draft?.key]);

  useEffect(() => {
    if (!libOpen) return;
    const token = getToken();
    if (!token) return;
    setLibLoading(true);
    libraryApi
      .list(token, { page: 0, size: 100 })
      .then((res) => setLibTracks(res.data.content ?? []))
      .catch(() => setLibTracks([]))
      .finally(() => setLibLoading(false));
  }, [libOpen]);

  const filteredLibTracks = useMemo(() => {
    const q = libFilter.trim().toLowerCase();
    if (!q) return libTracks;
    return libTracks.filter(
      (t) =>
        (t.trackName ?? "").toLowerCase().includes(q) ||
        (t.artistNames ?? "").toLowerCase().includes(q),
    );
  }, [libTracks, libFilter]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const el = locationBoxRef.current;
      if (el && !el.contains(e.target as Node)) setAcOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const runAutocomplete = useCallback(async (input: string) => {
    const token = getToken();
    if (!token || input.trim().length < 2) {
      setAcItems([]);
      return;
    }
    setAcLoading(true);
    try {
      const res = await resonanceApi.autocompletePlace(token, { input: input.trim() });
      setAcItems(res.data ?? []);
      setAcOpen(true);
    } catch {
      setAcItems([]);
    } finally {
      setAcLoading(false);
    }
  }, []);

  const onLocationInput = (value: string) => {
    setLoc(value);
    if (acTimerRef.current) clearTimeout(acTimerRef.current);
    acTimerRef.current = setTimeout(() => {
      void runAutocomplete(value);
    }, 320);
  };

  const pickPlace = async (placeId: string | null, description: string) => {
    if (!placeId) return;
    const token = getToken();
    if (!token) return;
    setAcLoading(true);
    try {
      const res = await resonanceApi.resolvePlace(token, { googlePlaceId: placeId });
      const p = res.data;
      const label = p.placeName ?? p.address ?? description;
      setLoc(label);
      if (p.latitude) setLatStr(String(p.latitude));
      if (p.longitude) setLngStr(String(p.longitude));
      setAcOpen(false);
      setAcItems([]);
    } catch {
      setAcOpen(false);
    } finally {
      setAcLoading(false);
    }
  };

  const displayPhoto = photoPreview ?? draft?.existingImageUrl;

  return (
    <form
      className={`space-y-3 ${isMobile ? "pb-1" : ""}`}
      encType="multipart/form-data"
      id={MEMORY_FORM_ID}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="space-y-1.5">
        <label
          htmlFor="memory-title"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Title
        </label>
        <div className={fieldClass} style={fieldStyle}>
          <span className="material-symbols-outlined text-lg text-[#e8845a]">
            title
          </span>
          <input
            className={inputClass}
            id="memory-title"
            name="title"
            onChange={(e) => setTitleStr(e.target.value)}
            placeholder="Name this memory"
            required
            type="text"
            value={titleStr}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-location"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Location
        </label>
        <div className="relative" ref={locationBoxRef}>
          <div className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a] shrink-0">
              location_on
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              id="memory-location"
              name="location"
              placeholder="Type a query, pick a Google suggestion to fill coordinates"
              required
              type="text"
              value={loc}
              onChange={(e) => onLocationInput(e.target.value)}
              onFocus={() => loc.trim().length >= 2 && void runAutocomplete(loc)}
            />
          </div>
          {acLoading && (
            <p className="absolute right-0 top-full mt-1 text-[10px]" style={{ color: labelStyle.color }}>
              Searching places…
            </p>
          )}
          {acOpen && acItems.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-48 overflow-y-auto rounded-[12px] border py-1 shadow-lg"
              style={{
                background: uiTheme.drawerSurface,
                borderColor: uiTheme.border,
              }}
            >
              {acItems.map((s, idx) => (
                <li key={`${s.placeId ?? "p"}-${idx}`}>
                  <button
                    className="w-full cursor-pointer px-3 py-2 text-left text-[12px] hover:bg-white/10"
                    style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
                    type="button"
                    onClick={() => void pickPlace(s.placeId, s.description ?? "")}
                  >
                    {s.description}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-[10px] m-0" style={{ color: uiTheme.textMuted }}>
          Sign-in and Google Places on the server required; coordinates are filled from the picked place.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-mood"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Mood
        </label>
        <div className={fieldClass} style={fieldStyle}>
          <span className="material-symbols-outlined text-lg text-[#e8845a]">
            mood
          </span>
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            id="memory-mood"
            name="mood"
            onChange={(e) => setMoodStr(e.target.value)}
            value={moodStr}
          >
            {MOOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} {option.label}
              </option>
            ))}
          </select>
          <span
            className="material-symbols-outlined text-base"
            style={{ color: isDark ? "rgba(213,202,193,0.6)" : "#6f625b" }}
          >
            expand_more
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Coordinates
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a]">
              north
            </span>
            <input name="lat" type="hidden" value={latStr} />
            <input
              aria-label="Latitude"
              aria-readonly="true"
              className={coordinateInputClass}
              disabled
              inputMode="decimal"
              max="90"
              min="-90"
              placeholder="Lat"
              readOnly
              step="any"
              type="number"
              value={latStr}
            />
          </label>
          <label className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a]">
              east
            </span>
            <input name="lng" type="hidden" value={lngStr} />
            <input
              aria-label="Longitude"
              aria-readonly="true"
              className={coordinateInputClass}
              disabled
              inputMode="decimal"
              max="180"
              min="-180"
              placeholder="Lng"
              readOnly
              step="any"
              type="number"
              value={lngStr}
            />
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-photo"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Visual Memory
        </label>
        <label
          className={`relative aspect-video w-full overflow-hidden rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${uiTheme.uploadHoverClass}`}
          style={{
            background: uiTheme.uploadSurface,
            borderColor: uiTheme.border,
            color: isDark ? "rgba(213,202,193,0.72)" : "#6f625b",
          }}
        >
          {displayPhoto ? (
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              src={displayPhoto}
            />
          ) : null}
          {!displayPhoto && (
            <span className="relative z-[1] material-symbols-outlined text-xl text-[#e8845a]">
              add_a_photo
            </span>
          )}
          <span className={`relative z-[1] text-[11px] font-semibold ${displayPhoto ? "text-white drop-shadow" : ""}`}>
            {displayPhoto ? "Tap to replace" : "Upload Photo"}
          </span>
          {!displayPhoto && (
            <span className="relative z-[1] text-[10px] opacity-70">JPG, PNG, or WebP</span>
          )}
          <input
            accept="image/*"
            className="absolute inset-0 z-[2] cursor-pointer opacity-0"
            id="memory-photo"
            name="photo"
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoPreview((prev) => {
                if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
                return URL.createObjectURL(f);
              });
            }}
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.14em] font-bold block"
          style={labelStyle}
        >
          Resonating Sound
        </span>
        {draft?.spotifyTrackId ? (
          <div
            className="flex items-center gap-2 rounded-[14px] border px-2.5 py-2"
            style={{ background: uiTheme.fieldSurface, borderColor: uiTheme.border }}
          >
            {draft.trackImageUrl ? (
              <img
                alt=""
                className="h-10 w-10 shrink-0 rounded-md object-cover"
                src={draft.trackImageUrl}
              />
            ) : (
              <span className="material-symbols-outlined text-[#e8845a] shrink-0">album</span>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="text-[12px] font-semibold truncate"
                style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
              >
                {draft.track || "Track"}
              </div>
              <div className="text-[10px] truncate opacity-75">{draft.artist || "Artist"}</div>
            </div>
            <button
              className="shrink-0 rounded-lg border px-2 py-1 text-[10px] cursor-pointer"
              style={{ borderColor: uiTheme.border, color: uiTheme.textMuted }}
              type="button"
              onClick={() => onLibraryTrackPick(null)}
            >
              Clear
            </button>
          </div>
        ) : null}
        <input
          key={`hid-track-${draft?.spotifyTrackId ?? ""}-${draft?.track ?? ""}`}
          defaultValue={draft?.track ?? ""}
          name="track"
          type="hidden"
        />
        <input
          key={`hid-artist-${draft?.spotifyTrackId ?? ""}-${draft?.artist ?? ""}`}
          defaultValue={draft?.artist ?? ""}
          name="artist"
          type="hidden"
        />
        <button
          className="w-full rounded-[14px] border px-3 py-2.5 flex items-center justify-center gap-2 text-[12px] font-semibold cursor-pointer transition-colors"
          style={{
            background: uiTheme.fieldSurface,
            borderColor: uiTheme.border,
            color: isDark ? "#f4eee8" : "#2f2723",
          }}
          type="button"
          onClick={() => setLibOpen((o) => !o)}
        >
          <span className="material-symbols-outlined text-lg text-[#e8845a]">library_music</span>
          {draft?.spotifyTrackId ? "Change track from library" : "Choose from my library"}
        </button>
        {libOpen && (
          <div
            className="rounded-[14px] border overflow-hidden flex flex-col max-h-56"
            style={{ borderColor: uiTheme.border, background: uiTheme.drawerSurface }}
          >
            <input
              aria-label="Filter library"
              className={`${inputClass} px-3 py-2 border-b`}
              placeholder="Filter saved tracks…"
              style={{
                ...fieldStyle,
                borderBottom: `1px solid ${uiTheme.border}`,
                borderRadius: 0,
              }}
              value={libFilter}
              onChange={(e) => setLibFilter(e.target.value)}
            />
            <div className="overflow-y-auto min-h-0 flex-1">
              {libLoading ? (
                <p className="px-3 py-2 text-[11px] m-0" style={{ color: uiTheme.textMuted }}>
                  Loading your library…
                </p>
              ) : filteredLibTracks.length === 0 ? (
                <p className="px-3 py-2 text-[11px] m-0" style={{ color: uiTheme.textMuted }}>
                  No saved tracks yet. Save songs from the music player, then return here.
                </p>
              ) : (
                filteredLibTracks.map((t) => (
                  <button
                    key={t.spotifyTrackId}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 cursor-pointer border-none"
                    style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
                    type="button"
                    onClick={() => {
                      onLibraryTrackPick(t);
                      setLibOpen(false);
                    }}
                  >
                    {t.imageUrl ? (
                      <img alt="" className="h-8 w-8 rounded object-cover shrink-0" src={t.imageUrl} />
                    ) : (
                      <span className="material-symbols-outlined text-[#e8845a] shrink-0 text-xl">
                        music_note
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium truncate">{t.trackName}</span>
                      <span className="block text-[10px] opacity-75 truncate">{t.artistNames}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-story"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          The Story
        </label>
        <textarea
          className={`w-full border rounded-[14px] p-3 text-[13px] focus:ring-1 focus:ring-[#e8845a]/45 focus:border-[#e8845a]/45 resize-none outline-none ${
            isDark
              ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
              : "text-[#2f2723] placeholder:text-[#6f625b]/55"
          }`}
          id="memory-story"
          name="story"
          onChange={(e) => setStoryStr(e.target.value)}
          placeholder="Describe the atmosphere..."
          rows={isMobile ? 3 : 4}
          style={fieldStyle}
          value={storyStr}
        />
      </div>
    </form>
  );
}
