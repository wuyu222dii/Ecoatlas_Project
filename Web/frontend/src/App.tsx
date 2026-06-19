import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import monitorWallpaper from "./assets/monitor-wallpaper.jpg";
import scene from "./assets/door-scene.png";
import door from "./assets/door-only.png";
import desktopDay from "./assets/desktop.png";
import desktopNight from "./assets/desktop-night.png";
import partyHat from "./assets/party-hat.png";
import tennisBall from "./assets/tennis-ball.png";
import bookClose from "./assets/book-close.png";
import bookOpen from "./assets/book-open.png";
import globeImg from "./assets/globe.png";
import headphonesImg from "./assets/headphones.png";
import LoginPanel from "./components/LoginPanel";
import MusicPlayer from "./components/MusicPlayer";
import type { PlayerType } from "./components/MusicPlayer";
import MonitorScreen from "./components/MonitorScreen";
import MapModal from "./components/MapModal";
import { PRESET_AVATARS, UserAvatar } from "./components/UserAvatar";
import {
  authApi,
  clearAuthUser,
  clearToken,
  getAuthUser,
  getToken,
  saveAuthUser,
  type AuthUser,
} from "./lib/api";

const IMG_W = 3833;
const IMG_H = 2157;
const IMG_RATIO = IMG_W / IMG_H;
const DOOR_SPEED = 1;
const SKIP_LOGIN = ["1", "true", "yes", "on"].includes(
  (import.meta.env.VITE_SKIP_LOGIN ?? "").toLowerCase(),
);

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="#FFD34D" />
      <g stroke="#FFD34D" strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.2" y1="5.2" x2="7" y2="7" />
        <line x1="17" y1="17" x2="18.8" y2="18.8" />
        <line x1="17" y1="7" x2="18.8" y2="5.2" />
        <line x1="5.2" y1="18.8" x2="7" y2="17" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.3 14.7C16.4 15.4 15.2 15.8 14 15.8C10.8 15.8 8.2 13.2 8.2 10C8.2 8.8 8.6 7.6 9.3 6.7C6.6 7.4 4.6 9.9 4.6 12.8C4.6 16.3 7.5 19.2 11 19.2C13.9 19.2 16.4 17.2 17.3 14.7Z"
        fill="#FFD34D"
        transform="translate(1.2 -0.8)"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.5 5.5H6.8C5.8 5.5 5 6.3 5 7.3v9.4c0 1 .8 1.8 1.8 1.8h3.7"
        stroke="#FFD34D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 8l4 4-4 4"
        stroke="#FFD34D"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 12H9"
        stroke="#FFD34D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

  function SettingsIcon() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
          stroke="#FFD34D"
          strokeWidth="1.8"
        />
        <path
          d="M19.4 15.1a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1 1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2a1.2 1.2 0 0 1-1.2 1.2h-1.6a1.2 1.2 0 0 1-1.2-1.2v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1-1a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.2a1.2 1.2 0 0 1-1.2-1.2v-1.6a1.2 1.2 0 0 1 1.2-1.2h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1-1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2h0a1 1 0 0 0 .7-.9v-.2A1.2 1.2 0 0 1 10.4 2h1.6a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9h0a1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1v0a1 1 0 0 0 .9.7h.2a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.6Z"
          stroke="#FFD34D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  type DeskItemKey = "hat" | "ball" | "globe" | "book";

  type DeskLayout = Record<
    DeskItemKey,
    {
      left: number;
      top: number;
    }
  >;

  const DESK_LAYOUT_STORAGE_KEY = "desk-layout-v1";

  const DEFAULT_DESK_LAYOUT: DeskLayout = {
    hat: { left: 14.8, top: 73.5 },
    ball: { left: 26.4, top: 84.2 },
    globe: { left: 69.8, top: 63.5 },
    book: { left: 80.5, top: 82.5 },
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);



