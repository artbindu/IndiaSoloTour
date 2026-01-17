/**
 * Type definitions for Gyroscope/Compass components
 */

/**
 * Device orientation data from gyroscope/magnetometer
 */
export interface GyroscopeData {
  /** Compass heading in degrees (0-360), where 0 is North */
  alpha: number | null;

  /** Front-to-back tilt in degrees (-180 to 180) */
  beta: number | null;

  /** Left-to-right tilt in degrees (-90 to 90) */
  gamma: number | null;

  /** Whether the orientation values are absolute (relative to Earth's coordinate frame) */
  absolute: boolean;

  /** Whether device orientation is supported by the browser/device */
  supported: boolean;

  /** Whether permission has been granted to access device orientation */
  permissionGranted: boolean;
}

/**
 * Cardinal direction abbreviation
 */
export type CardinalDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

/**
 * Gyroscope hook return type
 */
export interface UseGyroscopeReturn {
  /** Current gyroscope data */
  gyroData: GyroscopeData;

  /** Error message if any */
  error: string | null;

  /** Function to request device orientation permission (mainly for iOS) */
  requestPermission: () => Promise<boolean>;
}

/**
 * Props for GyroscopeCompass component
 */
export interface GyroscopeCompassProps {
  /** Callback fired when heading changes */
  onHeadingChange?: (heading: number) => void;

  /** Show debug information (alpha, beta, gamma values) */
  showDebugInfo?: boolean;

  /** Custom CSS class name */
  className?: string;
}

/**
 * Props for MapRotationControl component
 */
export interface MapRotationControlProps {
  /** Enable or disable map rotation */
  enabled?: boolean;

  /** Use smooth CSS transitions for rotation */
  smoothRotation?: boolean;

  /** Update interval in milliseconds (default: based on deviceorientation events) */
  updateInterval?: number;
}

/**
 * Options for RotationToggleControl
 */
export interface RotationToggleControlOptions {
  /** Position of the control on the map */
  position?: "topleft" | "topright" | "bottomleft" | "bottomright";

  /** Callback when rotation is toggled */
  onToggle?: (enabled: boolean) => void;

  /** Custom button text or emoji */
  buttonContent?: string;

  /** Custom button title (tooltip) */
  buttonTitle?: string;
}

/**
 * Compass calibration status
 */
export type CalibrationStatus = "uncalibrated" | "calibrating" | "calibrated";

/**
 * Extended gyroscope data with calibration info
 */
export interface GyroscopeDataExtended extends GyroscopeData {
  /** Compass calibration accuracy (0-1, where 1 is best) */
  accuracy?: number;

  /** Calibration status */
  calibrationStatus?: CalibrationStatus;

  /** Timestamp of last update */
  timestamp?: number;
}
