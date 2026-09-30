import React from "react";
import { GITagItem } from "../../../models/Items";
import { Place } from "../../../models/Places";
import { GeocodeResult } from "../../../utils/geocode";
import { getHeritageColor, getHeritageIcon } from "../../../utils/utils";

export function PlacePopupContent({ place }: { place: Place }): JSX.Element {
  return (
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
        {place.name}{" "}
        {place.url && (
          <a href={place.url} target="_blank" rel="noopener noreferrer">
            🎥
          </a>
        )}
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
      {place.description && <p className="description">{place.description}</p>}
      {place.bestVisitMonths && (
        <p>
          <strong>Best Visit:</strong> {place.bestVisitMonths.join(", ")}
        </p>
      )}
    </div>
  );
}

export function GITagPopupContent({ item }: { item: GITagItem }): JSX.Element {
  return (
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
      {item.description && <p className="description">{item.description}</p>}
    </div>
  );
}

export function GeocodePopupContent({
  result,
}: {
  result: GeocodeResult;
}): JSX.Element {
  return (
    <div className="popup-content">
      <h3>{result.displayName}</h3>
      <p>
        <strong>Latitude:</strong> {result.lat.toFixed(6)}
      </p>
      <p>
        <strong>Longitude:</strong> {result.lng.toFixed(6)}
      </p>
      <p>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data © OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
