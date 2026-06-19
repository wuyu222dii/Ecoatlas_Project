import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  getToken,
  libraryApi,
  spotifyApi,
} from "@/lib/api";
import { generatePkcePair, spotifyRedirectUri } from "@/lib/auth/pkce";
import { CURATED_TRACK_IDS } from "@/lib/spotifyCuratedTracks";
import { UserAvatar } from "@/components/common/UserAvatar";
import { AIChat } from "./AIChat";
import { CFG, CSS, HEADPHONES_MODE_OPTIONS, HEADPHONES_MODE_VARIANTS, IC, REFRESH_SEARCH_VARIANTS, imgFavorites } from "./constants";
import { TrackList } from "./TrackList";
import type { AiSessionState, HeadphonesListeningMode, PlayerType, RepeatMode, TabKey, UiTrack } from "./types";
import {
  createInitialAiSession,
  getCuratedCache,
  mergeTracksUnique,
  pickDefaultCurrentFromMainList,
  readHeadphonesMode,
  persistHeadphonesMode,
  rotateStrings,
  savedToUi,
  setCuratedCache,
  spotifyToUi,
} from "./utils";

export type { PlayerType } from "./types";

function MusicPlayer({
  onClose,
  playerType = "study",
  userName,
  avatarUrl,
}: {
  onClose: () => void;
  playerType?: PlayerType;
  userName?: string;
  avatarUrl?: string | null;
}) {
  const cfg = CFG[playerType];
  const { accent, accentB } = cfg;

  const token = getToken();
  const [favTracks, setFavTracks] = useState<UiTrack[]>([]);
  const [mainTracks, setMainTracks] = useState<UiTrack[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [spotifyLinked, setSpotifyLinked] = useState<boolean | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const [loadingMain, setLoadingMain] = useState(false);
  const [current, setCurrent] = useState<UiTrack | null>(null);
  const [tab, setTab] = useState<TabKey>("main");
  const [aiByPlayer, setAiByPlayer] = useState<Record<PlayerType, AiSessionState>>(() => ({
    study: createInitialAiSession(),
    party: createInitialAiSession(),
    sports: createInitialAiSession(),
    headphones: createInitialAiSession(),
  }));
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [shuffle, setShuffle] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [mainAppliedQuery, setMainAppliedQuery] = useState("");
  const [embedReload, setEmbedReload] = useState(0);
  const tabRef = useRef<TabKey>(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  const [headphonesMode, setHeadphonesMode] = useState<HeadphonesListeningMode>(() => readHeadphonesMode());
  const [listeningStyleOpen, setListeningStyleOpen] = useState(false);
  const listeningStyleWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listeningStyleOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = listeningStyleWrapRef.current;
      if (el && !el.contains(e.target as Node)) setListeningStyleOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [listeningStyleOpen]);

  const patchAiSession = useCallback(
    (pt: PlayerType, patch: Partial<AiSessionState> | ((prev: AiSessionState) => AiSessionState)) => {
      setAiByPlayer(prevAll => {
        const cur = prevAll[pt];
        const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
        return { ...prevAll, [pt]: next };
      });
    }, [],
  );

  const skipCuratedOnceRef = useRef(false);
  const cycleRepeat = () => setRepeat(r => (r === "none" ? "all" : r === "all" ? "one" : "none"));

  const reloadLibrary = useCallback(async () => {
    if (!token) return;
    setLoadingLib(true);
    try {
      const res = await libraryApi.list(token, { page: 0, size: 100 });
      const ids = new Set<string>();
      const tracks = (res.data.content ?? []).map(s => { ids.add(s.spotifyTrackId); return savedToUi(s, true); });
      setLikedIds(ids); setFavTracks(tracks);
    } catch (e) { setLoadErr(e instanceof Error ? e.message : "Failed to load library."); }
    finally { setLoadingLib(false); }
  }, [token]);

  const applyMainTracks = useCallback((tracks: UiTrack[], opts?: { forceFirst?: boolean }) => {
    setMainTracks(tracks); setSpotifyLinked(true);
    setCurrent(prev => {
      if (tabRef.current !== "main") return prev;
      if (opts?.forceFirst) return tracks[0] ?? null;
      if (prev != null) return prev;
      return pickDefaultCurrentFromMainList(tracks, null);
    });
  }, []);

  const refreshMainNonceRef = useRef(0);
  /** Blocks main-tab hydrate from re-applying stale cache while a refresh fetch is running. */
  const refreshMainInFlightRef = useRef(false);

  const refreshMainPlaylist = useCallback(async (pickedHeadphonesMode?: HeadphonesListeningMode) => {
    if (!token) return;
    refreshMainNonceRef.current += 1;
    const n = refreshMainNonceRef.current;
    const hMode = pickedHeadphonesMode ?? headphonesMode;
    const variants: readonly string[] =
      playerType === "headphones"
        ? HEADPHONES_MODE_VARIANTS[hMode]
        : REFRESH_SEARCH_VARIANTS[playerType];
    const query = variants[n % variants.length] ?? cfg.searchQuery;
    refreshMainInFlightRef.current = true;
    setLoadingMain(true);
    setLoadErr(null);
    setMainAppliedQuery("");
    setSearchInput("");
    try {
      const res = await spotifyApi.search(token, { query, limit: 10 });
      let tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
      const curatedIds = rotateStrings([...CURATED_TRACK_IDS[playerType]], n).slice(0, 8);
      const batch = await spotifyApi.tracksByIds(token, { ids: curatedIds });
      const extra = (batch.data.tracks ?? []).map(t => spotifyToUi(t, false));
      tracks = mergeTracksUnique(tracks, extra).slice(0, 12);
      tracks = tracks.map(t => ({ ...t, liked: likedIds.has(t.id) }));
      setCuratedCache(playerType, tracks, {
        refreshPinned: true,
        ...(playerType === "headphones" ? { headphonesListeningMode: hMode } : {}),
      });
      applyMainTracks(tracks, { forceFirst: true });
      if (tracks.length) setEmbedReload(r => r + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not refresh playlist.";
      setLoadErr(msg);
      if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
      else setSpotifyLinked(null);
    } finally {
      refreshMainInFlightRef.current = false;
      setLoadingMain(false);
    }
  }, [token, playerType, cfg.searchQuery, likedIds, applyMainTracks, headphonesMode]);

  const loadCuratedMain = useCallback(async (opts?: { silent?: boolean }) => {
    if (!token) return;
    if (!opts?.silent) {
      setLoadingMain(true);
      setLoadErr(null);
    }
    const fallbackSearch = async () => {
      const qBase =
        playerType === "headphones"
          ? HEADPHONES_MODE_VARIANTS[headphonesMode][0]!
          : cfg.searchQuery;
      const fb = await spotifyApi.search(token, { query: qBase, limit: 10 });
      return (fb.data.tracks ?? []).map(t => spotifyToUi(t, false));
    };
    try {
      const ids = [...CURATED_TRACK_IDS[playerType]];
      const res = await spotifyApi.tracksByIds(token, { ids });
      let tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
      if (tracks.length === 0) { tracks = await fallbackSearch(); }
      else if (tracks.length < 3) { const extra = await fallbackSearch(); tracks = mergeTracksUnique(tracks, extra).slice(0, 12); }
      setCuratedCache(playerType, tracks, {
        refreshPinned: false,
        ...(playerType === "headphones" ? { headphonesListeningMode: headphonesMode } : {}),
      });
      applyMainTracks(tracks);
    } catch {
      try {
        const tracks = await fallbackSearch();
        applyMainTracks(tracks);
        setCuratedCache(playerType, tracks, {
          refreshPinned: false,
          ...(playerType === "headphones" ? { headphonesListeningMode: headphonesMode } : {}),
        });
      }
      catch (e2) {
        const msg = e2 instanceof Error ? e2.message : "Failed to load recommended tracks.";
        setLoadErr(msg);
        if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
        else setSpotifyLinked(null);
      }
    } finally {
      if (!opts?.silent) {
        setLoadingMain(false);
      }
    }
  }, [token, playerType, cfg.searchQuery, applyMainTracks, headphonesMode]);

  const prefetchCuratedForType = useCallback(
    async (pt: PlayerType) => {
      if (!token) return;
      if ((getCuratedCache(pt)?.tracks.length ?? 0) > 0) return;
      const fallbackSearch = async () => {
        const qFb =
          pt === "headphones"
            ? HEADPHONES_MODE_VARIANTS[readHeadphonesMode()][0]!
            : CFG[pt].searchQuery;
        const fb = await spotifyApi.search(token, { query: qFb, limit: 10 });
        return (fb.data.tracks ?? []).map((t) => spotifyToUi(t, false));
      };
      try {
        const ids = [...CURATED_TRACK_IDS[pt]];
        const res = await spotifyApi.tracksByIds(token, { ids });
        let tracks = (res.data.tracks ?? []).map((t) => spotifyToUi(t, false));
        if (tracks.length === 0) tracks = await fallbackSearch();
        else if (tracks.length < 3) {
          const extra = await fallbackSearch();
          tracks = mergeTracksUnique(tracks, extra).slice(0, 12);
        }
        setCuratedCache(pt, tracks, {
          refreshPinned: false,
          ...(pt === "headphones" ? { headphonesListeningMode: readHeadphonesMode() } : {}),
        });
      } catch {
        try {
          const tracks = await fallbackSearch();
          setCuratedCache(pt, tracks, {
            refreshPinned: false,
            ...(pt === "headphones" ? { headphonesListeningMode: readHeadphonesMode() } : {}),
          });
        } catch {
          // Best-effort prefetch; ignore background failures.
        }
      }
    },
    [token],
  );

  useEffect(() => { if (!token) return; void reloadLibrary(); }, [token, reloadLibrary]);
  useEffect(() => {
    if (!token) return;
    void prefetchCuratedForType("study");
    void prefetchCuratedForType("party");
    void prefetchCuratedForType("sports");
    void prefetchCuratedForType("headphones");
  }, [token, prefetchCuratedForType]);
  useEffect(() => { setSearchInput(""); setMainAppliedQuery(""); setCurrent(null); }, [playerType]);

  useEffect(() => {
    if (!token || tab !== "main") return;
    const q = mainAppliedQuery.trim();
    const handle = window.setTimeout(async () => {
      if (!q) {
        if (skipCuratedOnceRef.current) { skipCuratedOnceRef.current = false; return; }
        if (refreshMainInFlightRef.current) return;
        const cached = getCuratedCache(playerType);
        const cachedTracks = cached?.tracks ?? [];
        if (cachedTracks.length > 0) {
          if (playerType === "headphones" && cached?.headphonesListeningMode !== headphonesMode) {
            await loadCuratedMain();
            return;
          }
          applyMainTracks(cachedTracks);
          setLoadingMain(false);
          setSpotifyLinked(true);
          return;
        }
        await loadCuratedMain();
        return;
      }
      setLoadingMain(true); setLoadErr(null);
      try {
        const res = await spotifyApi.search(token, { query: q, limit: 10 });
        const tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
        applyMainTracks(tracks);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Search failed.";
        setLoadErr(msg);
        if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
        else setSpotifyLinked(null);
      } finally { setLoadingMain(false); }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [token, tab, playerType, mainAppliedQuery, loadCuratedMain, applyMainTracks, headphonesMode]);

  useEffect(() => {
    setMainTracks(prev => prev.map(t => ({ ...t, liked: likedIds.has(t.id) })));
    setFavTracks(prev => prev.map(t => ({ ...t, liked: likedIds.has(t.id) })));
    setCurrent(prev => (prev ? { ...prev, liked: likedIds.has(prev.id) } : null));
  }, [likedIds]);

  const connectSpotify = async () => {
    if (!token) return;
    if (window.location.hostname === "localhost") {
      setLoadErr("Spotify cannot use localhost as a redirect URI. Open this site at http://127.0.0.1:5173, sign in, then use Connect Spotify.");
      return;
    }
    const { verifier, challenge } = await generatePkcePair();
    sessionStorage.setItem("spotify_pkce_verifier", verifier);
    const res = await spotifyApi.authorizeUrl(token, { redirectUri: spotifyRedirectUri(), codeChallenge: challenge, codeChallengeMethod: "S256" });
    window.location.href = res.data.authorizeUrl;
  };

  const toggleLike = async (t: UiTrack) => {
    if (!token) { setLoadErr("Please sign in first."); return; }
    try {
      if (!t.liked) await libraryApi.save(token, { spotifyTrackId: t.id, source: "SEARCH" });
      else await libraryApi.remove(token, { spotifyTrackId: t.id });
      await reloadLibrary();
    } catch (e) { setLoadErr(e instanceof Error ? e.message : "Library action failed."); }
  };

  const filteredFavorites = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return favTracks;
    return favTracks.filter(t => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [searchInput, favTracks]);

  /** Prev/next only walk the playlist for the active sidebar tab (favorites ≠ scene list). */
  const skipListBase = useMemo(() => {
    if (tab === "favorites") return filteredFavorites;
    if (tab === "main") return mainTracks;
    if (tab === "ai") return mainTracks.length > 0 ? mainTracks : filteredFavorites;
    return [];
  }, [tab, filteredFavorites, mainTracks]);

  const commitMainSearch = useCallback(() => { setMainAppliedQuery(searchInput.trim()); }, [searchInput]);
  const switchTab = useCallback((k: TabKey) => { setSearchInput(""); setMainAppliedQuery(""); setTab(k); }, []);

  const skipPrev = useCallback(() => {
    if (!current) return;
    const list = shuffle ? [...skipListBase].sort(() => Math.random() - 0.5) : skipListBase;
    if (!list.length) return;
    const i = list.findIndex(t => t.id === current.id);
    if (i < 0) {
      setCurrent(list[list.length - 1]!);
      setEmbedReload(r => r + 1);
      return;
    }
    if (i > 0) setCurrent(list[i - 1]!);
    else if (repeat === "all" && list.length) setCurrent(list[list.length - 1]!);
  }, [current, skipListBase, shuffle, repeat]);

  const skipNext = useCallback(() => {
    if (!current) return;
    const list = shuffle ? [...skipListBase].sort(() => Math.random() - 0.5) : skipListBase;
    if (!list.length) return;
    if (repeat === "one") {
      setEmbedReload(r => r + 1);
      return;
    }
    const i = list.findIndex(t => t.id === current.id);
    if (i < 0) {
      setCurrent(list[0]!);
      setEmbedReload(r => r + 1);
      return;
    }
    if (i < list.length - 1) setCurrent(list[i + 1]!);
    else if (repeat === "all" && list.length) setCurrent(list[0]!);
  }, [current, skipListBase, shuffle, repeat]);

  const dc = "rgba(0,0,0,0.5)";
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "favorites", label: "My Favorites", icon: IC.heart() },
    { key: "main", label: cfg.mainLabel, icon: IC.book() },
    { key: "ai", label: "AI Music", icon: <span style={{ display: "flex" }}>{IC.musicSm()}</span> },
  ];

  const appendMain = (tracks: UiTrack[]) => {
    skipCuratedOnceRef.current = true;
    setSearchInput(""); setMainAppliedQuery("");
    setMainTracks(prev => {
      const existing = new Set(prev.map(p => p.id));
      const merged = [...prev];
      for (const t of tracks) {
        if (!existing.has(t.id)) { existing.add(t.id); merged.push({ ...t, liked: likedIds.has(t.id) }); }
      }
      return merged;
    });
    setTab("main");
  };

  const playAllFav = () => {
    if (!filteredFavorites.length) return;
    setCurrent(filteredFavorites[0]!);
    setEmbedReload(r => r + 1);
  };
  const pickHeadphonesListeningMode = useCallback(
    (mode: HeadphonesListeningMode) => {
      setListeningStyleOpen(false);
      if (mode === headphonesMode) return;
      setHeadphonesMode(mode);
      persistHeadphonesMode(mode);
      void refreshMainPlaylist(mode);
    },
    [headphonesMode, refreshMainPlaylist],
  );
  const selectTrack = (t: UiTrack) => { setCurrent(t); };

  const safeCurrent: UiTrack = current ?? ({ id: "_", name: "—", artist: "—", dur: "0:00", color: accent, liked: false } as UiTrack);

  return (
    <div className="mp mp-overlay">
      <style>{CSS}</style>
      <div className="mp-panel">
        {/* Top bar — no bottom border */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "10px 13px" }}>
          {(tab === "main" || tab === "favorites") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 20, overflow: "hidden" }}>
                <input className="mp-search-in" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (tab === "main" && e.key === "Enter") { e.preventDefault(); commitMainSearch(); } }}
                  placeholder={tab === "main" ? "Search music…" : "Filter my favorites…"}
                  style={{ paddingLeft: 10, paddingRight: 9, paddingTop: 6, paddingBottom: 6, background: "transparent", border: "none", color: "#1a1a1a", fontSize: 13, width: 200 }} />
                <button type="button" className="mp-btn" title="Search"
                  onClick={() => { if (tab === "main") commitMainSearch(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${accent}66,${accentB}44)`, border: "none", borderLeft: `1px solid ${accent}55`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {IC.search()}
                </button>
              </div>
              {token && tab === "main" && playerType === "headphones" && (
                <div ref={listeningStyleWrapRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="mp-btn"
                    aria-haspopup="listbox"
                    aria-expanded={listeningStyleOpen}
                    title="Listening style"
                    disabled={loadingMain}
                    onClick={() => setListeningStyleOpen(o => !o)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: listeningStyleOpen
                        ? `linear-gradient(135deg,${accent}88,${accentB}77)`
                        : `linear-gradient(135deg,${accent}66,${accentB}44)`,
                      border: `1px solid ${accent}55`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      cursor: loadingMain ? "wait" : "pointer",
                      opacity: loadingMain ? 0.72 : 1,
                      boxShadow: listeningStyleOpen ? `0 0 14px ${accent}55` : "none",
                    }}
                  >
                    {IC.sliders()}
                  </button>
                  {listeningStyleOpen && (
                    <div
                      role="listbox"
                      aria-label="Listening style"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        zIndex: 30,
                        minWidth: 220,
                        padding: "8px 0",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.95)",
                        border: `1px solid rgba(125,85,68,0.35)`,
                        boxShadow: "0 8px 28px rgba(45,28,22,0.16)",
                      }}
                    >
                      <div style={{ padding: "4px 12px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                        Listening style
                      </div>
                      {HEADPHONES_MODE_OPTIONS.map(({ mode, label }) => {
                        const active = mode === headphonesMode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => pickHeadphonesListeningMode(mode)}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 14px",
                              fontSize: 13,
                              fontWeight: active ? 600 : 400,
                              color: "#1a1a1a",
                              border: "none",
                              cursor: "pointer",
                              background: active ? `${accent}22` : "transparent",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button type="button" className="mp-btn" onClick={onClose} aria-label="Close"
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.6)", fontSize: 14, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {!token && (
          <div style={{ padding: "10px 16px", background: "rgba(180,60,60,0.15)", fontSize: 12, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            Not signed in: use the keypad to log in before favorites and AI.
          </div>
        )}
        {token && spotifyLinked === false && (
          <div style={{ padding: "10px 16px", background: "rgba(30,120,200,0.15)", fontSize: 12, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>After connecting Spotify you can search and add AI recommendations.</span>
            <button type="button" onClick={() => void connectSpotify()}
              style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, background: `linear-gradient(135deg,${accent},${accentB})`, color: "#fff" }}>
              Connect Spotify
            </button>
          </div>
        )}
        {loadErr && (
          <div style={{ padding: "8px 16px", fontSize: 11, color: "rgba(160,40,40,0.9)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{loadErr}</div>
        )}
        {loadErr && spotifyLinked === null && (
          <div style={{ padding: "0 16px 8px", fontSize: 10, lineHeight: 1.45, color: "rgba(0,0,0,0.42)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            Note: after Spotify authorization, the blue Connect Spotify bar hides. Red text here means a search or list request failed.
          </div>
        )}

        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <div className="mp-sidebar">
            <div style={{ textAlign: "center", paddingBottom: 18, borderBottom: "1px solid rgba(0,0,0,0.1)", marginBottom: 12 }}>
              <div style={{ margin: "0 auto 10px", width: 62 }}>
                <UserAvatar avatarUrl={avatarUrl} name={userName} size={62} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{userName?.trim() || "six cookies"}</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", marginTop: 2, letterSpacing: "0.06em" }}>Focus · Enjoy · Flow</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
              {tabs.map(({ key, label, icon }) => {
                const isActive = tab === key;
                return (
                  <div key={key} className={`mp-nav${isActive ? " active" : ""}`} onClick={() => switchTab(key)}
                    style={isActive ? { background: `linear-gradient(135deg,${accent}30,${accentB}1a)`, borderColor: `${accent}60`, boxShadow: `0 0 16px ${accent}33, 0 0 28px ${accent}18, inset 0 1px 0 rgba(255,255,255,0.12)` } : {}}>
                    <span style={{ color: isActive ? accent : dc, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 14, color: isActive ? "#1a1a1a" : "rgba(0,0,0,0.5)", fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", color: "rgba(0,0,0,0.15)", paddingTop: 4 }}>{IC.music()}</div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {tab === "favorites" && (
              <TrackList key="fav" tracks={filteredFavorites} title="My Favorites"
                desc="Your saved tracks, ready to play anytime."
                duration={loadingLib ? "Loading…" : searchInput.trim() ? `Showing ${filteredFavorites.length} of ${favTracks.length} tracks` : `${favTracks.length} saved`}
                accent={accent} accentB={accentB} grad={`linear-gradient(135deg,${accent}88,${accentB}66)`}
                cover={imgFavorites} currentId={safeCurrent.id} onSelect={selectTrack}
                onToggleLike={t => void toggleLike(t)}
                primaryLabel="Play all" primaryIcon={IC.play()} onPrimaryAction={playAllFav}
                primaryDisabled={!filteredFavorites.length || !token} />
            )}
            {tab === "main" && (
              <TrackList key="main" tracks={mainTracks} title={cfg.title}
                desc={
                  loadingMain
                    ? cfg.loadingDesc
                    : mainAppliedQuery.trim()
                      ? `Search results for "${mainAppliedQuery.trim()}"`
                      : playerType === "headphones"
                        ? `Mode — ${
                          HEADPHONES_MODE_OPTIONS.find(o => o.mode === headphonesMode)?.label ?? headphonesMode
                        }. ${cfg.desc}`
                        : cfg.desc
                }
                duration={loadingMain ? "…" : cfg.dur}
                accent={accent} accentB={accentB} grad={cfg.grad}
                cover={cfg.cover}
                coverObjectFit="cover"
                coverPad={0}
                currentId={safeCurrent.id} onSelect={selectTrack}
                onToggleLike={t => void toggleLike(t)}
                primaryLabel="Refresh picks" primaryIcon={IC.refresh()} onPrimaryAction={() => void refreshMainPlaylist()}
                primaryDisabled={loadingMain || !token} />
            )}
            {tab === "ai" && (
              <AIChat accent={accent} accentB={accentB} pageScene={cfg.pageScene} spotifyLinked={spotifyLinked === true}
                token={token} session={aiByPlayer[playerType]} playerType={playerType} patchAiSession={patchAiSession}
                onAppendTracks={appendMain} onSwitchMain={() => switchTab("main")} />
            )}
          </div>
        </div>

        {/* Bottom player bar */}
        <div style={{ padding: "0 10px 8px", flexShrink: 0 }}>
          {safeCurrent.id !== "_" && (
            <div id="mp-spotify-embed" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 14, background: "rgba(255,255,255,0.35)", border: `1px solid ${accent}44`, boxShadow: `0 0 12px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.3)`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", minHeight: 0 }}>
              {/* Controls: 2 rows — row1: heart, shuffle, repeat | row2: prev, next */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, width: 90, flexShrink: 0, paddingRight: 8, marginRight: 4, borderRight: "1px solid rgba(0,0,0,0.1)" }}>
                {/* Row 1 */}
                <button type="button" className="mp-btn" aria-pressed={safeCurrent.liked} onClick={() => void toggleLike(safeCurrent)}
                  title={safeCurrent.liked ? "Saved — click to remove" : "Save to library"}
                  style={{ flexShrink: 0, padding: 6, margin: -6, borderRadius: "50%", color: safeCurrent.liked ? accent : "rgba(0,0,0,0.35)", background: safeCurrent.liked ? `${accent}26` : "transparent", boxShadow: safeCurrent.liked ? `0 0 12px ${accent}77, inset 0 0 0 1px ${accent}55` : "none", transition: "background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease" }}>
                  {IC.heart(safeCurrent.liked)}
                </button>
                <button type="button" className="mp-btn" onClick={() => setShuffle(!shuffle)} style={{ color: shuffle ? accent : dc, position: "relative", flexShrink: 0 }} title="Shuffle">
                  {IC.shuffle()}
                  {shuffle && <span style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: accent }} />}
                </button>
                <button type="button" className="mp-btn" onClick={cycleRepeat} style={{ color: repeat !== "none" ? accent : dc, position: "relative", flexShrink: 0 }} title="Repeat">
                  {repeat === "one" ? IC.repeatOne() : IC.repeat()}
                  {repeat !== "none" && <span style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: accent }} />}
                </button>
                {/* Row 2 */}
                <button type="button" className="mp-btn" onClick={skipPrev} style={{ color: "rgba(0,0,0,0.55)", flexShrink: 0 }} title="Previous">{IC.prev()}</button>
                <button type="button" className="mp-btn" onClick={skipNext} style={{ color: "rgba(0,0,0,0.55)", flexShrink: 0 }} title="Next">{IC.next()}</button>
              </div>
              {/* Spotify embed */}
              <div style={{ flex: 1, minWidth: 120, borderRadius: 10, overflow: "hidden", lineHeight: 0 }}>
                <iframe
                  key={`${safeCurrent.id}-${embedReload}`}
                  title="Spotify"
                  src={`https://open.spotify.com/embed/track/${safeCurrent.id}?utm_source=echo`}
                  width="100%" height={88}
                  style={{ border: 0, display: "block", width: "100%", height: 88, maxWidth: "100%" }}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy" referrerPolicy="origin-when-cross-origin"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
