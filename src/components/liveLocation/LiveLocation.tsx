import React, { useState, useEffect } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./LiveLocation.css";

// Component to handle map centering
function LocationMarker({
  position,
}: {
  position: [number, number] | null;
}): JSX.Element | null {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.5 });
    }
  }, [position, map]);

  if (!position) return null;

  const currentLocationIcon = L.divIcon({
    className: "current-location-marker",
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #4285F4;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(66, 133, 244, 0.8);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker position={position} icon={currentLocationIcon}>
      <Popup>
        <div className="popup-content">
          <h3>📍 Your Location</h3>
          <p>You are here!</p>
        </div>
      </Popup>
    </Marker>
  );
}

interface LiveLocationProps {
  onLocationChange?: (location: [number, number] | null) => void;
}

export function LiveLocation({
  onLocationChange,
}: LiveLocationProps): JSX.Element {
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        setCurrentLocation(location);
        setLocationLoading(false);
        setLocationError(null);
        if (onLocationChange) {
          onLocationChange(location);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      {/* Current Location Marker */}
      {currentLocation && <LocationMarker position={currentLocation} />}

      {/* Current Location Button */}
      <div className="location-button-container">
        <button
          className="location-button"
          onClick={getCurrentLocation}
          disabled={locationLoading}
          title="Get my location"
        >
          {locationLoading ? "⏳" : "📍"}
        </button>
        {locationError && <div className="location-error">{locationError}</div>}
      </div>
    </>
  );
}
