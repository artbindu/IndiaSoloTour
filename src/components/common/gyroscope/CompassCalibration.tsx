import React from "react";
import "./CompassCalibration.css";

interface CompassCalibrationProps {
  /** Whether to show the calibration prompt */
  show: boolean;
  /** Callback when user dismisses the calibration prompt */
  onDismiss?: () => void;
}

/**
 * CompassCalibration component displays a visual guide for calibrating
 * the device compass. This is useful when compass readings are inaccurate.
 *
 * Usage:
 * <CompassCalibration show={needsCalibration} onDismiss={() => setNeedsCalibration(false)} />
 */
export const CompassCalibration: React.FC<CompassCalibrationProps> = ({
  show,
  onDismiss,
}) => {
  if (!show) return null;

  return (
    <div className="compass-calibration-overlay">
      <div className="compass-calibration-card">
        <div className="calibration-header">
          <h3>📱 Calibrate Compass</h3>
          <button className="close-button" onClick={onDismiss}>
            ✕
          </button>
        </div>

        <div className="calibration-content">
          <div className="calibration-animation">
            <div className="phone-icon">📱</div>
            <div className="rotation-indicator">↻</div>
          </div>

          <p className="calibration-instruction">
            Move your device in a figure-8 pattern to calibrate the compass
          </p>

          <div className="calibration-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">
                Hold device away from metal objects
              </span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">
                Rotate device in figure-8 motion
              </span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Wait for compass to stabilize</span>
            </div>
          </div>
        </div>

        <div className="calibration-footer">
          <button className="calibration-done-button" onClick={onDismiss}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to detect when compass needs calibration
 * Returns true if compass readings are jumping around too much
 */
export const useCompassCalibrationDetection = (
  alpha: number | null,
  threshold: number = 30,
): boolean => {
  const [needsCalibration, setNeedsCalibration] = React.useState(false);
  const readingsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    if (alpha === null) return;

    readingsRef.current = [...readingsRef.current, alpha].slice(-10); // Keep last 10 readings

    if (readingsRef.current.length >= 10) {
      // Calculate variance in readings
      const mean =
        readingsRef.current.reduce((a, b) => a + b, 0) /
        readingsRef.current.length;
      const variance =
        readingsRef.current.reduce(
          (sum, val) => sum + Math.pow(val - mean, 2),
          0,
        ) / readingsRef.current.length;

      // If variance is high, suggest calibration
      setNeedsCalibration(variance > threshold);
    }
  }, [alpha, threshold]);

  return needsCalibration;
};
