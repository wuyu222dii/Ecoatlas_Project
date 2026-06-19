import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { UserAvatar } from "./UserAvatar";

type MonitorScreenProps = {
  theme: "day" | "night";
  visible: boolean;
  backgroundImage?: string;
  userName?: string;
  avatarUrl?: string | null;
  onUploadBackground: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function MonitorScreen({
  theme,
  visible,
  backgroundImage,
  userName,
  avatarUrl,
  onUploadBackground,
}: MonitorScreenProps) {
  const [time, setTime] = useState("");
  const [dateText, setDateText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeString = now.toLocaleTimeString("en-NZ", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const dateString = now.toLocaleDateString("en-NZ", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });

      setTime(timeString);
      setDateText(dateString);
    };

    updateTime();

    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const hasBackgroundImage = Boolean(backgroundImage);

  return (
    <div
      className={`monitor-screen ${
        theme === "night" ? "monitor-night" : "monitor-day"
      } ${visible ? "monitor-visible" : ""}`}
      style={
        hasBackgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : undefined
      }
    >
      {hasBackgroundImage && <div className="monitor-overlay" />}

      <div className="monitor-content">
        <div className="monitor-time">{time}</div>
        <div className="monitor-date">{dateText}</div>

        <div className="monitor-user">
          <UserAvatar avatarUrl={avatarUrl} name={userName} size={56} />
          <div className="monitor-username">{userName?.trim() || "User"}</div>
        </div>
      </div>

      <div className="monitor-bg-controls">
        <button
          type="button"
          className="monitor-bg-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Set wallpaper"
        >
          Set Wallpaper
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onUploadBackground}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}