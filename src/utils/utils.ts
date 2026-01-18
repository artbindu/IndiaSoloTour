import L from "leaflet";
import {
  markerConfig,
  heritageIcons,
  heritageColors,
  HeritageType,
} from "../config/config";
import { Place } from "../models/Places";
import { GITagItem } from "../models/Items";

/**
 * Creates a custom Leaflet marker icon with the specified color
 * @param color - The background color for the marker
 * @returns A Leaflet DivIcon with custom styling
 */
export const createCustomIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: ${markerConfig.size}px; height: ${markerConfig.size}px; border-radius: 50%; border: ${markerConfig.borderWidth}px solid ${markerConfig.borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [markerConfig.size, markerConfig.size],
    iconAnchor: [markerConfig.size / 2, markerConfig.size / 2],
  });
};

/**
 * Creates a custom icon for the user's current location
 * @returns A Leaflet DivIcon styled for current location marker
 */
export const createCurrentLocationIcon = (): L.DivIcon => {
  return L.divIcon({
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
};

/**
 * Filters places based on location type and state
 * @param places - Array of places to filter
 * @param locationTypeFilter - Filter by location type ('all' for no filter)
 * @param stateFilter - Filter by state ('all' for no filter)
 * @returns Filtered array of places
 */
export const filterPlaces = (
  places: Place[],
  locationTypeFilter: string,
  stateFilter: string,
): Place[] => {
  return places.filter((place) => {
    // Location Type Filter
    if (locationTypeFilter !== "all" && place.type !== locationTypeFilter) {
      return false;
    }
    // State Filter
    if (stateFilter !== "all" && place.state !== stateFilter) {
      return false;
    }
    return true;
  });
};

/**
 * Filters GI Tags based on state and visibility
 * @param giTags - Array of GI tags to filter
 * @param showGiTags - Whether to show GI tags
 * @param stateFilter - Filter by state ('all' for no filter)
 * @returns Filtered array of GI tags
 */
export const filterGiTags = (
  giTags: GITagItem[],
  showGiTags: boolean,
  stateFilter: string = "all",
): GITagItem[] => {
  if (!showGiTags) {
    return [];
  }

  return giTags.filter((item) => {
    // State Filter (currently commented out in original code, but available)
    // if (stateFilter !== 'all' && item.state !== stateFilter) {
    //   return false;
    // }
    return true;
  });
};

/**
 * Gets unique location types from places, optionally filtered by state
 * @param places - Array of places
 * @param stateFilter - Optional state filter ('all' for no filter)
 * @returns Array of unique location types
 */
export const getUniqueTypes = (
  places: Place[],
  stateFilter: string = "all",
): string[] => {
  return [
    ...new Set(
      places
        .filter((place) => stateFilter === "all" || place.state === stateFilter)
        .map((place) => place.type),
    ),
  ];
};

/**
 * Gets unique states from places and GI tags
 * @param places - Array of places
 * @param giTags - Array of GI tags
 * @returns Sorted array of unique states
 */
export const getUniqueStates = (
  places: Place[],
  giTags: GITagItem[],
): string[] => {
  return [
    ...new Set([
      ...places.map((place) => place.state),
      ...giTags.map((item) => item.state),
    ]),
  ].sort();
};

/**
 * Counts places by type, optionally filtered by state
 * @param places - Array of places
 * @param type - Type to count ('all' for total count)
 * @param stateFilter - Optional state filter ('all' for no filter)
 * @returns Count of places matching the criteria
 */
export const countPlacesByType = (
  places: Place[],
  type: string,
  stateFilter: string = "all",
): number => {
  if (type === "all") {
    return places.filter(
      (p) => stateFilter === "all" || p.state === stateFilter,
    ).length;
  }
  return places.filter(
    (p) =>
      p.type === type && (stateFilter === "all" || p.state === stateFilter),
  ).length;
};

/**
 * Validates if coordinates are present and valid
 * @param coordinates - Coordinate object with lat and long properties
 * @returns true if coordinates are valid, false otherwise
 */
export const hasValidCoordinates = (coordinates: {
  lat?: number;
  long?: number;
}): boolean => {
  return !!(
    coordinates &&
    coordinates.lat !== undefined &&
    coordinates.long !== undefined
  );
};

/**
 * Handles filter changes and auto-hides sidebar on mobile
 * @param callback - Function to execute for the filter change
 * @param setSidebarOpen - Function to update sidebar state
 * @param mobileBreakpoint - Screen width threshold for mobile (default: 768px)
 */
export const handleFilterChange = (
  callback: () => void,
  setSidebarOpen: (open: boolean) => void,
  mobileBreakpoint: number = 768,
): void => {
  callback();
  if (window.innerWidth <= mobileBreakpoint) {
    setTimeout(() => setSidebarOpen(false), 300);
  }
};

/**
 * Gets geolocation error message based on error code
 * @param error - GeolocationPositionError object
 * @returns Human-readable error message
 */
export const getGeolocationErrorMessage = (
  error: GeolocationPositionError,
): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Please enable location access.";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable.";
    case error.TIMEOUT:
      return "Location request timed out.";
    default:
      return "Unable to retrieve location";
  }
};

/**
 * Formats an array of months into a comma-separated string
 * @param months - Array of month names
 * @returns Comma-separated string of months
 */
export const formatMonths = (months: string[]): string => {
  return months.join(", ");
};

/**
 * Checks if a place has any heritage designation
 * @param heritage - Heritage object with unesco, national, state properties
 * @returns true if place has any heritage designation
 */
export const hasHeritage = (heritage?: {
  unesco?: boolean;
  national?: boolean;
  state?: boolean;
}): boolean => {
  if (!heritage) return false;
  return !!(heritage.unesco || heritage.national || heritage.state);
};

/**
 * Gets heritage display text from heritage object
 * @param heritage - Heritage object with unesco, national, state properties
 * @returns Formatted heritage text
 */
export const getHeritageText = (heritage: {
  unesco?: boolean;
  national?: boolean;
  state?: boolean;
}): string => {
  const types: string[] = [];
  if (heritage.unesco) types.push("UNESCO");
  if (heritage.national) types.push("National");
  if (heritage.state) types.push("State");
  return types.join(", ");
};

/**
 * Gets the appropriate heritage icon based on heritage status
 * @param heritage - Heritage object with unesco, national, state properties
 * @returns Heritage icon string or empty string
 */
export const getHeritageIcon = (heritage?: {
  unesco?: boolean;
  national?: boolean;
  state?: boolean;
}): string => {
  if (!heritage) return "";
  if (heritage.unesco) return heritageIcons[HeritageType.UNESCO];
  if (heritage.national) return heritageIcons[HeritageType.NATIONAL];
  if (heritage.state) return heritageIcons[HeritageType.STATE];
  return "";
};

/**
 * Gets the appropriate heritage background color based on heritage status
 * @param heritage - Heritage object with unesco, national, state properties
 * @returns Heritage color string or 'transparent'
 */
export const getHeritageColor = (heritage?: {
  unesco?: boolean;
  national?: boolean;
  state?: boolean;
}): string => {
  if (!heritage) return "transparent";
  if (heritage.unesco) return heritageColors[HeritageType.UNESCO];
  if (heritage.national) return heritageColors[HeritageType.NATIONAL];
  if (heritage.state) return heritageColors[HeritageType.STATE];
  return "transparent";
};
