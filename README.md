# India Solo Tour

Interactive map visualizing tourism destinations and GI-tagged items across India using React, Leaflet, and OpenStreetMap.

🌐 **Live Demo:** <https://artbindu.github.io/IndiaSoloTour/>

## Features

🗺️ Color-coded markers for 10+ tourism categories across all states & UTs  
🔍 Filter by location type, state, and GI Tags  
📐 Multi-point distance measurement with per-segment breakdown  
📡 Live GPS tracking with shareable location URL  
🧭 Map rotation with interactive compass reset  
📊 Statistics dashboard and color-coded legend  
📱 Responsive design with collapsible sidebar

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
```

## Release Strategy

This project uses **automated semantic versioning** with GitHub Actions.

### How It Works

1. **PR Titles** must follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat: ...` → **minor** version bump (e.g., 1.0.0 → 1.1.0)
   - `fix: ...` → **patch** version bump (e.g., 1.0.0 → 1.0.1)
   - `perf: ...` → **patch** version bump
   - Include `breaking change` in description → **major** bump (e.g., 1.0.0 → 2.0.0)

2. **On PR Merge to main**:
   - Auto-release workflow triggers
   - Version bumped using `standard-version`
   - CHANGELOG auto-generated
   - GitHub Release created
   - Build deployed

### Manual Release (if needed)

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release:patch

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major

# Dry-run to preview changes
npm run release:dry
```

## Tech Stack

React 18 • TypeScript • Leaflet • react-leaflet • OpenStreetMap

## License

MIT
