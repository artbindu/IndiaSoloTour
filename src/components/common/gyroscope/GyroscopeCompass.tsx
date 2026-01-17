import React, { useState, useRef, useEffect } from "react";
import { useGyroscope } from "./useGyroscope";
import "./GyroscopeCompass.css";

interface GyroscopeCompassProps {
  onHeadingChange?: (heading: number) => void;
  showDebugInfo?: boolean;
}

export const GyroscopeCompass: React.FC<GyroscopeCompassProps> = ({
  onHeadingChange,
  showDebugInfo = false,
}) => {
  const { gyroData, error, requestPermission } = useGyroscope();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Position from bottom-right
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (gyroData.alpha !== null && onHeadingChange) {
      onHeadingChange(gyroData.alpha);
    }
  }, [gyroData.alpha, onHeadingChange]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX - (window.innerWidth - position.x),
      y: clientY - (window.innerHeight - position.y),
    };
  };

  // Handle drag move
  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const newX = window.innerWidth - clientX + dragStart.current.x;
      const newY = window.innerHeight - clientY + dragStart.current.y;

      // Constrain to viewport
      const constrainedX = Math.max(
        10,
        Math.min(window.innerWidth - 100, newX),
      );
      const constrainedY = Math.max(
        10,
        Math.min(window.innerHeight - 100, newY),
      );

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleDragMove);
      document.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);

  // Handle click to expand/collapse (only if not dragging)
  const handleClick = () => {
    if (!isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  // Normalize heading to 0-360
  const getHeading = (): number => {
    if (gyroData.alpha === null) return 0;
    return gyroData.alpha;
  };

  const heading = getHeading();

  // Convert heading to cardinal direction
  const getCardinalDirection = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round((deg % 360) / 45) % 8;
    return directions[index];
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  if (!gyroData.supported) {
    return (
      <div
        className="gyroscope-compass error"
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
      >
        <div className="compass-icon">🧭</div>
        <div className="error-text">Not Supported</div>
      </div>
    );
  }

  if (!gyroData.permissionGranted) {
    return (
      <div
        className="gyroscope-compass permission-needed"
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        ref={dragRef}
      >
        <button onClick={handleRequestPermission} className="permission-button">
          <div className="compass-icon">🧭</div>
          <div className="permission-text">Enable Compass</div>
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="gyroscope-compass error"
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
      >
        <div className="compass-icon">🧭</div>
        <div className="error-text">{error}</div>
      </div>
    );
  }

  if (gyroData.alpha === null) {
    return (
      <div
        className="gyroscope-compass loading"
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
      >
        <div className="compass-icon">🧭</div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`gyroscope-compass ${isExpanded ? "expanded" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
      onClick={handleClick}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <div className="compass-container">
        {/* Compass Rose */}
        <div
          className="compass-rose"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <div className="compass-needle">
            <div className="needle-north"></div>
            <div className="needle-south"></div>
          </div>
          <div className="compass-directions">
            <div className="direction north">N</div>
            <div className="direction east">E</div>
            <div className="direction south">S</div>
            <div className="direction west">W</div>
          </div>
        </div>

        {/* Center Dot */}
        <div className="compass-center"></div>

        {/* Heading Display */}
        <div className="heading-display">
          <div className="heading-value">{Math.round(heading)}°</div>
          <div className="heading-direction">
            {getCardinalDirection(heading)}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {isExpanded && showDebugInfo && (
        <div className="debug-info">
          <div className="debug-row">
            <span>Alpha (Heading):</span>
            <span>{gyroData.alpha?.toFixed(1)}°</span>
          </div>
          <div className="debug-row">
            <span>Beta (Tilt F/B):</span>
            <span>{gyroData.beta?.toFixed(1)}°</span>
          </div>
          <div className="debug-row">
            <span>Gamma (Tilt L/R):</span>
            <span>{gyroData.gamma?.toFixed(1)}°</span>
          </div>
          <div className="debug-row">
            <span>Absolute:</span>
            <span>{gyroData.absolute ? "Yes" : "No"}</span>
          </div>
        </div>
      )}
    </div>
  );
};
