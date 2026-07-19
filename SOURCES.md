# Sources

This project is an **educational demo**. Territory polygons are simplified approximations for learning — not cadastral or scholarly GIS reconstructions. Event dates are conventional textbook dates and may differ among historians.

## Basemap

- OpenStreetMap contributors — [OpenStreetMap copyright](https://www.openstreetmap.org/copyright)
- CARTO Voyager raster tiles — [CARTO attribution](https://carto.com/attributions)
- MapLibre GL JS — [maplibre.org](https://maplibre.org/)

## Reference works used for events & polity names

- [Encyclopaedia Britannica](https://www.britannica.com/)
- [Metropolitan Museum of Art – Heilbrunn Timeline of Art History](https://www.metmuseum.org/toah/)
- [British Museum](https://www.britishmuseum.org/)
- [UNESCO World Heritage Centre](https://whc.unesco.org/)
- [Musée du Louvre](https://www.louvre.fr/) (e.g. Code of Hammurabi)
- Overview articles on the history of Eurasia and major empires (Wikipedia and textbook surveys)

## Territory snapshots

Snapshot years and polity labels draw on the broad tradition of historical atlases (including public educational timelines such as [Geacron](https://geacron.com/)). Shapes in `public/data/territories/*.geojson` were drawn as coarse rectangles/polygons for the demo and should not be cited as geographic truth.

Each event in `public/data/events.json` lists specific `sources` with labels and URLs. Each territory snapshot in `public/data/territories/manifest.json` lists overview sources for that year.

## How to improve accuracy

For a classroom or museum build, replace snapshots with peer-reviewed historical GIS (or carefully licensed atlas derivatives) and cite edition, map plate, and year for every polygon.
