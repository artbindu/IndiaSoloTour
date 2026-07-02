/**
 * Type declarations for leaflet-rotate
 * https://github.com/Raruto/leaflet-rotate
 *
 * The package has no official @types — this extends Leaflet's built-in types.
 */

// Side-effect import — patching L.Map at load time
declare module "leaflet-rotate" {
  const _default: undefined;
  export default _default;
}

// Extend Leaflet's own types
import "leaflet";

declare module "leaflet" {
  interface MapOptions {
    /** Enable map rotation (requires leaflet-rotate). @default false */
    rotate?: boolean;
    /** Initial bearing in degrees. @default 0 */
    bearing?: number;
    /** Enable touch-rotation gesture. @default true when rotate is true */
    touchRotate?: boolean;
  }

  interface Map {
    /** Returns the current map bearing in degrees (0 = North). */
    getBearing(): number;
    /** Rotates the map to the given bearing (degrees, clockwise from North). */
    setBearing(bearing: number, options?: ZoomPanOptions): this;
  }
}
