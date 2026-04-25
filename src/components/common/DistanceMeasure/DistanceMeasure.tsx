import React, { useState, useCallback } from "react";
import { Marker, Polyline, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "./DistanceMeasure.css";
import { calculateHaversineDistance } from "../../../utils/utils";

interface LatLng {
  lat: number;
  lng: number;
}

interface DistanceResult {
  km: number;
  miles: number;
}

// Point A marker icon — Blue
const createPointAIcon = (): L.DivIcon =>
  L.divIcon({
    className: "distance-marker",
    html: `<div class="distance-marker-pin point-a">A</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Point B marker icon — Red
const createPointBIcon = (): L.DivIcon =>
  L.divIcon({
    className: "distance-marker",
    html: `<div class="distance-marker-pin point-b">B</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

interface MapClickHandlerProps {
  isActive: boolean;
  pointA: LatLng | null;
  pointB: LatLng | null;
  onPointSet: (point: LatLng) => void;
}

// Inner component to capture map click events
function MapClickHandler({
  isActive,
  pointA,
  pointB,
  onPointSet,
}: MapClickHandlerProps): null {
  useMapEvents({
    click(e) {
      if (!isActive) return;
      // If both points already set, don't add more
      if (pointA && pointB) return;
      onPointSet({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function DistanceMeasure(): JSX.Element {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [pointA, setPointA] = useState<LatLng | null>(null);
  const [pointB, setPointB] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<DistanceResult | null>(null);

  const handlePointSet = useCallback(
    (point: LatLng): void => {
      if (!pointA) {
        setPointA(point);
      } else if (!pointB) {
        setPointB(point);
        const result = calculateHaversineDistance(
          pointA.lat,
          pointA.lng,
          point.lat,
          point.lng,
        );
        setDistance(result);
      }
    },
    [pointA, pointB],
  );

  const handleClear = (): void => {
    setPointA(null);
    setPointB(null);
    setDistance(null);
  };

  const handleToggle = (): void => {
    if (isActive) {
      handleClear();
    }
    setIsActive((prev) => !prev);
  };

  return (
    <>
      {/* Floating toolbar button */}
      <div className="distance-toolbar leaflet-top leaflet-right">
        <div className="leaflet-control">
          <button
            className={`distance-toggle-btn ${isActive ? "active" : ""}`}
            onClick={handleToggle}
            title={isActive ? "Exit Measure Mode" : "Measure Distance"}
          >
            📏 {isActive ? "Exit Measure" : "Measure Distance"}
          </button>
        </div>
      </div>

      {/* Instruction hint when active */}
      {isActive && !pointA && (
        <div className="distance-hint leaflet-bottom leaflet-left">
          <div className="leaflet-control distance-hint-box">
            🖱️ Click on the map to set <strong>Point A</strong>
          </div>
        </div>
      )}
      {isActive && pointA && !pointB && (
        <div className="distance-hint leaflet-bottom leaflet-left">
          <div className="leaflet-control distance-hint-box">
            🖱️ Click on the map to set <strong>Point B</strong>
          </div>
        </div>
      )}

      {/* Distance Result Panel */}
      {distance && pointA && pointB && (
        <div className="distance-result-panel leaflet-bottom leaflet-left">
          <div className="leaflet-control distance-result-box">
            <div className="distance-result-header">
              <span>📐 Distance</span>
              <button className="distance-clear-btn" onClick={handleClear}>
                ✖ Clear
              </button>
            </div>
            <div className="distance-result-body">
              <div className="distance-value">
                <span className="distance-number">{distance.km}</span>
                <span className="distance-unit"> km</span>
              </div>
              <div className="distance-value secondary">
                <span className="distance-number">{distance.miles}</span>
                <span className="distance-unit"> miles</span>
              </div>
            </div>
            <div className="distance-coords">
              <div>
                🔵 A: {pointA.lat.toFixed(4)}, {pointA.lng.toFixed(4)}
              </div>
              <div>
                🔴 B: {pointB.lat.toFixed(4)}, {pointB.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map click handler */}
      <MapClickHandler
        isActive={isActive}
        pointA={pointA}
        pointB={pointB}
        onPointSet={handlePointSet}
      />

      {/* Point A Marker */}
      {pointA && (
        <Marker position={[pointA.lat, pointA.lng]} icon={createPointAIcon()}>
          <Popup>
            <strong>📍 Point A</strong>
            <br />
            Lat: {pointA.lat.toFixed(5)}
            <br />
            Lng: {pointA.lng.toFixed(5)}
          </Popup>
        </Marker>
      )}

      {/* Point B Marker */}
      {pointB && (
        <Marker position={[pointB.lat, pointB.lng]} icon={createPointBIcon()}>
          <Popup>
            <strong>📍 Point B</strong>
            <br />
            Lat: {pointB.lat.toFixed(5)}
            <br />
            Lng: {pointB.lng.toFixed(5)}
            {distance && (
              <>
                <br />
                <strong>
                  Distance: {distance.km} km / {distance.miles} mi
                </strong>
              </>
            )}
          </Popup>
        </Marker>
      )}

      {/* Dashed line between A and B */}
      {pointA && pointB && (
        <Polyline
          positions={[
            [pointA.lat, pointA.lng],
            [pointB.lat, pointB.lng],
          ]}
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