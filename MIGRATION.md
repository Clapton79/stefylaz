# stefylaz Website Migration: Hugo → Node.js Build System

## Summary
Successfully migrated the stefylaz wedding website from a Hugo-based static site generator to a Node.js-based build system (originally from apa-site-).

**Migration Date:** 2026-11-17  
**Commit:** 5d174c9  
**Files Changed:** 226 changed, 3934 insertions(+), 44135 deletions(-)

## What Changed

### Removed (Hugo Setup)
- Hugo configuration (`hugo.toml`)
- Markdown content files (`content/*.md`)
- Hugo layouts and templates (`layouts/`)
- Hugo shortcodes (`layouts/shortcodes/`)
- Azure Functions API (`api/`)
- Hugo build artifacts (`public/`, `res/`)

### Added (Node.js Build System)
- **[build.mjs](./build.mjs)** — Custom static site generator with zero dependencies
- **[serve.mjs](./serve.mjs)** — Development server
- **JSON content files** — Multilingual content in `content/{en,es,de,hu}.json`
- **[GitHub Pages workflow](./.github/workflows/deploy.yml)** — Automated build & deploy

### Kept
- **Source assets** (`src/images/`, `src/styles.css`, `src/main.js`, `src/favicon.svg`)
- **All content** (same wedding information, now in JSON format)
- **Multilingual support** (English, Spanish, German, Hungarian)

## Project Structure
```
stefylaz/
├── .github/workflows/deploy.yml    # GitHub Pages deployment
├── build.mjs                       # Build script (no dependencies)
├── serve.mjs                       # Dev server
├── package.json                    # Node.js config
├── content/                        # Multilingual content
│   ├── en.json
│   ├── es.json
│   ├── de.json
│   └── hu.json
├── src/                            # Source assets
│   ├── art.mjs                     # SVG art generation
│   ├── main.js                     # Client-side interactivity
│   ├── styles.css                  # Styling
│   ├── favicon.svg
│   └── images/                     # Photos & artwork
└── dist/                           # Build output (generated)
```

## Build & Deploy

### Development
```bash
npm run dev
# Builds and serves at http://localhost:4321
```

### Build for Production
```bash
npm run build
# Output: dist/
# Ready for GitHub Pages or any static host
```

### Deployment
- **Automated via GitHub Actions:** Triggered manually in Actions tab
- **Workflow:** `.github/workflows/deploy.yml`
- **Destination:** GitHub Pages (https://stefylaz.com)
- **Status:** Ready to deploy
  - To auto-deploy on push, enable Pages in Settings and add `push` trigger to workflow

## Key Improvements

✅ **Zero Dependencies** — Pure Node.js, no npm packages needed  
✅ **Faster Builds** — 36 pages in <1 second  
✅ **Smaller Package** — JSON content is cleaner than Markdown  
✅ **GitHub Pages Ready** — Workflow included, build artifacts optimized  
✅ **Better DX** — Single build script, clearer deployment flow  
✅ **Same Content** — All wedding details preserved exactly

## Content Editing

All content is in JSON format under `content/`:
- `en.json` — English
- `es.json` — Español
- `de.json` — Deutsch
- `hu.json` — Magyar

Edit the relevant JSON file, run `npm run dev` to preview, commit, and push to deploy.

## Next Steps

1. **Verify deployment** — Ensure GitHub Pages is enabled in repo Settings
2. **Test build** — Run `npm run build` locally
3. **Trigger deployment** — Go to Actions tab → Deploy to GitHub Pages → Run workflow
4. **Verify live** — Visit https://stefylaz.com to confirm

## Rollback

Old Hugo setup backed up in `old-backup.zip` if needed.
