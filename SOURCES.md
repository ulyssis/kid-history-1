# Sources

This project is an **educational demo**. Territory polygons are simplified approximations for learning — not cadastral or scholarly GIS reconstructions. Event dates are conventional textbook dates and may differ among historians.

## Basemap

- Esri World Imagery satellite tiles — [Esri](https://www.esri.com/) (Esri, Maxar, Earthstar Geographics, and the GIS User Community)
- MapLibre GL JS — [maplibre.org](https://maplibre.org/)

## Reference works used for events & polity names

- [Encyclopaedia Britannica](https://www.britannica.com/)
- [Metropolitan Museum of Art – Heilbrunn Timeline of Art History](https://www.metmuseum.org/toah/)
- [British Museum](https://www.britishmuseum.org/)
- [UNESCO World Heritage Centre](https://whc.unesco.org/)
- [Musée du Louvre](https://www.louvre.fr/) (e.g. Code of Hammurabi)
- [Wikipedia](https://en.wikipedia.org/) period pages for each polity (linked per feature in GeoJSON `properties.wiki` and in `manifest.json` sources)

## Territory snapshots

- **Granularity:** one snapshot every **100 years** from **4000 BCE → 1500 CE**, then every **50 years** to **2020 CE**, **plus** a snapshot for every curated event start/end year so the map matches the moment of each event.
- **Generator:** `node scripts/generate-territories.mjs` (rewrites `public/data/territories/*`).
- **Timing:** polity `from`/`to` ranges in the generator follow Wikipedia period articles (e.g. [Qin dynasty](https://en.wikipedia.org/wiki/Qin_dynasty), [Achaemenid Empire](https://en.wikipedia.org/wiki/Achaemenid_Empire), [Mongol Empire](https://en.wikipedia.org/wiki/Mongol_Empire)).
- **Shapes:** still coarse rectangles/polygons for the classroom demo — not traced atlas plates. Do not cite them as geographic truth.

Each event in `public/data/events.json` lists specific `sources`. Popup images are local educational illustrations in `public/images/events/` (generated for reliable offline display). Wikimedia Commons URLs were tried but often blocked; regenerate with `node scripts/generate-event-images.mjs`.

## How to improve accuracy

For a classroom or museum build, replace snapshots with peer-reviewed historical GIS (or carefully licensed atlas derivatives) and cite edition, map plate, and year for every polygon.
