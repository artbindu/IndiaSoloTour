import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
  MutableRefObject,
} from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import "./MapView.css";
import {
  features,
  iconColors,
  mapConfig,
  markerConfig,
} from "../../../config/config";
import { Place } from "../../../models/Places";
import { GITagItem } from "../../../models/Items";
import { MapSearch } from "../../common/MapSearch/MapSearch";
import { LiveLocation } from "../../common/LiveLocation/LiveLocation";
import { DistanceMeasure } from "../../common/DistanceMeasure/DistanceMeasure";
import { CompassMarker } from "../../common/CompassMarker/CompassMarker";
import {
  MapRotation,
  type MapRotationHandle,
} from "../../common/MapRotation/MapRotation";
import { createCustomIcon, hasValidCoordinates } from "../../../utils/utils";
import { getSearchEntryId, SearchEntry } from "../../../utils/search";
import { GITagPopupContent, PlacePopupContent } from "./MapPopups";

// Fix default marker icon paths for webpack builds.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  filteredPlaces: Place[];
  filteredGiTags: GITagItem[];
  allPlaces: Place[];
  allGiTags: GITagItem[];
  showGiTags: boolean;
  onSearchSelection?: () => void;
}

type MarkerRegistry = MutableRefObject<Map<string, L.Marker>>;

const registerMarker = (
  markerRefs: MarkerRegistry,
  id: string,
  marker: L.Marker | null,
): void => {
  if (marker) {
    markerRefs.current.set(id, marker);
  } else {
    markerRefs.current.get(id)?.closePopup();
    markerRefs.current.delete(id);
  }
};

/**
 * PlaceMarker — memoized to prevent re-renders when parent state changes
 * Only re-renders if the place object reference changes
 */
const PlaceMarker = memo<{
  place: Place;
  id: string;
  icon: L.Icon | L.DivIcon;
  markerRefs: MarkerRegistry;
}>(({ place, id, icon, markerRefs }) => {
  const setMarkerRef = useCallback(
    (marker: L.Marker | null) => registerMarker(markerRefs, id, marker),
    [id, markerRefs],
  );
  if (!hasValidCoordinates(place.coordinates)) return null;
  return (
    <Marker
      ref={setMarkerRef}
      position={[place.coordinates.lat, place.coordinates.long]}
      icon={icon as L.Icon}
    >
      <Popup>
        <PlacePopupContent place={place} />
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
  id: string;
  icon: L.Icon | L.DivIcon;
  markerRefs: MarkerRegistry;
}>(({ item, id, icon, markerRefs }) => {
  const setMarkerRef = useCallback(
    (marker: L.Marker | null) => registerMarker(markerRefs, id, marker),
    [id, markerRefs],
  );
  if (!hasValidCoordinates(item.coordinates)) return null;
  return (
    <Marker
      ref={setMarkerRef}
      position={[item.coordinates.lat, item.coordinates.long]}
      icon={icon as L.Icon}
    >
      <Popup>
        <GITagPopupContent item={item} />
      </Popup>
    </Marker>
  );
});
GITagMarker.displayName = "GITagMarker";

export function MapView({
  filteredPlaces,
  filteredGiTags,
  allPlaces,
  allGiTags,
  showGiTags,
  onSearchSelection,
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
  const [temporaryResult, setTemporaryResult] = useState<SearchEntry | null>(
    null,
  );
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const selectedResultId = temporaryResult?.id;
  const setSelectedMarkerRef = useCallback(
    (marker: L.Marker | null) => {
      if (selectedResultId) {
        registerMarker(markerRefs, selectedResultId, marker);
      }
    },
    [selectedResultId],
  );

  const visiblePlaces = useMemo(
    () =>
      Array.from(
        new Map(
          filteredPlaces.map((place) => [
            getSearchEntryId("place", place),
            place,
          ]),
        ).values(),
      ),
    [filteredPlaces],
  );
  const visibleGiTags = useMemo(
    () =>
      Array.from(
        new Map(
          filteredGiTags.map((item) => [getSearchEntryId("gi", item), item]),
        ).values(),
      ),
    [filteredGiTags],
  );

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
    for (const place of visiblePlaces) {
      if (!cache.has(place.type)) {
        const color = iconColors[place.type] || markerConfig.defaultColor;
        cache.set(place.type, createCustomIcon(color));
      }
    }
    return cache;
  }, [visiblePlaces]);

  const giTagIcon = useMemo(() => createCustomIcon(iconColors["GI Tags"]), []);

  const isResultVisible = useCallback(
    (entry: SearchEntry): boolean => {
      if (entry.kind === "place") {
        return visiblePlaces.some(
          (place) => getSearchEntryId("place", place) === entry.id,
        );
      }
      return (
        showGiTags &&
        visibleGiTags.some((item) => getSearchEntryId("gi", item) === entry.id)
      );
    },
    [visiblePlaces, visibleGiTags, showGiTags],
  );

  const handleSearchSelection = useCallback(
    (entry: SearchEntry): void => {
      const visible = isResultVisible(entry);

      setTemporaryResult(visible ? null : entry);
      onSearchSelection?.();

      if (visible) {
        markerRefs.current.get(entry.id)?.openPopup();
      }
    },
    [isResultVisible, onSearchSelection],
  );

  const handleSearchClear = useCallback((): void => {
    setTemporaryResult(null);
  }, []);

  const resultColor = temporaryResult
    ? temporaryResult.kind === "gi"
      ? iconColors["GI Tags"]
      : iconColors[temporaryResult.type] || markerConfig.defaultColor
    : markerConfig.defaultColor;
  const selectedResultIcon = useMemo(
    () =>
      L.divIcon({
        className: "search-selected-marker",
        html: `<span class="search-selected-marker__dot" style="background-color:${resultColor}"></span>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    [resultColor],
  );

  useEffect(() => {
    if (temporaryResult && !isResultVisible(temporaryResult)) {
      const timeout = window.setTimeout(() => {
        markerRefs.current.get(temporaryResult.id)?.openPopup();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [temporaryResult, isResultVisible]);

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

      {features.search && (
        <MapSearch
          places={allPlaces}
          giTags={allGiTags}
          onSelectResult={handleSearchSelection}
          onClear={handleSearchClear}
        />
      )}

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
        {visiblePlaces.map((place) => {
          const id = getSearchEntryId("place", place);
          const icon =
            iconCacheByType.get(place.type) ||
            createCustomIcon(markerConfig.defaultColor);
          return (
            <PlaceMarker
              key={id}
              id={id}
              place={place}
              icon={icon}
              markerRefs={markerRefs}
            />
          );
        })}
      </LayerGroup>

      {/* GI Tags */}
      {showGiTags && (
        <LayerGroup>
          {visibleGiTags.map((item) => {
            const id = getSearchEntryId("gi", item);
            return (
              <GITagMarker
                key={id}
                id={id}
                item={item}
                icon={giTagIcon}
                markerRefs={markerRefs}
              />
            );
          })}
        </LayerGroup>
      )}

      {temporaryResult && !isResultVisible(temporaryResult) && (
        <Marker
          key={`selected-${temporaryResult.id}`}
          position={temporaryResult.coordinates}
          icon={selectedResultIcon}
          zIndexOffset={1000}
          ref={setSelectedMarkerRef}
        >
          <Popup>
            {temporaryResult.kind === "place" ? (
              <PlacePopupContent place={temporaryResult.item as Place} />
            ) : (
              <GITagPopupContent item={temporaryResult.item as GITagItem} />
            )}
          </Popup>
        </Marker>
      )}
    </LeafletMapContainer>
  );
}
