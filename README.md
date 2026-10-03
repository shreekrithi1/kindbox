# Kindbox

> **Demo only.** Inspired by the Akshaya Patra Foundation's mission that no one should go hungry. Not affiliated with or endorsed by Akshaya Patra. Piloting in the San Francisco Bay Area; all listings are sample data.

A living map of shared meals. People who need food find free, sealed food boxes at community fridges and shelves nearby. Households with extra food pack it, drop it off, and list it.

**Find food:** world map and 3D globe with clustered drop points (like a temple atlas, but for meals). Search by food, city or country, filter by diet (vegetarian, vegan, halal, gluten-free, nut-free, soft food…) and type, see local opening hours, distance and what's inside each box, and mark a box as taken.

**Programs:** NGOs, city councils and community groups post job trainings (back-to-work programs), community meals, food drives, benefits and housing help, and health events. People filter by category and audience (adults, youth, families, seniors, veterans), save programs, and see how to join.

**Give food:** a short form to list a box at any drop point. It generates a label code (e.g. `KB-4821`) to write on the box.

The web layout (≥1024px) has a landing page with a rotating dotted globe and a full-screen map with floating panels. Phones get a compact map-plus-list layout.

## Run locally

Single static page, no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Needs an internet connection for the map library (d3 from cdnjs, topojson-client from jsDelivr) and fonts. Deploys as-is to Vercel, Netlify or GitHub Pages.

## Mock data

108 fictional drop points with 231 sample boxes in 33 cities across 25 countries, with local dishes per region.

- `data/mock-data.json` holds `cities`, `foodBanks`, `packets` and `programs` (14 San Francisco programs; dates are relative to today via `dayOffset`).
- The same data is embedded in `index.html` (`<script type="application/json" id="seed">`) so the page also works from disk. Keep the two in sync.
- Box times are relative to page load (`packedMinutesAgo`, `eatWithinHours`), so samples always look fresh. Opening hours use each drop point's own time zone (`tz`).
- Country shapes: Natural Earth via [world-atlas](https://github.com/topojson/world-atlas) (public domain), embedded at 1:110m and 1:50m.

New boxes and "taken" marks are saved in the browser (`localStorage`) when run locally.

## Next steps

- Real backend (Supabase/Firebase) for listings and pickups
- Street-level map tiles (MapLibre) for city zoom
- Translations (Spanish, Hindi, Chinese, Tagalog, Arabic…)
- Food-safety moderation and auto-expiry
