import React, { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import { RotationToggleControl } from "./MapRotationControl";
import { MapRotationControl } from "./MapRotationControl";

/**
 * Example component showing how to add map rotation control
 * This is an optional advanced feature that can be added to MapView
 *
 * Usage in MapView.tsx:
 *
 * import { MapRotationExample } from '../../common/gyroscope/MapRotationExample';
 *
 * <LeafletMapContainer ...>
 *   <MapRotationExample />
 * </LeafletMapContainer>
 */
export const MapRotationExample: React.FC = () => {
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const map = useMap();

  useEffect(() => {
    // Add the rotation toggle control to the map
    const control = new RotationToggleControl({
      position: "topleft",
      onToggle: (enabled: boolean) => {
        setRotationEnabled(enabled);
        console.log("Map rotation:", enabled ? "enabled" : "disabled");
      },
    });

    map.addControl(control);

    // Cleanup
    return () => {
      map.removeControl(control);
    };
  }, [map]);

  return <MapRotationControl enabled={rotationEnabled} smoothRotation={true} />;
};

/**
 * Alternative simpler version without toggle button
 * The rotation is controlled via props
 *
 * Usage in MapView.tsx:
 *
 * const [enableRotation, setEnableRotation] = useState(false);
 *
 * <LeafletMapContainer ...>
 *   <SimpleMapRotation enabled={enableRotation} />
 * </LeafletMapContainer>
 */
export const SimpleMapRotation: React.FC<{ enabled: boolean }> = ({
  enabled,
}) => {
  return <MapRotationControl enabled={enabled} smoothRotation={true} />;
};
