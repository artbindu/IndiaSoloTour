import { useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useMap } from "react-leaflet";
import "leaflet-rotate";
import "./MapRotation.css";

/** Step in degrees for each button press. */
const ROTATION_STEP = 15;

interface MapRotationProps {
  /** Called whenever the map bearing changes (degrees, clockwise from North). */
  onBearingChange?: (bearing: number) => void;
}

export interface MapRotationHandle {
  /** Reset map bearing to North (0°) */
  resetToNorth: () => void;
}

/**
 * Activates leaflet-rotate on the parent MapContainer and tracks the current
 * bearing.  Renders rotation controls below the CompassMarker:
 *   [↺] [↻]  — always visible (rotate 15° CCW / CW)
 *
 * Click on the CompassMarker above to reset map to North.
 *
 * Additional gestures:
 *   Desktop  — Alt + drag  or  Ctrl + drag
 *   Mobile   — two-finger twist
 */
export const MapRotation = forwardRef<MapRotationHandle, MapRotationProps>(
  function MapRotation({ onBearingChange }, ref) {
    const map = useMap();

    useEffect(() => {
      if (!map) return;

      const sync = (): void => {
        const raw = map.getBearing?.() ?? 0;
        const b = ((raw % 360) + 360) % 360;
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

    useImperativeHandle(
      ref,
      () => ({
        resetToNorth: resetNorth,
      }),
      [resetNorth],
    );

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
      </div>
    );
  },
);
