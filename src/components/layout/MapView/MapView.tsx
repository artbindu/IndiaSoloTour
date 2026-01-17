import React from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import L from "leaflet";
import "./MapView.css";
import { mapConfig, iconColors, markerConfig } from "../../../config/config";
import { Place } from "../../../models/Places";
import { GITagItem } from "../../../models/Items";
import { LiveLocation } from "../../common/LiveLocation/LiveLocation";

// Custom marker icons for different categories
const createCustomIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: ${markerConfig.size}px; height: ${markerConfig.size}px; border-radius: 50%; border: ${markerConfig.borderWidth}px solid ${markerConfig.borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [markerConfig.size, markerConfig.size],
    iconAnchor: [markerConfig.size / 2, markerConfig.size / 2],
  });
};

interface MapViewProps {
  filteredPlaces: Place[];
  filteredGiTags: GITagItem[];
  showGiTags: boolean;
}

export function MapView({
  filteredPlaces,
  filteredGiTags,
  showGiTags,
}: MapViewProps): JSX.Element {
  return (
    <LeafletMapContainer
      center={mapConfig.center}
      zoom={mapConfig.defaultZoom}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution={mapConfig.tileLayer.attribution}
        url={mapConfig.tileLayer.url}
      />

      {/* Live Location Component */}
      <LiveLocation />

      {/* Tourist Places */}
      <LayerGroup>
        {filteredPlaces.map((place, index) => {
          if (
            !place.coordinates ||
            !place.coordinates.lat ||
            !place.coordinates.long
          ) {
            return null;
          }

          const color = iconColors[place.type] || markerConfig.defaultColor;
          const icon = createCustomIcon(color);

          return (
            <Marker
              key={`place-${index}`}
              position={[place.coordinates.lat, place.coordinates.long]}
              icon={icon}
            >
              <Popup>
                <div className="popup-content">
                  <h3>
                    {place.heritage?.unesco
                      ? "🪙"
                      : place.heritage?.national
                        ? "⭐"
                        : ""}
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
                      <strong>Best Visit:</strong>{" "}
                      {place.bestVisitMonths.join(", ")}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LayerGroup>

      {/* GI Tags */}
      {showGiTags && (
        <LayerGroup>
          {filteredGiTags.map((item, index) => {
            if (
              !item.coordinates ||
              !item.coordinates.lat ||
              !item.coordinates.long
            ) {
              return null;
            }

            const icon = createCustomIcon(iconColors["GI Tags"]);

            return (
              <Marker
                key={`gi-${index}`}
                position={[item.coordinates.lat, item.coordinates.long]}
                icon={icon}
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
          })}
        </LayerGroup>
      )}
    </LeafletMapContainer>
  );
}
