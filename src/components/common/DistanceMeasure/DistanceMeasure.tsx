import React, { useState, useCallback } from "react";
import { Marker, Polyline, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "./DistanceMeasure.css";
import { calculateHaversineDistance } from "../../../utils/utils";

interface LatLng {
  lat: number;
  lng: number;
}

interface SegmentDistance {
  km: number;
  miles: number;
}

// Numbered marker icon — type controls colour
const createPointIcon = (
  label: string,
  type: "first" | "mid" | "last",
): L.DivIcon =>
  L.divIcon({
    className: "distance-marker",
    html: `<div class="distance-marker-pin point-${type}">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Sum haversine distances across consecutive point pairs
function calcTotalDistance(
  pts: LatLng[],
): { km: number; miles: number } | null {
  if (pts.length < 2) return null;
  let totalKm = 0;
  for (let i = 1; i < pts.length; i++) {
    totalKm += calculateHaversineDistance(
      pts[i - 1].lat,
      pts[i - 1].lng,
      pts[i].lat,
      pts[i].lng,
    ).km;
  }
  return {
    km: parseFloat(totalKm.toFixed(1)),
    miles: parseFloat((totalKm * 0.621371).toFixed(1)),
  };
}

// Per-segment distances
function calcSegmentDistances(pts: LatLng[]): SegmentDistance[] {
  const segs: SegmentDistance[] = [];
  for (let i = 1; i < pts.length; i++) {
    const r = calculateHaversineDistance(
      pts[i - 1].lat,
      pts[i - 1].lng,
      pts[i].lat,
      pts[i].lng,
    );
    segs.push({ km: r.km, miles: r.miles });
  }
  return segs;
}

interface MapClickHandlerProps {
  isActive: boolean;
  onPointAdd: (point: LatLng) => void;
}

function MapClickHandler({ isActive, onPointAdd }: MapClickHandlerProps): null {
  useMapEvents({
    click(e) {
      if (!isActive) return;
      onPointAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface DistanceMeasureProps {
  isActive: boolean;
  onToggle: () => void;
}

export function useDistanceMeasure() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [points, setPoints] = useState<LatLng[]>([]);

  const handlePointAdd = useCallback((point: LatLng): void => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const handleUndo = (): void => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleRemovePoint = useCallback((index: number): void => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = (): void => {
    setPoints([]);
  };

  const handleToggle = (): void => {
    if (isActive) handleClear();
    setIsActive((prev) => !prev);
  };

  const totalDistance = calcTotalDistance(points);

  return {
    isActive,
    points,
    totalDistance,
    handlePointAdd,
    handleUndo,
    handleRemovePoint,
    handleClear,
    handleToggle,
  };
}

export function DistanceMeasure({
  isActive,
  onToggle,
}: DistanceMeasureProps): JSX.Element {
  const [points, setPoints] = useState<LatLng[]>([]);

  // Reset when deactivated
  React.useEffect(() => {
    if (!isActive) setPoints([]);
  }, [isActive]);

  const handlePointAdd = useCallback((point: LatLng): void => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const handleUndo = (): void => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleRemovePoint = useCallback((index: number): void => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = (): void => {
    setPoints([]);
  };

  const totalDistance = calcTotalDistance(points);
  const segmentDistances = calcSegmentDistances(points);
  const pointCount = points.length;

  return (
    <>
      {/* Instruction hint — shown while waiting for first two points */}
      {isActive && pointCount < 2 && (
        <div className="distance-hint leaflet-bottom leaflet-left">
          <div className="leaflet-control distance-hint-box">
            {pointCount === 0 ? (
              <>
                🖱️ Click on the map to set <strong>Point 1</strong>
              </>
            ) : (
              <>
                🖱️ Click to set <strong>Point 2</strong>{" "}
                <span className="distance-hint-sub">
                  (keep clicking to add more)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Result panel — shown once at least 2 points are placed */}
      {isActive && totalDistance && (
        <div className="distance-result-panel leaflet-bottom leaflet-left">
          <div className="leaflet-control distance-result-box">
            <div className="distance-result-header">
              <span>📐 Distance ({pointCount} pts)</span>
              <div className="distance-actions">
                {pointCount > 0 && (
                  <button
                    className="distance-undo-btn"
                    onClick={handleUndo}
                    title="Remove last point"
                  >
                    ↩ Undo
                  </button>
                )}
                <button className="distance-clear-btn" onClick={handleClear}>
                  ✖ Clear
                </button>
              </div>
            </div>

            {/* Total distance */}
            <div className="distance-result-body">
              <div className="distance-value">
                <span className="distance-number">{totalDistance.km}</span>
                <span className="distance-unit"> km total</span>
              </div>
              <div className="distance-value secondary">
                <span className="distance-number">{totalDistance.miles}</span>
                <span className="distance-unit"> miles total</span>
              </div>
            </div>

            {/* Per-segment breakdown (only when > 2 points) */}
            {segmentDistances.length > 1 && (
              <div className="distance-segments">
                <div className="distance-segments-title">Segments</div>
                {segmentDistances.map((seg, i) => (
                  <div key={i} className="distance-segment-row">
                    <span className="distance-segment-label">
                      {i + 1} → {i + 2}
                    </span>
                    <span className="distance-segment-val">{seg.km} km</span>
                  </div>
                ))}
              </div>
            )}

            {/* Coordinates */}
            <div className="distance-coords">
              {points.map((p, i) => (
                <div key={i}>
                  {i === 0 ? "🔵" : i === pointCount - 1 ? "🔴" : "🟣"} {i + 1}:{" "}
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </div>
              ))}
            </div>

            {/* Prompt to add more points */}
            <div className="distance-add-hint">
              🖱️ Click map to add Point {pointCount + 1} &nbsp;·&nbsp;
              Double-click a marker to remove it
            </div>
          </div>
        </div>
      )}

      {/* Map click handler */}
      <MapClickHandler isActive={isActive} onPointAdd={handlePointAdd} />

      {/* Numbered markers */}
      {points.map((p, i) => {
        const type = i === 0 ? "first" : i === pointCount - 1 ? "last" : "mid";
        return (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={createPointIcon(String(i + 1), type)}
            eventHandlers={{
              dblclick: (e) => {
                e.originalEvent.stopPropagation();
                handleRemovePoint(i);
              },
            }}
          >
            <Popup>
              <strong>📍 Point {i + 1}</strong>
              <br />
              Lat: {p.lat.toFixed(5)}
              <br />
              Lng: {p.lng.toFixed(5)}
              {i > 0 && segmentDistances[i - 1] && (
                <>
                  <br />
                  <strong>
                    From {i}: {segmentDistances[i - 1].km} km /{" "}
                    {segmentDistances[i - 1].miles} mi
                  </strong>
                </>
              )}
              <br />
              <span style={{ fontSize: "11px", color: "#888" }}>
                Double-click to remove
              </span>
            </Popup>
          </Marker>
        );
      })}

      {/* Dashed polyline through all points */}
      {pointCount >= 2 && (
        <Polyline
          positions={points.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: "#667eea",
            weight: 3,
            opacity: 0.9,
            dashArray: "10, 8",
          }}
        />
      )}
    </>
  );
}
