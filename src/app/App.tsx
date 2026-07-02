import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./App.css";
import { dataSources, appConfig } from "../config/config";
import { Place } from "../models/Places";
import { GITagItem } from "../models/Items";
import { Sidebar } from "../components/layout/Sidebar/Sidebar";
import {
  filterPlaces,
  filterGiTags,
  getUniqueTypes,
  getUniqueStates,
  handleFilterChange as utilHandleFilterChange,
} from "../utils/utils";

const MapView = lazy(() =>
  import("../components/layout/MapView/MapView").then((module) => ({
    default: module.MapView,
  })),
);

function App(): JSX.Element {
  const [places, setPlaces] = useState<Place[]>([]);
  const [giTags, setGiTags] = useState<GITagItem[]>([]);
  const [userPreference, setUserPreference] = useState<boolean>(true);
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>("all");
  const [showGiTags, setShowGiTags] = useState<boolean>(false);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  const requestLocationAccess = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }

    setLocationPermission("checking");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission("granted");
      },
      () => {
        setLocationPermission("denied");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  useEffect(() => {
    requestLocationAccess();
  }, [requestLocationAccess]);

  useEffect(() => {
    if (locationPermission !== "granted") {
      return;
    }

    let isCancelled = false;

    const getLoadingStrategy = (): {
      priorityStateCount: number;
      backgroundChunkSize: number;
    } => {
      const nav = window.navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean };
        deviceMemory?: number;
      };

      const effectiveType = nav.connection?.effectiveType ?? "";
      const saveData = Boolean(nav.connection?.saveData);
      const deviceMemory = nav.deviceMemory ?? 4;

      // Prefer faster first paint on constrained devices/networks.
      if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
        return { priorityStateCount: 4, backgroundChunkSize: 2 };
      }

      if (effectiveType === "3g" || deviceMemory <= 4) {
        return { priorityStateCount: 6, backgroundChunkSize: 3 };
      }

      return { priorityStateCount: 10, backgroundChunkSize: 6 };
    };

    const waitForIdle = async (): Promise<void> => {
      await new Promise<void>((resolve) => {
        const ric = (
          window as Window & {
            requestIdleCallback?: (
              callback: () => void,
              options?: { timeout: number },
            ) => number;
          }
        ).requestIdleCallback;

        if (typeof ric === "function") {
          ric(() => resolve(), { timeout: 120 });
          return;
        }

        setTimeout(resolve, 0);
      });
    };

    const loadAllData = async (): Promise<void> => {
      try {
        const stateImports: { [key: string]: () => Promise<any> } = {
          AndhraPradesh: () => import("../data/state/AndhraPradesh.json"),
          ArunachalPradesh: () => import("../data/state/ArunachalPradesh.json"),
          Assam: () => import("../data/state/Assam.json"),
          Bihar: () => import("../data/state/Bihar.json"),
          Chhattisgarh: () => import("../data/state/Chhattisgarh.json"),
          Goa: () => import("../data/state/Goa.json"),
          Gujarat: () => import("../data/state/Gujarat.json"),
          Haryana: () => import("../data/state/Haryana.json"),
          HimachalPradesh: () => import("../data/state/HimachalPradesh.json"),
          Jharkhand: () => import("../data/state/Jharkhand.json"),
          Karnataka: () => import("../data/state/Karnataka.json"),
          Kerala: () => import("../data/state/Kerala.json"),
          MadhyaPradesh: () => import("../data/state/MadhyaPradesh.json"),
          Maharashtra: () => import("../data/state/Maharashtra.json"),
          Manipur: () => import("../data/state/Manipur.json"),
          Meghalaya: () => import("../data/state/Meghalaya.json"),
          Mizoram: () => import("../data/state/Mizoram.json"),
          Nagaland: () => import("../data/state/Nagaland.json"),
          Odisha: () => import("../data/state/Odisha.json"),
          Punjab: () => import("../data/state/Punjab.json"),
          Rajasthan: () => import("../data/state/Rajasthan.json"),
          Sikkim: () => import("../data/state/Sikkim.json"),
          TamilNadu: () => import("../data/state/TamilNadu.json"),
          Telangana: () => import("../data/state/Telangana.json"),
          Tripura: () => import("../data/state/Tripura.json"),
          Uttarakhand: () => import("../data/state/Uttarakhand.json"),
          UttarPradesh: () => import("../data/state/UttarPradesh.json"),
          WestBengal: () => import("../data/state/WestBengal.json"),
        };

        // Load UT files
        const utImports: { [key: string]: () => Promise<any> } = {
          AndamanNicobarIslands: () =>
            import("../data/unionterritory/AndamanNicobarIslands.json"),
          Chandigarh: () => import("../data/unionterritory/Chandigarh.json"),
          DadraNagarHaveli: () =>
            import("../data/unionterritory/DadraNagarHaveli.json"),
          DamanDiu: () => import("../data/unionterritory/DamanDiu.json"),
          Delhi: () => import("../data/unionterritory/Delhi.json"),
          JammuKashmir: () =>
            import("../data/unionterritory/JammuKashmir.json"),
          Ladakh: () => import("../data/unionterritory/Ladakh.json"),
          Lakshadweep: () => import("../data/unionterritory/Lakshadweep.json"),
          Puducherry: () => import("../data/unionterritory/Puducherry.json"),
        };

        // Load special files
        const specialImports: { [key: string]: () => Promise<any> } = {
          CharDham: () => import("../data/special/CharDham.json"),
          JyotirLingas: () => import("../data/special/JyotirLingas.json"),
          ShaktiPeeths: () => import("../data/special/ShaktiPeeths.json"),
          UNESCOHeritage: () => import("../data/special/UNESCOHeritage.json"),
        };

        const loadPlaceGroup = async (
          imports: { [key: string]: () => Promise<any> },
          fileNames: string[],
          groupLabel: string,
        ): Promise<Place[]> => {
          if (fileNames.length === 0) {
            return [];
          }

          const importEntries = fileNames
            .filter((fileName) => !!imports[fileName])
            .map((fileName) => ({
              fileName,
              loader: imports[fileName],
            }));

          const settled = await Promise.allSettled(
            importEntries.map((entry) => entry.loader()),
          );

          return settled.flatMap((result, index) => {
            if (result.status === "fulfilled") {
              return result.value.default as Place[];
            }

            console.warn(
              `${groupLabel} file ${importEntries[index].fileName} not found or empty`,
            );
            return [];
          });
        };

        const loadPlaceChunks = async (
          imports: { [key: string]: () => Promise<any> },
          fileNames: string[],
          groupLabel: string,
          chunkSize: number,
        ): Promise<void> => {
          for (let start = 0; start < fileNames.length; start += chunkSize) {
            const chunk = fileNames.slice(start, start + chunkSize);
            const chunkPlaces = await loadPlaceGroup(
              imports,
              chunk,
              groupLabel,
            );

            if (isCancelled || chunkPlaces.length === 0) {
              continue;
            }

            setPlaces((prevPlaces) => [...prevPlaces, ...chunkPlaces]);

            // Yield to the browser before loading the next chunk.
            await waitForIdle();
          }
        };

        const strategy = getLoadingStrategy();
        const priorityStateCount = Math.min(
          strategy.priorityStateCount,
          dataSources.stateFiles.length,
        );
        const backgroundChunkSize = Math.max(1, strategy.backgroundChunkSize);

        const priorityStateFiles = dataSources.stateFiles.slice(
          0,
          priorityStateCount,
        );
        const backgroundStateFiles =
          dataSources.stateFiles.slice(priorityStateCount);

        const priorityStatePlaces = await loadPlaceGroup(
          stateImports,
          priorityStateFiles,
          "State",
        );

        if (isCancelled) {
          return;
        }

        setPlaces(priorityStatePlaces);
        setLoading(false);

        if (appConfig.enableGITags) {
          void import("../data/GITags.json")
            .then((giDataResult) => {
              if (!isCancelled) {
                setGiTags(giDataResult.default as GITagItem[]);
              }
            })
            .catch(() => {
              console.warn("GI Tags file not found or empty");
            });
        }

        // Load remaining datasets after first paint.
        await loadPlaceChunks(
          utImports,
          dataSources.utFiles,
          "UT",
          backgroundChunkSize,
        );

        await loadPlaceChunks(
          specialImports,
          dataSources.specialFiles,
          "Special",
          backgroundChunkSize,
        );

        await loadPlaceChunks(
          stateImports,
          backgroundStateFiles,
          "State",
          backgroundChunkSize,
        );
      } catch (error) {
        console.error("Error loading data:", error);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isCancelled = true;
    };
  }, [locationPermission]);

  const filteredPlaces = useMemo(
    () => filterPlaces(places, locationTypeFilter, stateFilter, userPreference),
    [places, locationTypeFilter, stateFilter, userPreference],
  );

  const filteredGiTags = useMemo(
    () => filterGiTags(giTags, showGiTags),
    [giTags, showGiTags],
  );

  const uniqueTypes = useMemo(
    () => getUniqueTypes(places, stateFilter),
    [places, stateFilter],
  );

  const uniqueStates = useMemo(
    () => getUniqueStates(places, giTags),
    [places, giTags],
  );

  const placesCountByTypeMap = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };

    for (const place of places) {
      if (stateFilter !== "all" && place.state !== stateFilter) {
        continue;
      }

      counts.all += 1;
      counts[place.type] = (counts[place.type] || 0) + 1;
    }

    return counts;
  }, [places, stateFilter]);

  const placesCountByType = useCallback(
    (type: string): number => placesCountByTypeMap[type] || 0,
    [placesCountByTypeMap],
  );

  const handleFilterChange = useCallback(
    (callback: () => void) => {
      utilHandleFilterChange(callback, setSidebarOpen);
    },
    [setSidebarOpen],
  );

  if (locationPermission === "checking") {
    return (
      <div className="loading">
        <img
          src={`${process.env.PUBLIC_URL}/favicon.ico`}
          alt="Location"
          className="loading-icon"
        />
        <span>Requesting location access...</span>
      </div>
    );
  }

  if (locationPermission === "denied") {
    return (
      <div className="permission-request">
        <h2>Location Access Required</h2>
        <p>Please allow location access to continue loading the application.</p>
        <button onClick={requestLocationAccess} className="permission-button">
          Retry Location Access
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <img
          src={`${process.env.PUBLIC_URL}/favicon.ico`}
          alt="Loading"
          className="loading-icon"
        />
        <span>Loading map data...</span>
      </div>
    );
  }

  return (
    <div className="App">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        filteredPlacesCount={filteredPlaces.length}
        filteredGiTagsCount={filteredGiTags.length}
        userPreference={userPreference}
        setUserPreference={setUserPreference}
        locationTypeFilter={locationTypeFilter}
        setLocationTypeFilter={setLocationTypeFilter}
        uniqueTypes={uniqueTypes}
        placesCountByType={placesCountByType}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        uniqueStates={uniqueStates}
        showGiTags={showGiTags}
        setShowGiTags={setShowGiTags}
        giTagsTotal={giTags.length}
        handleFilterChange={handleFilterChange}
      />
      <Suspense
        fallback={
          <div className="loading">
            <img
              src={`${process.env.PUBLIC_URL}/favicon.ico`}
              alt="Loading"
              className="loading-icon"
            />
            <span>Loading map view...</span>
          </div>
        }
      >
        <MapView
          filteredPlaces={filteredPlaces}
          filteredGiTags={filteredGiTags}
          showGiTags={showGiTags}
        />
      </Suspense>
    </div>
  );
}

export default App;
