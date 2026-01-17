import React from "react";
import "./Sidebar.css";
import { appConfig, iconColors } from "../../../config/config";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filteredPlacesCount: number;
  filteredGiTagsCount: number;
  locationTypeFilter: string;
  setLocationTypeFilter: (value: string) => void;
  uniqueTypes: string[];
  placesCountByType: (type: string) => number;
  stateFilter: string;
  setStateFilter: (value: string) => void;
  uniqueStates: string[];
  showGiTags: boolean;
  setShowGiTags: (value: boolean) => void;
  giTagsTotal: number;
  handleFilterChange: (callback: () => void) => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  filteredPlacesCount,
  filteredGiTagsCount,
  locationTypeFilter,
  setLocationTypeFilter,
  uniqueTypes,
  placesCountByType,
  stateFilter,
  setStateFilter,
  uniqueStates,
  showGiTags,
  setShowGiTags,
  giTagsTotal,
  handleFilterChange,
}: SidebarProps): JSX.Element {
  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <span className="hamburger-icon">{sidebarOpen ? "✕" : "☰"}</span>
      </button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h1>
          <img src={appConfig.url} alt="India" className="title-icon" />
          {appConfig.title}
        </h1>
        {appConfig.showStatistics && (
          <div className="stats">
            <p>
              <strong>Total Places:</strong> {filteredPlacesCount}
            </p>
            <p>
              <strong>GI Tags:</strong> {filteredGiTagsCount}
            </p>
          </div>
        )}

        <div className="filters">
          <div className="filter-section">
            <h3>Location Filter Type</h3>
            <select
              value={locationTypeFilter}
              onChange={(e) =>
                handleFilterChange(() => setLocationTypeFilter(e.target.value))
              }
            >
              <option value="all">
                All Places ({placesCountByType("all")})
              </option>
              {[...uniqueTypes].sort().map((type) => (
                <option key={type} value={type}>
                  {type} ({placesCountByType(type)})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>State Wise Location Filter</h3>
            <select
              value={stateFilter}
              onChange={(e) =>
                handleFilterChange(() => setStateFilter(e.target.value))
              }
            >
              <option value="all">All States</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>GI Tag Filter</h3>
            <div className="switch-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showGiTags}
                  onChange={(e) =>
                    handleFilterChange(() => setShowGiTags(e.target.checked))
                  }
                />
                <span className="slider"></span>
              </label>
              <span className="switch-label">
                {showGiTags
                  ? `ON - Showing ${giTagsTotal} GI Tags`
                  : "OFF - Hidden"}
              </span>
            </div>
          </div>
        </div>

        {appConfig.showLegend && (
          <div className="legend">
            <h3>Legend</h3>
            {Object.entries(iconColors).map(([type, color]) => (
              <div key={type} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: color }}
                ></div>
                <span>{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
