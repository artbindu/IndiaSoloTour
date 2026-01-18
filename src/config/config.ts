export interface MapConfig {
  center: [number, number];
  defaultZoom: number;
  tileLayer: {
    url: string;
    attribution: string;
  };
}

export interface TileLayerConfig {
  url: string;
  attribution: string;
}

export interface IconColors {
  [key: string]: string;
}

export interface MarkerConfig {
  size: number;
  borderColor: string;
  borderWidth: number;
  defaultColor: string;
}

export enum HeritageType {
  UNESCO = "unesco",
  NATIONAL = "national",
  STATE = "state",
}

export interface HeritageIcons {
  unesco: string;
  national: string;
  state: string;
}

export interface DataSources {
  stateFiles: string[];
  utFiles: string[];
  specialFiles: string[];
  paths: {
    state: string;
    unionTerritory: string;
    special: string;
    giTags: string;
  };
}

export interface AppConfig {
  url: string;
  title: string;
  sidebarWidth: number;
  enableGITags: boolean;
  showLegend: boolean;
  showStatistics: boolean;
}

export interface Features {
  clustering: boolean;
  heatmap: boolean;
  search: boolean;
  routing: boolean;
}

// Map Configuration
export const mapConfig: MapConfig = {
  center: [20.5937, 78.9629], // India center coordinates
  defaultZoom: 5,
  tileLayer: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Alternative free map tile providers (uncomment to use)
export const alternativeTileLayers: { [key: string]: TileLayerConfig } = {
  cartoLight: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  cartoDark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  stamenTerrain: {
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Marker Color Configuration
export const iconColors: IconColors = {
  "Religious / Spiritual Places": "#FF6B6B",
  "Historical / Heritage Sites": "#4ECDC4",
  "Mountains / Hill Stations": "#45B7D1",
  "Beaches / Coastal Areas": "#FFA07A",
  "Wildlife / National Parks": "#98D8C8",
  "Urban / City Tourism": "#FFD93D",
  "Adventure / Trekking Destinations": "#6BCF7F",
  "Festivals / Event Destinations": "#C589E8",
  "Eco / Sustainable Tourism Spots": "#7FBA00",
  "Cultural / Ethnic Villages": "#F4A460",
  "GI Tags": "#FF1493",
  "Char Dham": "#FF6B35",
  "Chota Char Dham": "#00ccff",
  Jyotirlinga: "#FFA500",
  "Shakti Peeth": "#DA70D6",
  "UNESCO Heritage": "#FFD700",
};

// Marker Configuration
export const markerConfig: MarkerConfig = {
  size: 25,
  borderColor: "white",
  borderWidth: 2,
  defaultColor: "#6C757D", // Fallback color for unknown types
};

// Heritage Icons Configuration
export const heritageIcons: Record<HeritageType, string> = {
  [HeritageType.UNESCO]: "🇺🇳",
  [HeritageType.NATIONAL]: "🇮🇳",
  [HeritageType.STATE]: "",
};

export const heritageColors: Record<HeritageType, string> = {
  [HeritageType.UNESCO]: "#FFD700",
  [HeritageType.NATIONAL]: "#f83808",
  [HeritageType.STATE]: "",
};

// Data Sources Configuration
export const dataSources: DataSources = {
  stateFiles: [
    "AndhraPradesh",
    "ArunachalPradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "HimachalPradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "MadhyaPradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "TamilNadu",
    "Telangana",
    "Tripura",
    "Uttarakhand",
    "UttarPradesh",
    "WestBengal",
  ],
  utFiles: [
    "AndamanNicobarIslands",
    "Chandigarh",
    "DadraNagarHaveli",
    "DamanDiu",
    "Delhi",
    "JammuKashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ],
  specialFiles: ["CharDham", "JyotirLingas", "ShaktiPeeths", "UNESCOHeritage"],
  paths: {
    state: "./data/state",
    unionTerritory: "./data/unionterritory",
    special: "./data/special",
    giTags: "./data/GITags.json",
  },
};

// App Configuration
export const appConfig: AppConfig = {
  url: "https://artbindu-app.github.io/whoami/images/profile/india.svg",
  title: "India Solo Tour",
  sidebarWidth: 320,
  enableGITags: true,
  showLegend: true,
  showStatistics: true,
};

// Feature Flags
export const features: Features = {
  clustering: false,
  heatmap: false,
  search: false,
  routing: false,
};
