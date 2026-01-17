import { useState, useEffect } from "react";

export interface GyroscopeData {
  alpha: number | null; // Compass heading (0-360 degrees)
  beta: number | null; // Front-to-back tilt (-180 to 180)
  gamma: number | null; // Left-to-right tilt (-90 to 90)
  absolute: boolean;
  supported: boolean;
  permissionGranted: boolean;
}

export const useGyroscope = () => {
  const [gyroData, setGyroData] = useState<GyroscopeData>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
    supported:
      typeof window !== "undefined" && "DeviceOrientationEvent" in window,
    permissionGranted: false,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if DeviceOrientationEvent is supported
    if (!("DeviceOrientationEvent" in window)) {
      setError("Device orientation not supported on this device/browser");
      setGyroData((prev) => ({ ...prev, supported: false }));
      return;
    }

    setGyroData((prev) => ({ ...prev, supported: true }));

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setGyroData({
        alpha: event.alpha, // Compass direction (0-360)
        beta: event.beta, // Front-to-back tilt
        gamma: event.gamma, // Left-to-right tilt
        absolute: event.absolute,
        supported: true,
        permissionGranted: true,
      });
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            setGyroData((prev) => ({ ...prev, permissionGranted: true }));
          } else {
            setError("Permission denied for device orientation");
          }
        } catch (err) {
          setError("Error requesting device orientation permission");
          console.error(err);
        }
      } else {
        // For non-iOS devices, just add the listener
        window.addEventListener("deviceorientation", handleOrientation);
        setGyroData((prev) => ({ ...prev, permissionGranted: true }));
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permission === "granted") {
          setGyroData((prev) => ({ ...prev, permissionGranted: true }));
          setError(null);
          return true;
        } else {
          setError("Permission denied");
          return false;
        }
      } catch (err) {
        setError("Permission request failed");
        return false;
      }
    }
    return true; // Already granted or not needed
  };

  return { gyroData, error, requestPermission };
};
