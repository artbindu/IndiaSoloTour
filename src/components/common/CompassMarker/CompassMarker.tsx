import React from "react";
import "./CompassMarker.css";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CompassPositionPreset =
  | "top-center"
  | "top-left"
  | "top-right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "center-left"
  | "center-right";

export interface CompassPositionCustom {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}

export interface CompassMarkerProps {
  /** Extra class names applied to the wrapper */
  className?: string;
  /** Inline styles merged onto the wrapper (after position/size resolution) */
  style?: React.CSSProperties;
  /**
   * Where to anchor the compass on the map.
   * Pass a preset string or a custom `{top, right, bottom, left}` object.
   * @default "top-center"
   */
  position?: CompassPositionPreset | CompassPositionCustom;
  /** Diameter of the compass in pixels. @default 72 */
  size?: number;
  /**
   * Rotation in degrees — use to match the map's bearing.
   * 0° = North points up.
   * @default 0
   */
  rotation?: number;
  /** Optional click handler (e.g., to reset map bearing to North) */
  onClick?: () => void;
}

// ─────────────────────────────────────────────
// Position helpers
// ─────────────────────────────────────────────

const GAP = 10; // px from edge

function resolvePositionStyle(
  pos: CompassPositionPreset | CompassPositionCustom = "top-center",
): React.CSSProperties {
  if (typeof pos !== "string") {
    // Custom object — pass through as-is
    return pos as React.CSSProperties;
  }

  switch (pos) {
    case "top-left":
      return { top: GAP, left: GAP };
    case "top-right":
      return { top: GAP, right: GAP };
    case "top-center":
      return { top: GAP, left: "50%", transform: "translateX(-50%)" };
    case "bottom-left":
      return { bottom: GAP, left: GAP };
    case "bottom-right":
      return { bottom: GAP, right: GAP };
    case "bottom-center":
      return { bottom: GAP, left: "50%", transform: "translateX(-50%)" };
    case "center-left":
      return { top: "50%", left: GAP, transform: "translateY(-50%)" };
    case "center-right":
      return { top: "50%", right: GAP, transform: "translateY(-50%)" };
    default:
      return { top: GAP, left: "50%", transform: "translateX(-50%)" };
  }
}

// ─────────────────────────────────────────────
// CompassMarker
// ─────────────────────────────────────────────

/**
 * A purely visual compass overlay.  Place it inside any relatively-positioned
 * map container (Leaflet, Mapbox, plain div, etc.) — it has no map-specific
 * dependencies and does not block pointer events on the map beneath it.
 */
export function CompassMarker({
  className = "",
  style,
  position = "top-center",
  size = 72,
  rotation = 0,
  onClick,
}: CompassMarkerProps): JSX.Element {
  const positionStyle = resolvePositionStyle(position);

  // When a preset centers with translateX/Y we must combine with the rotation
  // transform. Keep them separate: position on wrapper, rotation on the SVG.
  const wrapperStyle: React.CSSProperties = {
    ...positionStyle,
    ...style,
    width: size,
    height: size,
    cursor: onClick ? "pointer" : "default",
    pointerEvents: onClick ? "auto" : "none",
  };

  // SVG coordinate constants (viewBox 0 0 80 80, center 40 40, ring r 28)
  const cx = 40;
  const cy = 40;
  const r = 28;

  return (
    <div
      className={`compass-marker ${className}`}
      style={wrapperStyle}
      role={onClick ? "button" : "img"}
      aria-label={`Compass — North is ${rotation === 0 ? "up" : `${rotation}° clockwise`}${onClick ? " — Click to reset" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : -1}
    >
      <svg
        viewBox="0 0 80 80"
        width={size}
        height={size}
        style={{ display: "block", transform: `rotate(${rotation}deg)` }}
        aria-hidden="true"
        focusable="false"
      >
        {/* ── Drop shadow filter ── */}
        <defs>
          <filter
            id="compass-shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="2"
              floodColor="rgba(0,0,0,0.25)"
            />
          </filter>
        </defs>

        {/* ── Background disc ── */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 2}
          fill="rgba(255,255,255,0.9)"
          filter="url(#compass-shadow)"
        />

        {/* ── Outer ring ── */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#c8c8c8"
          strokeWidth="1.5"
        />

        {/* ── Cardinal tick marks ── */}
        {/* North */}
        <line
          x1={cx}
          y1={cy - r}
          x2={cx}
          y2={cy - r + 7}
          stroke="#e53935"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* South */}
        <line
          x1={cx}
          y1={cy + r}
          x2={cx}
          y2={cy + r - 7}
          stroke="#888"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* East */}
        <line
          x1={cx + r}
          y1={cy}
          x2={cx + r - 7}
          y2={cy}
          stroke="#888"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* West */}
        <line
          x1={cx - r}
          y1={cy}
          x2={cx - r + 7}
          y2={cy}
          stroke="#888"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* ── North needle (red half) ── */}
        <polygon
          points={`${cx},${cy - r + 9} ${cx + 3},${cy} ${cx},${cy - 6} ${cx - 3},${cy}`}
          fill="#e53935"
        />

        {/* ── South needle (dark half) ── */}
        <polygon
          points={`${cx},${cy + r - 9} ${cx + 3},${cy} ${cx},${cy + 6} ${cx - 3},${cy}`}
          fill="#555"
        />

        {/* ── Center cap ── */}
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          fill="#fff"
          stroke="#aaa"
          strokeWidth="1"
        />

        {/* ── Cardinal labels ── */}
        {/* N — red, bold, outside ring near top */}
        <text
          x={cx}
          y={cy - r - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, Arial, sans-serif"
          fontWeight="800"
          fontSize="10"
          fill="#e53935"
          letterSpacing="0"
        >
          N
        </text>
        {/* S */}
        <text
          x={cx}
          y={cy + r + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, Arial, sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="#666"
        >
          S
        </text>
        {/* E */}
        <text
          x={cx + r + 6}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, Arial, sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="#666"
        >
          E
        </text>
        {/* W */}
        <text
          x={cx - r - 6}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, Arial, sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="#666"
        >
          W
        </text>
      </svg>
    </div>
  );
}
