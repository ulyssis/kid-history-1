# Eurasia History Map

Interactive map for exploring approximate political territories and major historical events across Eurasia and North Africa from **4000 BCE to the present**. Built for curious learners (including kids) with English, German, and Chinese UI.

## Features

- MapLibre map with muted basemap and approximate polity polygons
- Timeline scrubber from 4000 BCE to the current year (1-year steps)
- Legend of polities visible in the selected year
- Clickable events (points and areas) with multilingual popups and source links
- Language switcher: English / Deutsch / 中文

## Quick start

```bash
export PATH="/usr/local/opt/node@22/bin:$PATH"
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Local development server             |
| `npm run build`| Typecheck + production build         |
| `npm run preview` | Preview the production build      |
| `npm run lint` | Oxlint                               |

Regenerate demo GeoJSON / events (optional):

```bash
node scripts/generate-seed-data.mjs
```

## Data layout

- `public/data/events.json` — historic events (`startYear` / `endYear`, GeoJSON geometry, `i18n` en/de/zh, `sources`)
- `public/data/territories/manifest.json` — list of snapshot years and sources
- `public/data/territories/<year>.geojson` — FeatureCollection with `polityId`, `color`, `name.{en,de,zh}`

Years use astronomical numbering: negative = BCE (e.g. `-500` is 500 BCE). There is no year 0.

## Important caveat

Borders are **approximate reconstructions for learning**, not exact historical maps. See [SOURCES.md](./SOURCES.md).

## Stack

- Vite + React 19 + TypeScript
- MapLibre GL
- i18next / react-i18next
