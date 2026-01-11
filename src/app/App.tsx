import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import './App.css';
import { 
  mapConfig, 
  iconColors, 
  markerConfig, 
  dataSources, 
  appConfig 
} from '../config/config';
import { Place } from '../models/Places';
import { GITagItem } from '../models/Items';

// Import marker images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons for different categories
const createCustomIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${markerConfig.size}px; height: ${markerConfig.size}px; border-radius: 50%; border: ${markerConfig.borderWidth}px solid ${markerConfig.borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [markerConfig.size, markerConfig.size],
    iconAnchor: [markerConfig.size / 2, markerConfig.size / 2],
  });
};

function App(): JSX.Element {
  const [places, setPlaces] = useState<Place[]>([]);
  const [giTags, setGiTags] = useState<GITagItem[]>([]);
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');
  const [showGiTags, setShowGiTags] = useState<boolean>(true);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadAllData = async (): Promise<void> => {
      try {
        let allPlaces: Place[] = [];

        // Load state files dynamically
        const stateImports: { [key: string]: () => Promise<any> } = {
          'AndhraPradesh': () => import('../data/state/AndhraPradesh.json'),
          'ArunachalPradesh': () => import('../data/state/ArunachalPradesh.json'),
          'Assam': () => import('../data/state/Assam.json'),
          'Bihar': () => import('../data/state/Bihar.json'),
          'Chhattisgarh': () => import('../data/state/Chhattisgarh.json'),
          'Goa': () => import('../data/state/Goa.json'),
          'Gujarat': () => import('../data/state/Gujarat.json'),
          'Haryana': () => import('../data/state/Haryana.json'),
          'HimachalPradesh': () => import('../data/state/HimachalPradesh.json'),
          'Jharkhand': () => import('../data/state/Jharkhand.json'),
          'Karnataka': () => import('../data/state/Karnataka.json'),
          'Kerala': () => import('../data/state/Kerala.json'),
          'MadhyaPradesh': () => import('../data/state/MadhyaPradesh.json'),
          'Maharashtra': () => import('../data/state/Maharashtra.json'),
          'Manipur': () => import('../data/state/Manipur.json'),
          'Meghalaya': () => import('../data/state/Meghalaya.json'),
          'Mizoram': () => import('../data/state/Mizoram.json'),
          'Nagaland': () => import('../data/state/Nagaland.json'),
          'Odisha': () => import('../data/state/Odisha.json'),
          'Punjab': () => import('../data/state/Punjab.json'),
          'Rajasthan': () => import('../data/state/Rajasthan.json'),
          'Sikkim': () => import('../data/state/Sikkim.json'),
          'TamilNadu': () => import('../data/state/TamilNadu.json'),
          'Telangana': () => import('../data/state/Telangana.json'),
          'Tripura': () => import('../data/state/Tripura.json'),
          'Uttarakhand': () => import('../data/state/Uttarakhand.json'),
          'UttarPradesh': () => import('../data/state/UttarPradesh.json'),
          'WestBengal': () => import('../data/state/WestBengal.json')
        };

        // Load UT files
        const utImports: { [key: string]: () => Promise<any> } = {
          'AndamanNicobarIslands': () => import('../data/unionterritory/AndamanNicobarIslands.json'),
          'Chandigarh': () => import('../data/unionterritory/Chandigarh.json'),
          'DadraNagarHaveli': () => import('../data/unionterritory/DadraNagarHaveli.json'),
          'DamanDiu': () => import('../data/unionterritory/DamanDiu.json'),
          'Delhi': () => import('../data/unionterritory/Delhi.json'),
          'JammuKashmir': () => import('../data/unionterritory/JammuKashmir.json'),
          'Ladakh': () => import('../data/unionterritory/Ladakh.json'),
          'Lakshadweep': () => import('../data/unionterritory/Lakshadweep.json'),
          'Puducherry': () => import('../data/unionterritory/Puducherry.json')
        };

        // Load special files
        const specialImports: { [key: string]: () => Promise<any> } = {
          'CharDham': () => import('../data/special/CharDham.json'),
          'JyotirLingas': () => import('../data/special/JyotirLingas.json'),
          'ShaktiPeeths': () => import('../data/special/ShaktiPeeths.json')
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
            const giData = await import('../data/GITags.json');
            setGiTags(giData.default);
          } catch (error) {
            console.log('GI Tags file not found or empty');
          }
        }

        console.log('Loaded places:', allPlaces.length);
        setPlaces(allPlaces);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Apply all filters
  const filteredPlaces: Place[] = places.filter(place => {
    // Location Type Filter
    if (locationTypeFilter !== 'all' && place.type !== locationTypeFilter) {
      return false;
    }
    // State Filter
    if (stateFilter !== 'all' && place.state !== stateFilter) {
      return false;
    }
    return true;
  });

  // Filter GI Tags (only by state if enabled)
  const filteredGiTags: GITagItem[] = showGiTags ? giTags.filter(item => {
    // State Filter
    if (stateFilter !== 'all' && item.state !== stateFilter) {
      return false;
    }
    return true;
  }) : [];

  const uniqueTypes: string[] = [...new Set(
    places
      .filter(place => stateFilter === 'all' || place.state === stateFilter)
      .map(place => place.type)
  )];
  const uniqueStates: string[] = [...new Set([...places.map(place => place.state), ...giTags.map(item => item.state)])].sort();

  // Auto-hide sidebar on mobile after filter change
  const handleFilterChange = (callback: () => void) => {
    callback();
    if (window.innerWidth <= 768) {
      setTimeout(() => setSidebarOpen(false), 300);
    }
  };

  if (loading) {
    return <div className="loading">Loading map data...</div>;
  }

  return (
    <div className="App">
      <button 
        className="sidebar-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <span className="hamburger-icon">{sidebarOpen ? '✕' : '☰'}</span>
      </button>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h1>
          <img src={appConfig.url} alt="India" className="title-icon" />
          {appConfig.title}
        </h1>
        {appConfig.showStatistics && (
          <div className="stats">
            <p><strong>Total Places:</strong> {filteredPlaces.length}</p>
            <p><strong>GI Tags:</strong> {filteredGiTags.length}</p>
          </div>
        )}
        
        <div className="filters">
          <div className="filter-section">
            <h3>Location Filter Type</h3>
            <select value={locationTypeFilter} onChange={(e) => handleFilterChange(() => setLocationTypeFilter(e.target.value))}>
              <option value="all">All Places ({places.filter(p => stateFilter === 'all' || p.state === stateFilter).length})</option>
              {uniqueTypes.sort().map(type => (
                <option key={type} value={type}>
                  {type} ({places.filter(p => p.type === type && (stateFilter === 'all' || p.state === stateFilter)).length})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>State Wise Location Filter</h3>
            <select value={stateFilter} onChange={(e) => handleFilterChange(() => setStateFilter(e.target.value))}>
              <option value="all">All States</option>
              {uniqueStates.map(state => (
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
                  onChange={(e) => handleFilterChange(() => setShowGiTags(e.target.checked))}
                />
                <span className="slider"></span>
              </label>
              <span className="switch-label">
                {showGiTags ? `ON - Showing ${giTags.length} GI Tags` : 'OFF - Hidden'}
              </span>
            </div>
          </div>
        </div>

        {appConfig.showLegend && (
          <div className="legend">
            <h3>Legend</h3>
            {Object.entries(iconColors).map(([type, color]) => (
              <div key={type} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: color }}></div>
                <span>{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MapContainer 
        center={mapConfig.center} 
        zoom={mapConfig.defaultZoom} 
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution={mapConfig.tileLayer.attribution}
          url={mapConfig.tileLayer.url}
        />
        
        {/* Tourist Places */}
        <LayerGroup>
          {filteredPlaces.map((place, index) => {
            if (!place.coordinates || !place.coordinates.lat || !place.coordinates.long) {
              return null;
            }
            
            const color = iconColors[place.type] || markerConfig.defaultColor;
            const icon = createCustomIcon(color);

            return (
              <Marker 
                key={`place-${index}`}
                position={[place.coordinates.lat, place.coordinates.long]}
                icon={icon}
              >
                <Popup>
                  <div className="popup-content">
                    <h3>{place.name}</h3>
                    <p><strong>Type:</strong> {place.type}</p>
                    <p><strong>Location:</strong> {place.city}, {place.state}</p>
                    {place.heritage && (place.heritage.unesco || place.heritage.national || place.heritage.state) && (
                      <p><strong>Heritage:</strong> 
                        {place.heritage.unesco && ' UNESCO'}
                        {place.heritage.national && ' National'}
                        {place.heritage.state && ' State'}
                      </p>
                    )}
                    {place.description && <p className="description">{place.description}</p>}
                    {place.bestVisitMonths && (
                      <p><strong>Best Visit:</strong> {place.bestVisitMonths.join(', ')}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>

        {/* GI Tags */}
        {showGiTags && (
          <LayerGroup>
            {filteredGiTags.map((item, index) => {
                if (!item.coordinates || !item.coordinates.lat || !item.coordinates.long) {
                  return null;
                }
                
                const icon = createCustomIcon(iconColors['GI Tags']);

                return (
                  <Marker 
                    key={`gi-${index}`}
                    position={[item.coordinates.lat, item.coordinates.long]}
                    icon={icon}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h3>🏅 {item.name}</h3>
                        <p><strong>Type:</strong> {item.Type}</p>
                        <p><strong>Location:</strong> {item.location}, {item.state}</p>
                        <p><strong>Significance:</strong> {item.significance}</p>
                        {item.description && <p className="description">{item.description}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </LayerGroup>
        )}
      </MapContainer>
    </div>
  );
}

export default App;
