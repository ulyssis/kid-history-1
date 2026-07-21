# Eurasia History Map

Interactive map for exploring approximate political territories and major historical events across Eurasia and North Africa from **4600 BCE to the present**. Built for curious learners (including kids) with English, German, and Chinese UI.

## Features

- MapLibre map with **satellite** basemap and approximate polity polygons (territory layer always on)
- Timeline scrubber from 4600 BCE to the current year (1-year steps)
- Territory snapshots: **100 years** (4600–800 BCE), **50 years** (800 BCE–1492 CE), **20 years** (1492–2026 CE), plus event years
- **Previous / next** buttons jump to the nearest event or territory-change year
- Legend of polities visible in the selected year
- Clickable events (points and areas) with multilingual popups and source links
- Strong coverage of **Roman Republic/Empire** and **Han dynasty**, plus same-era Europe–China pairs
- Language switcher: English / Deutsch / 中文

## Quick start

From this project folder:

```bash
cd /Users/max/github_projects/eurasia-history-map
export PATH="/usr/local/opt/node@22/bin:$PATH"
npm install
npm run dev
```

Then open **http://127.0.0.1:5173/** in your browser.

If `npm` is “command not found”, keep the `PATH` line above. If port 5173 is busy, Vite will suggest another port — use the URL it prints.

## GitHub Pages (public website)

Site URL: `https://ulyssis.github.io/kid-history-1/`

Deploys automatically via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`. Pages **Source** must be **GitHub Actions** (not “Deploy from a branch”).

Local vs Pages base path is handled in `vite.config.ts` (`/` locally, `/kid-history-1/` in CI).

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Local development server             |
| `npm run build`| Typecheck + production build         |
| `npm run preview` | Preview the production build      |
| `npm run lint` | Oxlint                               |

Regenerate data (optional):

```bash
# Territories (100y / 50y / 20y grid + event years; Wikipedia-timed polities)
node scripts/generate-territories.mjs

# Full seed (events + older sparse territories) — prefer generate-territories for borders
node scripts/generate-seed-data.mjs
```

## Data layout

- `public/data/events.json` — historic events (`startYear` / `endYear`, GeoJSON geometry, `i18n` en/de/zh, `sources`)
- `public/data/territories/manifest.json` — snapshot years (100y until 800 BCE, 50y until 1492, 20y after, + event years) and Wikipedia sources
- Event popups show a local illustration in `public/images/events/<id>.svg` (always available offline). Regenerate with `node scripts/generate-event-images.mjs`.
- `public/data/territories/<year>.geojson` — FeatureCollection with `polityId`, `color`, `name.{en,de,zh}`, `wiki`

Years use astronomical numbering: negative = BCE (e.g. `-500` is 500 BCE). There is no year 0.

## Important caveat

Borders are **approximate reconstructions for learning**, not exact historical maps. See [SOURCES.md](./SOURCES.md).

## Stack

- Vite + React 19 + TypeScript
- MapLibre GL
- i18next / react-i18next
