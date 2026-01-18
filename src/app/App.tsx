import React, { useState, useEffect } from "react";
import L from "leaflet";
import "./App.css";
import { dataSources, appConfig } from "../config/config";
import { Place } from "../models/Places";
import { GITagItem } from "../models/Items";
import { Sidebar } from "../components/layout/Sidebar/Sidebar";
import { MapView } from "../components/layout/MapView/MapView";
import {
  filterPlaces,
  filterGiTags,
  getUniqueTypes,
  getUniqueStates,
  countPlacesByType,
  handleFilterChange as utilHandleFilterChange,
} from "../utils/utils";

// Import marker images
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App(): JSX.Element {
  const [places, setPlaces] = useState<Place[]>([]);
  const [giTags, setGiTags] = useState<GITagItem[]>([]);
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>("all");
  const [showGiTags, setShowGiTags] = useState<boolean>(false);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadAllData = async (): Promise<void> => {
      try {
        let allPlaces: Place[] = [];

        // Load state files dynamically
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

        // Load all state files
        for (const state of dataSources.stateFiles) {
          try {
            if (stateImports[state]) {
              const data = await stateImports[state]();
              allPlaces = [...allPlaces, ...data.default];
            }
          } catch (error) {
            console.log(`State file ${state} not found or empty`);
          }
        }

        // Load all UT files
        for (const ut of dataSources.utFiles) {
          try {
            if (utImports[ut]) {
              const data = await utImports[ut]();
              allPlaces = [...allPlaces, ...data.default];
            }
          } catch (error) {
            console.log(`UT file ${ut} not found or empty`);
          }
        }

        // Load all special files
        for (const special of dataSources.specialFiles) {
          try {
            if (specialImports[special]) {
              const data = await specialImports[special]();
              allPlaces = [...allPlaces, ...data.default];
            }
          } catch (error) {
            console.log(`Special file ${special} not found or empty`);
          }
        }

        // Load GI Tags
        if (appConfig.enableGITags) {
          try {
            const giData = await import("../data/GITags.json");
            setGiTags(giData.default);
          } catch (error) {
            console.log("GI Tags file not found or empty");
          }
        }

        console.log("Loaded places:", allPlaces.length);
        setPlaces(allPlaces);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Apply all filters using utility functions
  const filteredPlaces: Place[] = filterPlaces(
    places,
    locationTypeFilter,
    stateFilter,
  );

  // Filter GI Tags using utility function
  const filteredGiTags: GITagItem[] = filterGiTags(giTags, showGiTags);

  const uniqueTypes: string[] = getUniqueTypes(places, stateFilter);
  const uniqueStates: string[] = getUniqueStates(places, giTags);

  // Helper function to count places by type using utility
  const placesCountByType = (type: string): number => {
    return countPlacesByType(places, type, stateFilter);
  };

  // Auto-hide sidebar on mobile after filter change using utility
  const handleFilterChange = (callback: () => void) => {
    utilHandleFilterChange(callback, setSidebarOpen);
  };

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
      <MapView
        filteredPlaces={filteredPlaces}
        filteredGiTags={filteredGiTags}
        showGiTags={showGiTags}
      />
    </div>
  );
}

export default App;
