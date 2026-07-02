# Changelog

All notable changes to this project will be documented in this file.


### [0.4.8](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.7...v0.4.8) (2026-07-02)


### 🐛 Bug Fixes

* deploy latest version after release version bump ([048899f](https://github.com/artbindu/IndiaSoloTour/commit/048899f5eed17d38f5db7a731cd3e2bb4e4992ea))

### [0.4.7](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.6...v0.4.7) (2026-07-02)

### 0.4.1 (2026-07-02)

## 0.4.0 (2026-07-02)

## [0.3.0] - 2026-01-17

### ✨ Features

- **Version Management**: Added automated changelog and version bumping with standard-version
  - Automated version bumping (patch, minor, major)
  - Changelog generation using conventional commits
  - Git tag creation

### 📝 Documentation

- Added gyroscope/compass feature documentation (implementation pending)
  - README.md with full API reference
  - USAGE_EXAMPLES.md with 10 practical examples
  - QUICKSTART.md for getting started
  - ARCHITECTURE.md for technical details
  - SUMMARY.md and CHANGELOG.md

### 🔧 Configuration

- Added `.versionrc.json` for changelog configuration
- Updated npm scripts for version management
- Configured conventional commits support

---

## How to Use This Changelog

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [standard-version](https://github.com/conventional-changelog/standard-version) to automatically generate changelogs.

### Version Bump Commands:

```bash
# Automatically determine version bump based on commits
npm run release

# Specific version bumps
npm run release:patch  # 0.3.0 → 0.3.1 (bug fixes)
npm run release:minor  # 0.3.0 → 0.4.0 (new features)
npm run release:major  # 0.3.0 → 1.0.0 (breaking changes)

# Dry run (preview changes without committing)
npm run release:dry

# First release (no version bump)
npm run release:first
```

### Commit Message Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `perf`: Performance improvement
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc.)

**Breaking Changes:**
Add `BREAKING CHANGE:` in the commit footer or `!` after type/scope to trigger a major version bump.

**Examples:**

```bash
git commit -m "feat(compass): add gyroscope support for mobile devices"
git commit -m "fix(map): resolve marker positioning issue"
git commit -m "feat(ui)!: redesign navigation layout" -m "BREAKING CHANGE: Navigation API changed"
```