export default function App() {
  const initialUnlocked = SKIP_LOGIN || Boolean(getToken());
  const [open, setOpen] = useState(initialUnlocked);
  const [flash, setFlash] = useState(initialUnlocked);
  const [showLogin, setShowLogin] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [playerType, setPlayerType] = useState<PlayerType>("study");
  const [hatTilt, setHatTilt] = useState(false);
  const [ballRoll, setBallRoll] = useState(false);
  const [bookOpened, setBookOpened] = useState(false);
  const [bookHover, setBookHover] = useState(false);
  const [globeActive, setGlobeActive] = useState(false);
  const [headphonesActive, setHeadphonesActive] = useState(false);
  const [monitorBg, setMonitorBg] = useState<string>(monitorWallpaper);
  const [monitorBgUrl, setMonitorBgUrl] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const settingsWrapRef = useRef<HTMLDivElement>(null);

  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [draggingItem, setDraggingItem] = useState<DeskItemKey | null>(null);

  const [deskLayout, setDeskLayout] = useState<DeskLayout>(() => {
    try {
      const saved = localStorage.getItem(DESK_LAYOUT_STORAGE_KEY);
      if (!saved) return DEFAULT_DESK_LAYOUT;
      return { ...DEFAULT_DESK_LAYOUT, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_DESK_LAYOUT;
    }
  });

  const sceneRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    key: DeskItemKey;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    itemWidth: number;
    itemHeight: number;
  } | null>(null);


  const getThemeByTime = (): "day" | "night" => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const [desktopTheme, setDesktopTheme] = useState<"day" | "night">(getThemeByTime);
  const [isAutoTheme, setIsAutoTheme] = useState(true);

  useEffect(() => {
    if (!isAutoTheme) return;
    const updateTheme = () => setDesktopTheme(getThemeByTime());
    updateTheme();
    const timer = setInterval(updateTheme, 60 * 1000);
    return () => clearInterval(timer);
  }, [isAutoTheme]);
  useEffect(() => {
    return () => {
      if (monitorBgUrl) {
        URL.revokeObjectURL(monitorBgUrl);
      }
    };
  }, [monitorBgUrl]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    void (async () => {
      try {
        const res = await authApi.me(token);
        setUser(res.data);
        saveAuthUser(res.data);
        setOpen(true);
        setFlash(true);
      } catch {
        // Token is invalid/expired: clear stale session and return to login flow.
        clearToken();
        clearAuthUser();
        setUser(null);
        setOpen(false);
        setFlash(false);
      }
    })();
  }, []);

  useEffect(() => {
  localStorage.setItem(DESK_LAYOUT_STORAGE_KEY, JSON.stringify(deskLayout));
}, [deskLayout]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const el = settingsWrapRef.current;
      if (!el) return;
      if (!el.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [settingsOpen]);

  const currentDesktop = desktopTheme === "day" ? desktopDay : desktopNight;

  const toggleDesktopTheme = () => {
    setIsAutoTheme(false);
    setDesktopTheme(prev => prev === "day" ? "night" : "day");
  };

  const handleKeypadClick = () => {
    if (open) return;
    setShowLogin(v => !v);
  };

  const handleLoginSuccess = (nextUser: AuthUser) => {
    setUser(nextUser);
    saveAuthUser(nextUser);
    setShowLogin(false);
    setOpen(true);
    setTimeout(() => setFlash(true), 800 * DOOR_SPEED);
  };

  const handleBookClick = () => {
    if (!flash || layoutEditMode) return;

    setBookOpened(true);
    setBookHover(false);
    setPlayerType("study");
    setShowPlayer(true);
  };

  const handleHatClick = () => {
    if (!flash || layoutEditMode) return;

    setHatTilt(true);
    setPlayerType("party");
    setShowPlayer(true);

    setTimeout(() => {
      setHatTilt(false);
    }, 700);
  };

  const handleBallClick = () => {
    if (!flash || layoutEditMode) return;

    setBallRoll(true);
    setPlayerType("sports");
    setShowPlayer(true);

    setTimeout(() => {
      setBallRoll(false);
    }, 900);
  };

  const handleGlobeClick = () => {
    if (!flash || layoutEditMode) return;

    setGlobeActive(true);
    setShowMap(true);

    setTimeout(() => {
      setGlobeActive(false);
    }, 1800);
  };

  const handleHeadphonesClick = () => {
    if (!flash) return;

    setHeadphonesActive(true);
    setPlayerType("headphones");
    setShowPlayer(true);

    setTimeout(() => {
      setHeadphonesActive(false);
    }, 900);
  };
  const handleClosePlayer = () => {
    setShowPlayer(false);

    setBookOpened(false);
    setBookHover(false);
    setHatTilt(false);
    setBallRoll(false);
    setHeadphonesActive(false);
  };

  const beginDeskDrag = (key: DeskItemKey, e: ReactPointerEvent<HTMLDivElement>) => {
  if (!layoutEditMode || !sceneRef.current) return;

  const sceneRect = sceneRef.current.getBoundingClientRect();
  const itemRect = e.currentTarget.getBoundingClientRect();

  dragRef.current = {
    key,
    startX: e.clientX,
    startY: e.clientY,
    startLeft: deskLayout[key].left,
    startTop: deskLayout[key].top,
    itemWidth: (itemRect.width / sceneRect.width) * 100,
    itemHeight: (itemRect.height / sceneRect.height) * 100,
  };

  setDraggingItem(key);
  e.currentTarget.setPointerCapture(e.pointerId);
  e.preventDefault();
};

  useEffect(() => {
    if (!layoutEditMode) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current || !sceneRef.current) return;

      const sceneRect = sceneRef.current.getBoundingClientRect();
      const drag = dragRef.current;

      const dx = ((e.clientX - drag.startX) / sceneRect.width) * 100;
      const dy = ((e.clientY - drag.startY) / sceneRect.height) * 100;

      setDeskLayout((prev) => ({
        ...prev,
        [drag.key]: {
          left: clamp(drag.startLeft + dx, 0, 100 - drag.itemWidth),
          top: clamp(drag.startTop + dy, 0, 100 - drag.itemHeight),
        },
      }));
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      setDraggingItem(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [layoutEditMode]);

  const handleMonitorBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (monitorBgUrl) {
      URL.revokeObjectURL(monitorBgUrl);
    }

    const url = URL.createObjectURL(file);
    setMonitorBg(url);
    setMonitorBgUrl(url);
  };



  const handleLogout = () => {
    clearToken();
    clearAuthUser();
    sessionStorage.removeItem("spotify_pkce_verifier");
    setSettingsOpen(false);
    setShowLogoutConfirm(false);
    setShowNameModal(false);
    setShowAvatarModal(false);
    setShowLogin(false);
    setShowPlayer(false);
    setShowMap(false);
    setOpen(false);
    setFlash(false);
    setBookOpened(false);
    setBookHover(false);
    setGlobeActive(false);
    setHatTilt(false);
    setBallRoll(false);
    setHeadphonesActive(false);
    setUser(null);
  };

  const openNameEditor = () => {
    setNameDraft(user?.name ?? "");
    setProfileError(null);
    setShowNameModal(true);
    setSettingsOpen(false);
  };

  const openAvatarEditor = () => {
    setProfileError(null);
    setShowAvatarModal(true);
    setSettingsOpen(false);
  };

  const handleSaveName = async () => {
    const token = getToken();
    if (!token) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await authApi.updateName(token, { name: nameDraft.trim() });
      setUser(res.data);
      saveAuthUser(res.data);
      setShowNameModal(false);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    const token = getToken();
    if (!token) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await authApi.updateAvatar(token, { avatarUrl });
      setUser(res.data);
      saveAuthUser(res.data);
      setShowAvatarModal(false);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update avatar");
    } finally {
      setSavingProfile(false);
    }
  };

  const showLocalhostSpotifyHint =
    import.meta.env.DEV && typeof window !== "undefined" && window.location.hostname === "localhost";

  return (
    // No overflow:hidden on root — lets position:fixed MusicPlayer escape
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>

      {showLocalhostSpotifyHint && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100001,
            background: "rgba(140,70,20,0.96)",
            color: "#fff",
            padding: "10px 14px",
            fontSize: 13,
            textAlign: "center",
            lineHeight: 1.45,
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          }}
        >
          Spotify does not allow <code style={{ color: "#ffe082" }}>localhost</code> as a redirect host, so you cannot add it in the Dashboard. For Connect Spotify use{" "}
          <a
            href={`http://127.0.0.1:${window.location.port || "5173"}${window.location.pathname}${window.location.search}`}
            style={{ color: "#ffecb3", fontWeight: 700 }}
          >
            http://127.0.0.1:{window.location.port || "5173"}
          </a>
          {" "}to open the site and sign in (this origin is not the same as localhost; sign in again if needed).
        </div>
      )}

      {/* Scene */}
        <div
          ref={sceneRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: "100%",
            minHeight: "100%",
            width: `max(100vw, calc(100vh * ${IMG_RATIO}))`,
            height: `max(100vh, calc(100vw / ${IMG_RATIO}))`,
            overflow: "hidden",
          }}
        >
        <img src={scene} alt="scene" style={{ width: "100%", height: "100%", display: "block", userSelect: "none", pointerEvents: "none" }} />

        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 39% 50%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.88) 14%, rgba(255,255,255,0.45) 28%, rgba(255,255,255,0.16) 42%, rgba(255,255,255,0) 58%)",
          opacity: open ? 1 : 0, transition: `opacity ${1.6 * DOOR_SPEED}s ease`,
          pointerEvents: "none", zIndex: 1, filter: "blur(6px)",
        }} />

        <div style={{ position: "absolute", inset: 0, perspective: 2200, zIndex: 3 }}>
          <div style={{
            position: "absolute", inset: 0, transformStyle: "preserve-3d",
            transformOrigin: "29.5% 50%",
            transform: open ? "rotateY(-102deg)" : "rotateY(0deg)",
            transition: `transform ${1.8 * DOOR_SPEED}s cubic-bezier(0.16, 1, 0.3, 1)`,
          }}>
            <img src={door} alt="door-back" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none", pointerEvents: "none", transform: "translateZ(-8px)", filter: "brightness(0.65)" }} />
            <div style={{ position: "absolute", left: "46.8%", top: "18.87%", width: "8px", height: "64.35%", background: "linear-gradient(to right, #5698AE, #3D7287, #2E5A68)", transformOrigin: "left center", transform: "rotateY(90deg)" }} />
            <img src={door} alt="door" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none", pointerEvents: "none", filter: open ? "drop-shadow(-24px 12px 28px rgba(0,0,0,0.35))" : "drop-shadow(0 0 0 rgba(0,0,0,0))", transition: `filter ${1.2 * DOOR_SPEED}s ease ${0.3 * DOOR_SPEED}s` }} />
          </div>
        </div>

        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 42% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 18%, rgba(255,255,255,0.92) 34%, rgba(255,255,255,0.62) 52%, rgba(255,255,255,0.18) 72%, rgba(255,255,255,0) 100%)",
          opacity: flash ? 1 : 0, transform: flash ? "scale(2.8)" : "scale(0.65)",
          transition: `opacity ${1 * DOOR_SPEED}s ease, transform ${1.1 * DOOR_SPEED}s ease`,
          pointerEvents: "none", zIndex: 4,
        }} />

        <img src={currentDesktop} alt="desktop" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: flash ? 1 : 0,
          transition: `opacity ${1.5 * DOOR_SPEED}s ease ${1.2 * DOOR_SPEED}s`,
          pointerEvents: "none", zIndex: 5,
        }} />

        <MonitorScreen
          theme={desktopTheme}
          visible={flash}
          backgroundImage={monitorBg}
          userName={user?.name}
          avatarUrl={user?.avatarUrl}
          onUploadBackground={handleMonitorBgUpload}
        />
        <div
          className={`headphones-hitbox ${flash ? "show-desk-item" : ""}`}
          onClick={handleHeadphonesClick}
          title="Open music"
        >
          <img
            src={headphonesImg}
            alt="wall mounted headphones"
            className={`headphones-item ${headphonesActive ? "headphones-clicked" : ""}`}
          />
        </div>

        <div
          className={`desk-draggable party-hat-wrap ${flash ? "desk-visible" : ""} ${layoutEditMode ? "layout-editing" : ""} ${draggingItem === "hat" ? "dragging" : ""}`}
          style={{
            left: `${deskLayout.hat.left}%`,
            top: `${deskLayout.hat.top}%`,
          }}
          onPointerDown={(e) => beginDeskDrag("hat", e)}
          onClick={handleHatClick}
        >
          <img
            src={partyHat}
            alt="party hat"
            className={`party-hat-item ${flash ? "show-desk-item" : ""} ${hatTilt ? "hat-tilt-click" : ""}`}
          />
        </div>

        <div
          className={`desk-draggable tennis-ball-wrap ${flash ? "desk-visible" : ""} ${layoutEditMode ? "layout-editing" : ""} ${draggingItem === "ball" ? "dragging" : ""}`}
          style={{
            left: `${deskLayout.ball.left}%`,
            top: `${deskLayout.ball.top}%`,
          }}
          onPointerDown={(e) => beginDeskDrag("ball", e)}
          onClick={handleBallClick}
        >
          <div className={`tennis-ball-hitbox ${flash ? "show-desk-item" : ""}`}>
            <img
              src={tennisBall}
              alt="tennis ball"
              className={`tennis-ball-item ${ballRoll ? "ball-roll-click" : ""}`}
            />
          </div>
        </div>

      <div
       className={`desk-draggable globe-box ${flash ? "desk-visible" : ""} ${draggingItem === "globe" ? "dragging" : ""}`}
        style={{
          left: `${deskLayout.globe.left}%`,
          top: `${deskLayout.globe.top}%`,
        }}
        onPointerDown={(e) => beginDeskDrag("globe", e)}
      >
        <div
          className={`globe-wrap ${flash ? "show-globe" : ""} ${globeActive ? "globe-active" : ""}`}
          onMouseEnter={() => flash && !layoutEditMode && setGlobeActive(true)}
          onMouseLeave={() => flash && !layoutEditMode && setGlobeActive(false)}
          onClick={handleGlobeClick}
        >
          <img src={globeImg} alt="globe" className="globe-item" />
          <span className="globe-star globe-star-1">✦</span>
          <span className="globe-star globe-star-2">✧</span>
          <span className="globe-star globe-star-3">✦</span>
          <span className="globe-star globe-star-4">✧</span>
          <span className="globe-star globe-star-5">✦</span>
          <span className="globe-star globe-star-6">✧</span>
          <span className="globe-star globe-star-7">✦</span>
          <span className="globe-star globe-star-8">✧</span>
          <span className="globe-star globe-star-9">✦</span>
          <span className="globe-star globe-star-10">✧</span>
        </div>
      </div>

        {/* After globe in DOM + z-index 22 so clicks hit the book, not the globe wrapper */}
        <div
          className={`desk-draggable book-wrap ${flash ? "desk-visible" : ""} ${layoutEditMode ? "layout-editing" : ""} ${draggingItem === "book" ? "dragging" : ""}`}
          style={{
            left: `${deskLayout.book.left}%`,
            top: `${deskLayout.book.top}%`,
          }}
          onPointerDown={(e) => beginDeskDrag("book", e)}
          onMouseEnter={() => flash && !layoutEditMode && setBookHover(true)}
          onMouseLeave={() => !layoutEditMode && !bookOpened && setBookHover(false)}
          onClick={handleBookClick}
        >
          {/* Hit target is this wrap (fixed % size). The img shrinks/opens on hover — if events were on the img, bbox changes caused mouseleave/enter flicker and blocked other desks. */}
          <img
            src={bookOpened || bookHover ? bookOpen : bookClose}
            alt={bookOpened || bookHover ? "open book" : "closed book"}
            className={`book-item ${flash ? "show-desk-item" : ""} ${bookOpened || bookHover ? "book-opened" : ""}`}
          />
        </div>

        <div className={`settings-wrap ${flash ? "show-settings" : ""}`} ref={settingsWrapRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Open settings"
            className="settings-btn"
            title="Settings"
          >
            <SettingsIcon />
          </button>
          {settingsOpen && (
            <div className="settings-menu">
              <button type="button" className="settings-item" onClick={() => { toggleDesktopTheme(); setSettingsOpen(false); }}>
                {desktopTheme === "day" ? <MoonIcon /> : <SunIcon />}
                <span>{desktopTheme === "day" ? "Switch to night" : "Switch to day"}</span>
              </button>
              <button
                type="button"
                className="settings-item"
                onClick={() => {
                  setLayoutEditMode((v) => !v);
                  setSettingsOpen(false);
                }}
              >
                <span style={{ width: 24, textAlign: "center" }}>🧩</span>
                <span>{layoutEditMode ? "Done layout" : "Edit layout"}</span>
              </button>

              <button
                type="button"
                className="settings-item"
                onClick={() => {
                  setDeskLayout(DEFAULT_DESK_LAYOUT);
                  setSettingsOpen(false);
                }}
              >
                <span style={{ width: 24, textAlign: "center" }}>↩️</span>
                <span>Reset layout</span>
              </button>
              <button type="button" className="settings-item" onClick={openNameEditor}>
                <span style={{ width: 24, textAlign: "center" }}>✏️</span>
                <span>Edit name</span>
              </button>
              <button type="button" className="settings-item" onClick={openAvatarEditor}>
                <span style={{ width: 24, textAlign: "center" }}>🖼️</span>
                <span>Edit avatar</span>
              </button>
              <button
                type="button"
                className="settings-item settings-item-danger"
                onClick={() => {
                  setSettingsOpen(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <LogoutIcon />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

        <button onClick={handleKeypadClick} aria-label="Open door by keypad"
          style={{ position: "absolute", left: "51.3%", top: "35%", width: "3.3%", height: "18.5%", background: "transparent", border: "none", cursor: "pointer", padding: 0, opacity: 0, zIndex: 5 }} />

        {showLogin && (
          <LoginPanel onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
        )}

      </div>

      {/* MusicPlayer at ROOT — position:fixed escapes overflow:hidden */}
      {showPlayer && (
        <MusicPlayer
          playerType={playerType}
          onClose={handleClosePlayer}
          userName={user?.name}
          avatarUrl={user?.avatarUrl}
        />
      )}

      {showMap && (
        <div
          onClick={() => setShowMap(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        >
          <MapModal
            visible={showMap}
            onClose={() => setShowMap(false)}
            userName={user?.name}
            avatarUrl={user?.avatarUrl}
          />
        </div>
      )}

      {showNameModal && (
        <div className="profile-modal-mask" onClick={() => setShowNameModal(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 20, color: "#fff" }}>Edit display name</h3>
            <p style={{ margin: "8px 0 14px", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Display name can be duplicated; this only changes how your profile is shown.
            </p>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="profile-input"
              placeholder="Enter your name"
              maxLength={100}
            />
            {profileError && <p style={{ margin: "8px 0 0", color: "#fda4af", fontSize: 12 }}>{profileError}</p>}
            <div className="profile-modal-actions">
              <button type="button" className="profile-ghost-btn" onClick={() => setShowNameModal(false)}>Cancel</button>
              <button type="button" className="profile-primary-btn" disabled={savingProfile || nameDraft.trim().length === 0} onClick={() => void handleSaveName()}>
                {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarModal && (
        <div className="profile-modal-mask" onClick={() => setShowAvatarModal(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 20, color: "#fff" }}>Choose avatar</h3>
            <p style={{ margin: "8px 0 14px", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Phase A uses preset avatars for consistent style across the app.
            </p>
            <div className="avatar-grid">
              {PRESET_AVATARS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`avatar-option ${user?.avatarUrl === item.key ? "active" : ""}`}
                  onClick={() => void handleSelectAvatar(item.key)}
                  disabled={savingProfile}
                >
                  <UserAvatar avatarUrl={item.key} name={user?.name} size={54} />
                </button>
              ))}
            </div>
            {profileError && <p style={{ margin: "8px 0 0", color: "#fda4af", fontSize: 12 }}>{profileError}</p>}
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 360,
              maxWidth: "calc(100vw - 32px)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(20,24,36,0.78)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.36)",
              color: "#fff",
              padding: "24px 22px 20px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <h2 id="logout-confirm-title" style={{ margin: "0 0 8px", color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 0 }}>
              Log out?
            </h2>
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.5 }}>
              You will return to the locked door screen.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.86)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  height: 38,
                  padding: "0 18px",
                  borderRadius: 999,
                  border: "none",
                  background: "#5698AE",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
                type="button"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        .login-input::placeholder { color: rgba(255,255,255,0.78); }
        @media (max-width: 768px) {
          .login-panel { left:50%!important;top:50%!important;transform:translate(-50%,-50%);width:85%!important;min-width:unset!important;animation:fadeIn 0.3s ease-out!important; }
        }
        @keyframes fadeIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.95)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }

        .party-hat-item {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: auto;
          z-index: 7;
          user-select: none;
          object-fit: contain;
          opacity: 0;
          transform: translateY(10px) scale(0.96);
          transform-origin: bottom center;
          cursor: pointer;
          pointer-events: none;
          filter:
            drop-shadow(0 7px 7px rgba(0,0,0,0.18))
            saturate(0.9)
            contrast(0.95)
            brightness(0.96);
          transition: opacity 1.2s ease 1.5s, transform 1.2s ease 1.5s;
        }
        .tennis-ball-hitbox {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 7;
          cursor: pointer;
          pointer-events: none;
          opacity: 0;
          user-select: none;
          transition: opacity 1.2s ease 1.5s;
        }

        .tennis-ball-hitbox.show-desk-item {
          opacity: 0.94 !important;
          pointer-events: auto;
        }

        .tennis-ball-item {
          position: absolute;
          left: 50%;
          bottom: 10%;
          width: 70%;
          height: auto;
          transform: translateX(-50%);
          transform-origin: center center;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
          filter:
            drop-shadow(0 5px 6px rgba(0,0,0,0.16))
            saturate(0.9)
            contrast(0.95)
            brightness(0.96);
        }
        .show-desk-item {
          opacity:0.94!important;
          pointer-events:auto;
        }
        .party-hat-wrap:not(.layout-editing) .party-hat-item.show-desk-item:hover {
          animation: hatTiltClick 0.7s ease-in-out;
        }

        .tennis-ball-wrap:not(.layout-editing) .tennis-ball-hitbox.show-desk-item:hover .tennis-ball-item {
          animation: ballRollClick 0.9s ease-in-out;
        }
        .hat-tilt-click {
          animation: hatTiltClick 0.7s ease-in-out;
        }
        .layout-editing .party-hat-item,
        .layout-editing .tennis-ball-item {
          animation: none !important;
        }

        .ball-roll-click {
          animation: ballRollClick 0.9s ease-in-out;
        }
        .book-item {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 100%;
          height: auto;
          z-index: 7;
          user-select: none;
          object-fit: contain;
          opacity: 0;
          transform: none;
          transform-origin: center bottom;
          cursor: pointer;
          pointer-events: none;
          filter:
            drop-shadow(0 7px 7px rgba(0,0,0,0.18))
            saturate(0.9)
            contrast(0.95)
            brightness(0.96);
          transition:
            opacity 1.2s ease 1.5s,
            transform 0.35s ease;
        }

        .book-item.show-desk-item {
          opacity: 0.94;
          pointer-events: none !important;
          z-index: 22;
        }

        /* Open/hover graphic: keep width tied to book-wrap (~12.5% scene). Older width:14%/right/bottom were % of wrap → tiny thumbnails. */
        .book-item.book-opened {
          width: 100%;
          right: 0;
          bottom: 0;
          animation: bookOpenPop 0.45s ease-out;
        }

        /* Stable hit area — pointer on wrap only (.book-item is pointer-events:none). */
        .book-wrap.desk-visible:not(.layout-editing) {
          cursor: pointer;
        }
        .book-wrap.layout-editing.desk-visible {
          cursor: grab;
        }
        .headphones-hitbox {
          position: absolute;
          left: 18.2%;
          top: 47%;
          width: 7.5%;
          height: 16%;
          z-index: 8;
          cursor: pointer;
          pointer-events: none;
          opacity: 0;
          user-select: none;
          transition: opacity 1.2s ease 1.5s;
        }

        .headphones-hitbox.show-desk-item {
          opacity: 0.96 !important;
          pointer-events: auto;
        }

        .headphones-item {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 88%;
          height: auto;
          transform: translate(-50%, -50%);
          transform-origin: top center;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
          filter:
            drop-shadow(0 7px 7px rgba(0,0,0,0.18))
            saturate(0.92)
            contrast(0.96)
            brightness(0.97);
        }

        .headphones-hitbox.show-desk-item:hover .headphones-item {
          transform: translate(-50%, -50%) scale(1.04);
        }

        .headphones-clicked {
          animation: headphonesSwing 0.9s ease-in-out;
        }

        @keyframes headphonesSwing {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
          }
          30% {
            transform: translate(-50%, -50%) rotate(-7deg) scale(1.03);
          }
          60% {
            transform: translate(-50%, -50%) rotate(5deg) scale(1.02);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
          }
        }
        .desk-draggable {
          position: absolute;
          touch-action: none;
          user-select: none;
          pointer-events: none;
        }

        .desk-draggable.desk-visible {
          pointer-events: auto;
        }

        .desk-draggable.dragging {
          z-index: 60 !important;
        }

        .party-hat-wrap {
          width: 7.5%;
          height: 18%;
          z-index: 7;
        }

        .tennis-ball-wrap {
          width: 5%;
          height: 9%;
          z-index: 7;
        }

        .globe-box {
          width: 10%;
          height: 30%;
          z-index: 20;
        }

        .book-wrap {
          width: 12.5%;
          height: 14%;
          z-index: 22;
        }

        .settings-wrap {
          position:absolute;
          top:5%;
          right:5%;
          z-index:30;
          opacity:0;
          pointer-events:none;
          transform:translateY(-8px) scale(0.96);
          transition:opacity 1.2s ease 1.5s, transform 1.2s ease 1.5s;
        }
        .settings-wrap.show-settings { opacity:1; pointer-events:auto; transform:translateY(0) scale(1); }
        .settings-btn {
          width:56px;
          height:56px;
          border-radius:50%;
          border:1px solid rgba(255,255,255,0.25);
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(20,24,36,0.5);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
          box-shadow:0 4px 14px rgba(0,0,0,0.22);
          padding:0;
          transition:transform 0.2s ease, background 0.2s ease;
        }
        .settings-btn:hover { transform:scale(1.08); background:rgba(255,255,255,0.22); }
        .settings-menu {
          margin-top:10px;
          width:220px;
          border-radius:16px;
          border:1px solid rgba(255,255,255,0.22);
          background:rgba(18,22,34,0.82);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          box-shadow:0 18px 48px rgba(0,0,0,0.35);
          padding:8px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .settings-item {
          height:40px;
          border:none;
          border-radius:12px;
          background:transparent;
          color:rgba(255,255,255,0.92);
          display:flex;
          align-items:center;
          gap:10px;
          padding:0 10px;
          cursor:pointer;
          font-size:14px;
          font-weight:600;
          text-align:left;
        }
        .settings-item:hover { background:rgba(255,255,255,0.12); }
        .settings-item-danger { color:#ffd5d5; }
        .settings-item-danger:hover { background:rgba(255,108,108,0.2); }

        .profile-modal-mask {
          position:fixed;
          inset:0;
          z-index:10001;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(0,0,0,0.42);
          backdrop-filter:blur(5px);
          -webkit-backdrop-filter:blur(5px);
        }
        .profile-modal-card {
          width:430px;
          max-width:calc(100vw - 28px);
          border-radius:18px;
          border:1px solid rgba(255,255,255,0.24);
          background:rgba(20,24,36,0.86);
          box-shadow:0 24px 70px rgba(0,0,0,0.4);
          padding:20px;
          color:#fff;
          font-family:system-ui, sans-serif;
        }
        .profile-input {
          width:100%;
          height:40px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,0.22);
          background:rgba(255,255,255,0.08);
          color:#fff;
          padding:0 12px;
          font-size:14px;
          outline:none;
        }
        .profile-modal-actions {
          margin-top:14px;
          display:flex;
          justify-content:flex-end;
          gap:10px;
        }
        .profile-ghost-btn, .profile-primary-btn {
          height:36px;
          border-radius:999px;
          padding:0 16px;
          cursor:pointer;
          font-weight:700;
        }
        .profile-ghost-btn {
          border:1px solid rgba(255,255,255,0.24);
          background:rgba(255,255,255,0.08);
          color:rgba(255,255,255,0.86);
        }
        .profile-primary-btn {
          border:none;
          background:#5698AE;
          color:#fff;
        }
        .profile-primary-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .avatar-grid {
          display:grid;
          grid-template-columns:repeat(4, minmax(0,1fr));
          gap:10px;
        }
        .avatar-option {
          border:1px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.06);
          border-radius:14px;
          height:78px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .avatar-option.active {
          border-color:#80d5ff;
          background:rgba(86,152,174,0.22);
        }

        .monitor-screen {
          position:absolute;
          left:39%;
          top:55.35%;
          width:20%;
          height:20.2%;
          z-index:6;
          pointer-events:auto;
          user-select:none;
          opacity:0;
          transition:opacity 1.2s ease 1.3s;
          font-family:Arial,Helvetica,sans-serif;
          overflow:hidden;
          border-radius:6px;
          backdrop-filter:blur(2px);
          -webkit-backdrop-filter:blur(2px);
        }

        .monitor-visible {
          opacity:1;
          transition:opacity 1.2s ease 1.3s;
        }

        .monitor-day {
          background:rgba(245,248,255,0.96);
          color:#ffffff;
          text-shadow:0 2px 8px rgba(0,0,0,0.65);
        }

        .monitor-night {
          background:rgba(5,12,30,1);
          color:#ffffff;
          text-shadow:0 2px 8px rgba(0,0,0,0.65);
        }

        .monitor-overlay {
          position:absolute;
          inset:0;
          z-index:1;
          background:rgba(0,0,0,0.22);
          pointer-events:none;
        }

        .monitor-content {
          position:relative;
          z-index:2;
          width:100%;
          height:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
        }

        .monitor-time {
          font-size:clamp(20px,2.4vw,42px);
          line-height:1;
          font-weight:300;
          margin-bottom:4px;
        }

        .monitor-date {
          font-size:clamp(10px,1vw,18px);
          margin-bottom:10px;
        }

        .monitor-user {
          display:flex;
          flex-direction:column;
          align-items:center;
        }

        .monitor-avatar {
          width:clamp(22px,2.4vw,42px);
          height:clamp(22px,2.4vw,42px);
          border-radius:50%;
          position:relative;
          margin-bottom:3px;
        }

        .monitor-day .monitor-avatar {
          background:rgba(31,41,51,0.14);
        }

        .monitor-night .monitor-avatar {
          background:rgba(255,255,255,0.88);
        }

        .avatar-head {
          position:absolute;
          top:22%;
          left:50%;
          width:28%;
          height:28%;
          border-radius:50%;
          transform:translateX(-50%);
        }

        .avatar-body {
          position:absolute;
          bottom:18%;
          left:50%;
          width:52%;
          height:28%;
          border-radius:50% 50% 40% 40%;
          transform:translateX(-50%);
        }

        .monitor-day .avatar-head,
        .monitor-day .avatar-body {
          background:#1f2933;
        }

        .monitor-night .avatar-head,
        .monitor-night .avatar-body {
          background:#5f6b75;
        }

        .monitor-username {
          font-size:clamp(7px,0.75vw,13px);
        }

        .monitor-bg-controls {
          position:absolute;
          right:8px;
          bottom:7px;
          z-index:3;
          display:flex;
          gap:6px;
          opacity:0;
          transition:opacity 0.2s ease;
        }

        .monitor-screen:hover .monitor-bg-controls {
          opacity:1;
        }

        .monitor-bg-btn {
          height:18px;
          padding:0 7px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.45);
          background:rgba(0,0,0,0.35);
          color:#fff;
          font-size:9px;
          line-height:18px;
          cursor:pointer;
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
        }

        .monitor-bg-btn:hover {
          background:rgba(255,255,255,0.25);
        }

        .globe-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 20;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          opacity: 0;
          transform: none;
          transition: opacity 1.2s ease 1.5s;
        }
        .globe-wrap.show-globe {
          opacity: 0.94;
          pointer-events: auto;
        }
        .globe-item {
          display:block;
          width:120%;
          height:auto;
          transform:translate(-8%,-6%);
          object-fit:contain;
          pointer-events:none;
          user-select:none;
          opacity:0.95;
          filter:
            drop-shadow(0 8px 8px rgba(0,0,0,0.18))
            saturate(0.9)
            contrast(0.95)
            brightness(0.96);
        }
        .globe-star {
          position:absolute;
          color:#FFD34D;
          font-size:22px;
          opacity:0;
          pointer-events:none;
          text-shadow:0 0 8px rgba(255,211,77,0.95),0 0 18px rgba(255,211,77,0.75);
        }
        .globe-wrap.globe-active .globe-star { opacity:1; animation:globeStarFloat 1.8s ease-in-out infinite; }
        .globe-star-1{left:0%;top:-2%;animation-delay:0s}
        .globe-star-2{right:2%;top:8%;animation-delay:.2s}
        .globe-star-3{left:-8%;top:44%;animation-delay:.4s}
        .globe-star-4{right:4%;bottom:20%;animation-delay:.6s}
        .globe-star-5{left:24%;bottom:-4%;animation-delay:.8s}

        .globe-star-6{left:14%;top:-12%;animation-delay:.1s}
        .globe-star-7{right:18%;top:-4%;animation-delay:.35s}
        .globe-star-8{left:-12%;bottom:30%;animation-delay:.55s}
        .globe-star-9{right:2%;bottom:6%;animation-delay:.75s}
        .globe-star-10{left:38%;bottom:8%;animation-delay:.95s}

        @keyframes globeStarFloat {
          0%{transform:translateY(0) scale(0.75);opacity:0}
          25%{opacity:1}
          50%{transform:translateY(-8px) scale(1.2);opacity:1}
          100%{transform:translateY(-16px) scale(0.75);opacity:0}
        }
        @keyframes bookOpenPop {
          0%{transform:translateY(0) scale(0.94) rotateX(8deg)}
          60%{transform:translateY(-2px) scale(1.04) rotateX(0deg)}
          100%{transform:translateY(0) scale(1) rotateX(0deg)}
        }
        @keyframes hatTiltClick {
          0%{transform:translateY(0) scale(1) rotate(0deg)}
          35%{transform:translateY(0) scale(1) rotate(-13deg)}
          70%{transform:translateY(0) scale(1) rotate(8deg)}
          100%{transform:translateY(0) scale(1) rotate(0deg)}
        }

        @keyframes ballRollClick {
          0%{transform:translateX(0) translateY(0) scale(1) rotate(0deg)}
          35%{transform:translateX(28px) translateY(0) scale(1) rotate(140deg)}
          70%{transform:translateX(-8px) translateY(0) scale(1) rotate(-40deg)}
          100%{transform:translateX(0) translateY(0) scale(1) rotate(0deg)}
        }

      `}</style>
    </div>
  );
}
