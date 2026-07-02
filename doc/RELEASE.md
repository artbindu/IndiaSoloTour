# Release Strategy

This project uses **automated semantic versioning** with [standard-version](https://github.com/conventional-changelog/standard-version) and GitHub Actions.

## PR Title Convention

PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

| Prefix                    | Example                          | Version Bump          |
| ------------------------- | -------------------------------- | --------------------- |
| `feat:`                   | `feat: add search filter`        | minor (1.0.0 → 1.1.0) |
| `fix:`                    | `fix: marker icon not loading`   | patch (1.0.0 → 1.0.1) |
| `perf:`                   | `perf: throttle bearing updates` | patch                 |
| `docs:`                   | `docs: update README`            | patch                 |
| `chore:`                  | `chore: upgrade dependencies`    | patch                 |
| `breaking change` in body | any title with breaking change   | major (1.0.0 → 2.0.0) |

## On PR Merge to `main`

1. `auto-release.yml` workflow triggers
2. Version bumped in `package.json` using `standard-version`
3. `CHANGELOG.md` updated with commit history
4. Version-bump commit pushed as `chore(release): vX.Y.Z`
5. GitHub Release created with changelog body
6. App built and deployed to GitHub Pages

## Manual Release

Use these commands locally if you need to release without a PR:

```bash
# Preview what would change (no files modified)
npm run release:dry

# Patch release (1.0.0 → 1.0.1)
npm run release:patch

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major
```

After a manual release, push the version bump and tag:

```bash
git push origin main --follow-tags
```

## CHANGELOG.md

`CHANGELOG.md` is auto-generated at the repo root by `standard-version`. Do not edit it manually — it is overwritten on every release.
