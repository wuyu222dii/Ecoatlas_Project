export const IMG_W = 3833;
export const IMG_H = 2157;
export const IMG_RATIO = IMG_W / IMG_H;
export const DOOR_SPEED = 1;
export const SKIP_LOGIN = ["1", "true", "yes", "on"].includes(
  (import.meta.env.VITE_SKIP_LOGIN ?? "").toLowerCase(),
);

export type DeskItemKey = "hat" | "ball" | "globe" | "book";

export type DeskLayout = Record<
  DeskItemKey,
  {
    left: number;
    top: number;
  }
>;

export const DESK_LAYOUT_STORAGE_KEY = "desk-layout-v1";

export const DEFAULT_DESK_LAYOUT: DeskLayout = {
  hat: { left: 14.8, top: 73.5 },
  ball: { left: 26.4, top: 84.2 },
  globe: { left: 69.8, top: 63.5 },
  book: { left: 80.5, top: 82.5 },
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getThemeByTime = (): "day" | "night" => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
};
