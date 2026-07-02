import React, { useMemo, useState, useCallback, useRef, memo } from "react";
import L from "leaflet";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import "./MapView.css";
import { mapConfig, iconColors, markerConfig } from "../../../config/config";
import { Place } from "../../../models/Places";
import { GITagItem } from "../../../models/Items";
import { LiveLocation } from "../../common/LiveLocation/LiveLocation";
import { DistanceMeasure } from "../../common/DistanceMeasure/DistanceMeasure";
import { CompassMarker } from "../../common/CompassMarker/CompassMarker";
import {
  MapRotation,
  type MapRotationHandle,
} from "../../common/MapRotation/MapRotation";
import {
  createCustomIcon,
  hasValidCoordinates,
  getHeritageIcon,
  getHeritageColor,
} from "../../../utils/utils";

interface MapViewProps {
  filteredPlaces: Place[];
  filteredGiTags: GITagItem[];
  showGiTags: boolean;
}

/**
 * PlaceMarker — memoized to prevent re-renders when parent state changes
 * Only re-renders if the place object reference changes
 */
const PlaceMarker = memo<{
  place: Place;
  index: number;
  icon: L.Icon | L.DivIcon;
}>(({ place, index, icon }) => {
  if (!hasValidCoordinates(place.coordinates)) return null;
  return (
    <Marker
      key={`place-${index}`}
      position={[place.coordinates.lat, place.coordinates.long]}
      icon={icon as L.Icon}
    >
      <Popup>
        <div className="popup-content">
          <h3>
            <span
              style={{
                backgroundColor: getHeritageColor(place.heritage),
                padding: "8px",
                borderRadius: "50%",
              }}
            >
              {getHeritageIcon(place.heritage)}{" "}
            </span>
            {place.name}
          </h3>
          <p>
            <strong>Type:</strong> {place.type}
          </p>
          <p>
            <strong>Location:</strong> {place.city}, {place.state}
          </p>
          {place.heritage &&
            (place.heritage.unesco ||
              place.heritage.national ||
              place.heritage.state) && (
              <p>
                <strong>Heritage:</strong>
                {place.heritage.unesco && " UNESCO"}
                {place.heritage.national && " National"}
                {place.heritage.state && " State"}
              </p>
            )}
          {place.description && (
            <p className="description">{place.description}</p>
          )}
          {place.bestVisitMonths && (
            <p>
              <strong>Best Visit:</strong> {place.bestVisitMonths.join(", ")}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
});
PlaceMarker.displayName = "PlaceMarker";

/**
 * GITagMarker — memoized to prevent re-renders when parent state changes
 */
const GITagMarker = memo<{
  item: GITagItem;
  index: number;
  icon: L.Icon | L.DivIcon;
}>(({ item, index, icon }) => {
  if (!hasValidCoordinates(item.coordinates)) return null;
  return (
    <Marker
      key={`gi-${index}`}
      position={[item.coordinates.lat, item.coordinates.long]}
      icon={icon as L.Icon}
    >
      <Popup>
        <div className="popup-content">
          <h3>🏅 {item.name}</h3>
          <p>
            <strong>Type:</strong> {item.Type}
          </p>
          <p>
            <strong>Location:</strong> {item.location}, {item.state}
          </p>
          <p>
            <strong>Significance:</strong> {item.significance}
          </p>
          {item.description && (
            <p className="description">{item.description}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
});
GITagMarker.displayName = "GITagMarker";

export function MapView({
  filteredPlaces,
  filteredGiTags,
  showGiTags,
}: MapViewProps): JSX.Element {
  // Measure state lifted here so both LiveLocation (button) and DistanceMeasure (map layers) share it
  const [isMeasureActive, setIsMeasureActive] = useState<boolean>(false);
  // Bridge: live-location marker click → DistanceMeasure point
  const [pendingMeasurePoint, setPendingMeasurePoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Bearing state — shared between MapRotation (source) and CompassMarker (display)
  const [mapBearing, setMapBearing] = useState<number>(0);

  // Ref to MapRotation to access its reset function
  const mapRotationRef = useRef<MapRotationHandle>(null);

  const handleMeasureToggle = (): void => {
    setIsMeasureActive((prev) => !prev);
  };

  const handleBearingChange = useCallback((b: number): void => {
    setMapBearing(b);
  }, []);

  const handleCompassClick = useCallback((): void => {
    mapRotationRef.current?.resetToNorth();
  }, []);

  const iconCacheByType = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof createCustomIcon>>();
    for (const place of filteredPlaces) {
      if (!cache.has(place.type)) {
        const color = iconColors[place.type] || markerConfig.defaultColor;
        cache.set(place.type, createCustomIcon(color));
      }
    }
    return cache;
  }, [filteredPlaces]);

  const giTagIcon = useMemo(() => createCustomIcon(iconColors["GI Tags"]), []);

  return (
    <LeafletMapContainer
      center={mapConfig.center}
      zoom={mapConfig.defaultZoom}
      rotate={true}
      touchRotate={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution={mapConfig.tileLayer.attribution}
        url={mapConfig.tileLayer.url}
      />

      {/* Compass — top-right on desktop, bottom-left on mobile; rotates with map bearing; click to reset */}
      <CompassMarker
        position="top-right"
        size={72}
        className="map-compass"
        rotation={mapBearing}
        onClick={handleCompassClick}
      />

      {/* Map rotation — enables leaflet-rotate, tracks bearing, shows rotation buttons */}
      <MapRotation ref={mapRotationRef} onBearingChange={handleBearingChange} />

      {/* Live Location + Measure Distance toggle button (stacked bottom-right) */}
      <LiveLocation
        isMeasureActive={isMeasureActive}
        onMeasureToggle={handleMeasureToggle}
        onMeasurePointAdd={setPendingMeasurePoint}
      />

      {/* Distance Measurement map layers (markers, line, result panel) */}
      <DistanceMeasure
        isActive={isMeasureActive}
        onToggle={handleMeasureToggle}
        pendingPoint={pendingMeasurePoint}
        onPendingPointConsumed={() => setPendingMeasurePoint(null)}
      />

      {/* Tourist Places */}
      <LayerGroup>
        {filteredPlaces.map((place, index) => {
          const icon =
            iconCacheByType.get(place.type) ||
            createCustomIcon(markerConfig.defaultColor);
          return (
            <PlaceMarker
              key={`place-${index}`}
              place={place}
              index={index}
              icon={icon}
            />
          );
        })}
      </LayerGroup>

      {/* GI Tags */}
      {showGiTags && (
        <LayerGroup>
          {filteredGiTags.map((item, index) => (
            <GITagMarker
              key={`gi-${index}`}
              item={item}
              index={index}
              icon={giTagIcon}
            />
          ))}
        </LayerGroup>
      )}
    </LeafletMapContainer>
  );
}
