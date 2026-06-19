import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import {
  COUNTRIES_GEOJSON_URL,
  DESKTOP_GLOBE_ALTITUDE,
  DESKTOP_GLOBE_OFFSET_X,
  MAP_VISUALS,
  MOBILE_GLOBE_ALTITUDE,
  SEARCH_PLACE_PREVIEW_INDEX,
  safeMarkerHex,
  withAlpha,
} from "./constants";
import type { CountryFeature, GlobeCoords, MemoryArc, MemoryPoint } from "./types";
import {
  createPolaroidMarker,
  getRegionColor,
  normalizeCoords,
  stopClickPropagation,
} from "./utils";

export function RealisticGlobe({
  activeMemory,
  isDark,
  isMobile,
  memories,
  searchPlaceFocus,
  onAddMemory,
  onSelectMemory,
}: {
  activeMemory: number;
  isDark: boolean;
  isMobile: boolean;
  memories: MemoryPoint[];
  /** While set, camera stays on this lat/lng and auto-rotate pauses (Places search preview). */
  searchPlaceFocus?: { lat: number; lng: number } | null;
  onAddMemory: (coords: GlobeCoords, country?: CountryFeature) => void;
  onSelectMemory: (index: number) => void;
}) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const mapTheme = MAP_VISUALS[isDark ? "dark" : "light"];
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: mapTheme.globeColor,
        emissive: mapTheme.globeEmissive,
        emissiveIntensity: mapTheme.globeEmissiveIntensity,
        opacity: mapTheme.globeOpacity,
        shininess: mapTheme.globeShininess,
        transparent: true,
      }),
    [mapTheme],
  );

  const savedGlobePoints = useMemo(
    () => memories.filter((m) => m.index >= 0),
    [memories],
  );
  const searchPreviewActive = memories.some(
    (m) => m.index === SEARCH_PLACE_PREVIEW_INDEX,
  );

  const arcs = useMemo(() => {
    if (savedGlobePoints.length < 2) return [];

    return (isDark ? savedGlobePoints : savedGlobePoints.slice(1)).map(
      (memory, index) => {
        const start = isDark ? memory : savedGlobePoints[index];
        const end = isDark
          ? savedGlobePoints[(index + 1) % savedGlobePoints.length]
          : memory;

        return {
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
          color: safeMarkerHex(memory.color),
          index,
        };
      },
    );
  }, [isDark, savedGlobePoints]);
  const ringMemories = isDark
    ? memories
    : memories.filter(
        (memory) =>
          memory.index === activeMemory ||
          (memory.index === SEARCH_PLACE_PREVIEW_INDEX && searchPreviewActive),
      );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      setSize({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(320, Math.round(rect.height)),
      });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(COUNTRIES_GEOJSON_URL)
      .then((response) => response.json())
      .then((data: { features?: CountryFeature[] }) => {
        if (cancelled) return;
        setCountries(
          (data.features ?? []).filter(
            (country) => country.properties?.ISO_A2 !== "AQ",
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotateSpeed = 0.28;
    controls.enablePan = false;
    controls.enableZoom = false;
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = !searchPlaceFocus;
  }, [searchPlaceFocus]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    if (searchPlaceFocus) {
      globe.pointOfView(
        {
          lat: searchPlaceFocus.lat,
          lng: searchPlaceFocus.lng,
          altitude: isMobile ? MOBILE_GLOBE_ALTITUDE : DESKTOP_GLOBE_ALTITUDE,
        },
        1200,
      );
      return;
    }

    const memory = memories.find((m) => m.index === activeMemory);
    if (!memory) return;

    globe.pointOfView(
      {
        lat: memory.lat,
        lng: memory.lng,
        altitude: isMobile ? MOBILE_GLOBE_ALTITUDE : DESKTOP_GLOBE_ALTITUDE,
      },
      900,
    );
  }, [activeMemory, isMobile, memories, searchPlaceFocus]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        globeOffset={isMobile ? [0, 0] : [DESKTOP_GLOBE_OFFSET_X, 0]}
        animateIn={false}
        backgroundColor="rgba(255,255,255,0)"
        globeMaterial={globeMaterial}
        showAtmosphere
        atmosphereColor={mapTheme.atmosphereColor}
        atmosphereAltitude={mapTheme.atmosphereAltitude}
        showGraticules={isDark}
        polygonsData={countries}
        polygonGeoJsonGeometry={(country: object) =>
          (country as CountryFeature).geometry
        }
        polygonCapColor={(country: object) =>
          getRegionColor(country as CountryFeature, isDark)
        }
        polygonSideColor={() => mapTheme.polygonSideColor}
        polygonStrokeColor={() => mapTheme.polygonStrokeColor}
        polygonAltitude={0.006}
        polygonLabel={(country: object) =>
          (country as CountryFeature).properties?.ADMIN ?? ""
        }
        pointsData={memories}
        pointLat={(point: object) => (point as MemoryPoint).lat}
        pointLng={(point: object) => (point as MemoryPoint).lng}
        pointColor={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return isDark && active
            ? "#ffffff"
            : safeMarkerHex(p.color);
        }}
        pointAltitude={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active
            ? mapTheme.pointActiveAltitude
            : mapTheme.pointAltitude;
        }}
        pointRadius={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active
            ? mapTheme.pointActiveRadius
            : mapTheme.pointRadius;
        }}
        pointResolution={20}
        pointsTransitionDuration={350}
        pointLabel={(point: object) => {
          const m = point as MemoryPoint;
          if (m.index === SEARCH_PLACE_PREVIEW_INDEX) {
            return `${m.title}<br/>${m.location}<br/>Add photo to save`;
          }
          return `${m.title}<br/>${m.location}<br/>${m.track} · ${m.artist}`;
        }}
        onPointClick={(point: object, event: object) => {
          stopClickPropagation(event);
          onSelectMemory((point as MemoryPoint).index);
        }}
        onPolygonClick={(country: object, event: object, coords: object) => {
          stopClickPropagation(event);
          const normalized = normalizeCoords(coords);
          if (normalized) onAddMemory(normalized, country as CountryFeature);
        }}
        onGlobeClick={(coords: object) => {
          const normalized = normalizeCoords(coords);
          if (normalized) onAddMemory(normalized);
        }}
        htmlElementsData={memories}
        htmlLat={(point: object) => (point as MemoryPoint).lat}
        htmlLng={(point: object) => (point as MemoryPoint).lng}
        htmlAltitude={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active ? 0.13 : 0.1;
        }}
        htmlElement={(point: object) => {
          const memory = point as MemoryPoint;
          const active =
            memory.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : memory.index === activeMemory;
          return createPolaroidMarker(
            memory,
            active,
            isDark,
            onSelectMemory,
          );
        }}
        htmlElementVisibilityModifier={(element: HTMLElement, isVisible: boolean) => {
          element.style.opacity = isVisible
            ? element.dataset.active === "true"
              ? "1"
              : "0.9"
            : "0";
          element.style.pointerEvents = isVisible ? "auto" : "none";
        }}
        htmlTransitionDuration={420}
        arcsData={arcs}
        arcColor={(arc: object) => {
          const color = safeMarkerHex((arc as MemoryArc).color);
          return isDark
            ? [withAlpha(color, "22"), withAlpha(color, "ee"), "rgba(255,255,255,0.9)"]
            : mapTheme.arcColor;
        }}
        arcAltitude={0.2}
        arcStroke={mapTheme.arcStroke}
        arcCircularResolution={12}
        arcDashLength={mapTheme.arcDashLength}
        arcDashGap={mapTheme.arcDashGap}
        arcDashInitialGap={(arc: object) =>
          isDark ? ((arc as MemoryArc).index * 0.19) % 1 : 0
        }
        arcDashAnimateTime={3200}
        ringsData={ringMemories}
        ringLat={(point: object) => (point as MemoryPoint).lat}
        ringLng={(point: object) => (point as MemoryPoint).lng}
        ringColor={(point: object) => {
          const color = safeMarkerHex((point as MemoryPoint).color);
          return isDark
            ? [withAlpha(color, "00"), withAlpha(color, "ee"), "rgba(255,255,255,0)"]
            : withAlpha(color, "aa");
        }}
        ringAltitude={0.01}
        ringResolution={96}
        ringMaxRadius={mapTheme.ringMaxRadius}
        ringPropagationSpeed={mapTheme.ringPropagationSpeed}
        ringRepeatPeriod={mapTheme.ringRepeatPeriod}
        rendererConfig={{ antialias: true, alpha: true }}
      />
    </div>
  );
}
