# Changelog

All notable changes to this project will be documented in this file.


### [0.4.12](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.11...v0.4.12) (2026-07-02)


### 🐛 Bug Fixes

* add devtools config ([95de050](https://github.com/artbindu/IndiaSoloTour/commit/95de050de83f9fef9493411438f53808d111ba58))
* auto delete branch ([c71f038](https://github.com/artbindu/IndiaSoloTour/commit/c71f0388c3e9c69f1692fda1acbde906642d2dd4))
* disabled auto release ([9c0fc90](https://github.com/artbindu/IndiaSoloTour/commit/9c0fc90e25b8523eac2a96ae57324b91cfcd72a3))

### [0.4.11](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.10...v0.4.11) (2026-07-02)


### 🐛 Bug Fixes

* devtool detection disabled ([db22f00](https://github.com/artbindu/IndiaSoloTour/commit/db22f003708525f03cc2e0b643593161282b764f))

### [0.4.10](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.9...v0.4.10) (2026-07-02)


### 📝 Documentation

* move release docs to doc/ and fix README link ([d547471](https://github.com/artbindu/IndiaSoloTour/commit/d5474719ae254917bbec9a20d07df4eaf329cf08))


### 🐛 Bug Fixes

* update docs ([265d4b9](https://github.com/artbindu/IndiaSoloTour/commit/265d4b98c99602478b6d0812b173d3a9c8e2de40))

### [0.4.9](https://github.com/artbindu/IndiaSoloTour/compare/v0.4.8...v0.4.9) (2026-07-02)


### 🐛 Bug Fixes

* sync workflow fixes from MapRotation to main ([f009af0](https://github.com/artbindu/IndiaSoloTour/commit/f009af04d3c6713bc25355f76935512d90628c23))

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
