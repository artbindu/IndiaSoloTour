import React, { useState, useEffect, useRef, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import "./LiveLocation.css";
import {
  createCurrentLocationIcon,
  getGeolocationErrorMessage,
  generateShareUrl,
  copyToClipboard,
} from "../../../utils/utils";

// ─────────────────────────────────────────────
// LocationMarker — flies map to position on change
// ─────────────────────────────────────────────
interface LocationMarkerProps {
  position: [number, number];
  isTracking: boolean;
  shareUrl: string | null;
}

function LocationMarker({
  position,
  isTracking,
  shareUrl,
}: LocationMarkerProps): JSX.Element {
  const map = useMap();
  const hasCenteredRef = useRef<boolean>(false);

  useEffect(() => {
    if (position) {
      if (!hasCenteredRef.current) {
        // First fix: fly to location
        map.flyTo(position, 13, { duration: 1.5 });
        hasCenteredRef.current = true;
      } else if (isTracking) {
        // Subsequent updates while tracking: smooth pan (no zoom change)
        map.panTo(position, { animate: true, duration: 0.5 });
      }
    }
  }, [position, map, isTracking]);

  const currentLocationIcon = createCurrentLocationIcon();

  return (
    <Marker position={position} icon={currentLocationIcon}>
      <Popup>
        <div className="popup-content">
          <h3>
            {isTracking ? "📡 Live Location" : "📍 Your Location"}
          </h3>
          <p>
            <strong>Lat:</strong> {position[0].toFixed(6)}
          </p>
          <p>
            <strong>Lng:</strong> {position[1].toFixed(6)}
          </p>
          {isTracking && shareUrl && (
            <p className="live-tracking-badge">🟢 Live tracking active</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface LiveLocationProps {
  onLocationChange?: (location: [number, number] | null) => void;
  isMeasureActive?: boolean;
  onMeasureToggle?: () => void;
}

// ─────────────────────────────────────────────
// Share toast states
// ─────────────────────────────────────────────
type ShareStatus = "idle" | "copied" | "shared" | "error";

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function LiveLocation({
  onLocationChange,
  isMeasureActive = false,
  onMeasureToggle,
}: LiveLocationProps): JSX.Element {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Share / tracking state
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");

  // watchId ref — so we can clearWatch() on stop
  const watchIdRef = useRef<number | null>(null);

  // ── One-shot: get current location (existing behaviour) ──────────────
  const getCurrentLocation = useCallback((): void => {
    if (isTracking) return; // Don't fire if already tracking
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
        if (onLocationChange) onLocationChange(location);
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [isTracking, onLocationChange]);

  // ── Start live tracking ───────────────────────────────────────────────
  const startTracking = useCallback((): void => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError(null);
    setIsTracking(true);
    setLocationLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        setCurrentLocation(location);
        setLocationLoading(false);
        setLocationError(null);

        // Auto-update the share URL with latest coords
        const url = generateShareUrl(latitude, longitude);
        setShareUrl(url);

        if (onLocationChange) onLocationChange(location);
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        setLocationLoading(false);
        setIsTracking(false);
        setShareUrl(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // always fresh position
      },
    );

    watchIdRef.current = watchId;
  }, [onLocationChange]);

  // ── Stop live tracking ────────────────────────────────────────────────
  const stopTracking = useCallback((): void => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setShareUrl(null);
    setShareStatus("idle");
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── Share the live location URL ───────────────────────────────────────
  const handleShare = useCallback(async (): Promise<void> => {
    if (!shareUrl || !currentLocation) return;

    // Try Web Share API first (mobile native share sheet)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "🇮🇳 India Solo Tour — My Live Location",
          text: `Track my live location on the India Solo Tour map!`,
          url: shareUrl,
        });
        setShareStatus("shared");
      } catch {
        // User dismissed share sheet — fall back to clipboard
        const success = await copyToClipboard(shareUrl);
        setShareStatus(success ? "copied" : "error");
      }
    } else {
      // Desktop: copy to clipboard
      const success = await copyToClipboard(shareUrl);
      setShareStatus(success ? "copied" : "error");
    }

    // Reset status badge after 3s
    setTimeout(() => setShareStatus("idle"), 3000);
  }, [shareUrl, currentLocation]);

  // ── Toast message for share status ───────────────────────────────────
  const shareStatusMessage: Record<ShareStatus, string> = {
    idle: "",
    copied: "✅ Link copied!",
    shared: "✅ Shared!",
    error: "❌ Failed to copy",
  };

  return (
    <>
      {/* Live Location Marker on map */}
      {currentLocation && (
        <LocationMarker
          position={currentLocation}
          isTracking={isTracking}
          shareUrl={shareUrl}
        />
      )}

      {/* ── Bottom-right button stack ── */}
      <div className="location-button-container">

        {/* Measure Distance button — top of stack */}
        {onMeasureToggle && (
          <button
            className={`measure-distance-btn ${isMeasureActive ? "active" : ""}`}
            onClick={onMeasureToggle}
            title={isMeasureActive ? "Exit Measure Mode" : "Measure Distance"}
          >
            📏
          </button>
        )}

        {/* Share Live Location button — only when tracking is active */}
        {isTracking && shareUrl && (
          <button
            className={`share-location-btn ${shareStatus !== "idle" ? "shared" : ""}`}
            onClick={handleShare}
            title="Share my live location"
          >
            {shareStatus === "copied" || shareStatus === "shared" ? "✅" : "🔗"}
          </button>
        )}

        {/* Live Track toggle button */}
        <button
          className={`live-track-btn ${isTracking ? "active" : ""}`}
          onClick={isTracking ? stopTracking : startTracking}
          title={isTracking ? "Stop live tracking" : "Start live tracking"}
        >
          {isTracking ? "📡" : "📡"}
          <span className={`live-track-dot ${isTracking ? "pulsing" : ""}`} />
        </button>

        {/* One-shot location button */}
        <button
          className="location-button"
          onClick={getCurrentLocation}
          disabled={locationLoading || isTracking}
          title={isTracking ? "Stop tracking to use this" : "Get my location"}
        >
          {locationLoading && !isTracking ? "🗺️" : "📍"}
        </button>

        {/* Share status toast */}
        {shareStatus !== "idle" && (
          <div className="share-toast">{shareStatusMessage[shareStatus]}</div>
        )}

        {/* Error message */}
        {locationError && (
          <div className="location-error">{locationError}</div>
        )}
      </div>
    </>
  );
}