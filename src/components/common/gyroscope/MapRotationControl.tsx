import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGyroscope } from "./useGyroscope";

interface MapRotationControlProps {
  enabled?: boolean;
  smoothRotation?: boolean;
}

export const MapRotationControl: React.FC<MapRotationControlProps> = ({
  enabled = false,
  smoothRotation = true,
}) => {
  const map = useMap();
  const { gyroData } = useGyroscope();

  useEffect(() => {
    if (!enabled || gyroData.alpha === null) {
      return;
    }

    // Get the map container
    const container = map.getContainer();

    // Calculate rotation angle (invert for proper orientation)
    const rotation = -gyroData.alpha;

    // Apply rotation with optional smoothing
    if (smoothRotation) {
      container.style.transition = "transform 0.3s ease-out";
    } else {
      container.style.transition = "none";
    }

    // Apply the rotation transform
    container.style.transform = `rotate(${rotation}deg)`;
    container.style.transformOrigin = "center center";

    // Adjust map panes to counter-rotate labels and markers
    const panes = map.getPanes();
    if (panes.markerPane) {
      (panes.markerPane as HTMLElement).style.transform =
        `rotate(${-rotation}deg)`;
    }
    if (panes.popupPane) {
      (panes.popupPane as HTMLElement).style.transform =
        `rotate(${-rotation}deg)`;
    }

    return () => {
      // Cleanup rotation when disabled
      if (!enabled) {
        container.style.transform = "";
        container.style.transition = "";
        if (panes.markerPane) {
          (panes.markerPane as HTMLElement).style.transform = "";
        }
        if (panes.popupPane) {
          (panes.popupPane as HTMLElement).style.transform = "";
        }
      }
    };
  }, [map, gyroData.alpha, enabled, smoothRotation]);

  return null; // This is a non-visual component
};

// Custom Leaflet Control for toggling map rotation
export class RotationToggleControl extends L.Control {
  private button?: HTMLButtonElement;
  private isEnabled: boolean = false;
  private onToggle?: (enabled: boolean) => void;

  constructor(
    options?: L.ControlOptions & { onToggle?: (enabled: boolean) => void },
  ) {
    super(options);
    this.onToggle = options?.onToggle;
  }

  onAdd(map: L.Map): HTMLElement {
    const container = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control rotation-toggle-control",
    );

    this.button = L.DomUtil.create(
      "button",
      "rotation-toggle-button",
      container,
    ) as HTMLButtonElement;
    this.button.innerHTML = "🧭";
    this.button.title = "Toggle Map Rotation (Gyroscope)";
    this.button.style.fontSize = "20px";
    this.button.style.width = "34px";
    this.button.style.height = "34px";
    this.button.style.border = "none";
    this.button.style.background = "white";
    this.button.style.cursor = "pointer";
    this.button.style.borderRadius = "4px";
    this.button.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(this.button, "click", this.toggle, this);

    this.updateButton();

    return container;
  }

  onRemove(map: L.Map): void {
    if (this.button) {
      L.DomEvent.off(this.button, "click", this.toggle, this);
    }
  }

  toggle = (): void => {
    this.isEnabled = !this.isEnabled;
    this.updateButton();
    if (this.onToggle) {
      this.onToggle(this.isEnabled);
    }
  };

  private updateButton(): void {
    if (this.button) {
      this.button.style.background = this.isEnabled ? "#4CAF50" : "white";
      this.button.style.color = this.isEnabled ? "white" : "black";
    }
  }
}
