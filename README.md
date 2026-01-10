# India Solo Tour - Interactive Map

This React application visualizes all the tourism places and GI-tagged items from the India Solo Tour dataset on an interactive map.

## Features

- 🗺️ **Free OpenStreetMap Integration** - Uses Leaflet with OpenStreetMap tiles (completely free, no API keys needed)
- 📍 **Interactive Markers** - Click on any marker to see detailed information
- 🎨 **Color-Coded Categories** - Different colors for different types of places
- 🔍 **Advanced Filtering** - Filter places by type
- 📊 **Statistics Dashboard** - View total counts of places and GI tags
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Data Sources

The map loads data from:
- `/data/state/*.json` - State tourism places
- `/data/unionterritory/*.json` - Union Territory places
- `/data/special/*.json` - Special categories (CharDham, Jyotirlingas, ShaktiPeeths)
- `/data/GITags.json` - Geographical Indication tagged items

## Installation

1. Navigate to the map-app directory:
```bash
cd map-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy your data folder:
```bash
# Copy the data folder from parent directory
cp -r ../data ./data
```

4. Start the development server:
```bash
npm start
```

5. Open your browser to `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The optimized build will be in the `build/` directory.

## Technologies Used

- **React 18** - UI framework
- **Leaflet** - Free mapping library
- **React-Leaflet** - React components for Leaflet
- **OpenStreetMap** - Free map tiles (no API key required)

## Map Controls

- **Zoom**: Use mouse wheel or +/- buttons
- **Pan**: Click and drag the map
- **Filter**: Use the dropdown to filter by place type
- **Markers**: Click any marker to see details in a popup

## Customization

### Change Map Style

Edit `App.js` and modify the TileLayer URL. Free alternatives:
- **Carto Light**: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- **Carto Dark**: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- **Stamen Terrain**: `https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png`

### Change Marker Colors

Edit the `iconColors` object in `App.js` to customize colors for each category.

## License

This project uses free and open-source components. No API keys or paid services required!
