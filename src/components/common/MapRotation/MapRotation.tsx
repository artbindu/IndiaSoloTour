import { useEffect, useCallback, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet-rotate";
import "./MapRotation.css";

/** Step in degrees for each button press. */
const ROTATION_STEP = 45;

interface MapRotationProps {
  /** Called whenever the map bearing changes (degrees, clockwise from North). */
  onBearingChange?: (bearing: number) => void;
}

/**
 * Activates leaflet-rotate on the parent MapContainer and tracks the current
 * bearing.  Renders rotation controls in the bottom-right corner:
 *   [↺] [↻]  — always visible (rotate 45° CCW / CW)
 *   [↑N]     — shown only when bearing ≠ 0 (tap to snap back to North)
 *
 * Additional gestures:
 *   Desktop  — Alt + drag  or  Ctrl + drag
 *   Mobile   — two-finger twist
 */
export function MapRotation({
  onBearingChange,
}: MapRotationProps): JSX.Element {
  const map = useMap();
  const [bearing, setBearing] = useState<number>(0);

  useEffect(() => {
    if (!map) return;

    const sync = (): void => {
      const raw = map.getBearing?.() ?? 0;
      const b = ((raw % 360) + 360) % 360;
      setBearing(b);
      onBearingChange?.(b);
    };

    sync();
    map.on("rotate", sync);
    return () => {
      map.off("rotate", sync);
    };
  }, [map, onBearingChange]);

  const rotateCCW = useCallback((): void => {
    map.setBearing?.((map.getBearing?.() ?? 0) - ROTATION_STEP);
  }, [map]);

  const rotateCW = useCallback((): void => {
    map.setBearing?.((map.getBearing?.() ?? 0) + ROTATION_STEP);
  }, [map]);

  const resetNorth = useCallback((): void => {
    map.setBearing?.(0);
  }, [map]);

  return (
    <div className="map-rotation-container leaflet-bottom leaflet-right">
      {/* Single pill button — left half ↺ CCW, right half ↻ CW */}
      <button
        className="leaflet-control rotation-btn-combined"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX - rect.left < rect.width / 2) rotateCCW();
          else rotateCW();
        }}
        title="Left half: rotate CCW ↺ · Right half: rotate CW ↻"
        aria-label="Rotate map"
      >
        <span className="rotation-half">↺</span>
        <span className="rotation-divider" />
        <span className="rotation-half">↻</span>
      </button>

      {/* Reset North — only when rotated */}
      {bearing !== 0 && (
        <button
          className="leaflet-control reset-north-btn"
          onClick={resetNorth}
          title="Reset to North"
          aria-label="Reset map to North"
        >
          <span
            className="reset-north-needle"
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            ↑
          </span>
          <span className="reset-north-label">N</span>
        </button>
      )}
    </div>
  );
}
