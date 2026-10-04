# Eternal Pot

*Powered by [mnemoIQ.com](https://mnemoiq.com)*

> **Demo only.** Inspired by the Akshaya Patra Foundation's mission that no one should go hungry. Not affiliated with or endorsed by Akshaya Patra. Piloting in the San Francisco Bay Area; all listings are sample data.

A living map of shared meals. People who need food find free, sealed food boxes at community fridges and shelves nearby. Households with extra food pack it, drop it off, and list it.

**Find food:** world map and 3D globe with clustered drop points (like a temple atlas, but for meals). Search by food, city or country, filter by diet (vegetarian, vegan, halal, gluten-free, nut-free, soft food…) and type, see local opening hours, distance and what's inside each box, and mark a box as taken.

**Programs:** NGOs, city councils and community groups post job trainings (back-to-work programs), community meals, food drives, benefits and housing help, and health events. People filter by category and audience (adults, youth, families, seniors, veterans), save programs, and see how to join.

**Languages:** English plus all 22 scheduled languages of India (Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri in Meetei Mayek, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali in Ol Chiki, Sindhi, Tamil, Telugu, Urdu). Pick one on first launch or from the globe button. Urdu, Kashmiri and Sindhi switch the layout to right-to-left. Noto fonts cover every script. Strings live in `i18n/<code>.json`; translations are machine drafts and need review by native speakers.

**Give food:** a short form to list a box at any drop point. It generates a label code (e.g. `EP-4821`) to write on the box.

**Rewards:** donors earn 10 points per box, 2 per serving, and a 15-point bonus for giving 2 or more boxes in one day. Levels go from Seedling to City Champion, with badges along the way. Every 5 boxes in a row (each within 7 days of the last) issues a downloadable certificate of kindness (PNG). "Load sample history" on the Rewards tab shows a certificate right away.

The web layout (≥1024px) has a landing page with a rotating dotted globe and a full-screen map with floating panels. Phones and tablets get an app-style layout: a home feed with category icons, promo cards, "open now" and "fresh boxes" carousels, a full-screen map tab, bottom-sheet details and a bottom tab bar (Home, Map, Give, Programs, Rewards).

## Run locally

Static site, no build step. It loads `data/mock-data.json` with `fetch`, so serve the folder instead of opening the file directly:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Needs an internet connection for the map library (d3 from cdnjs, topojson-client and world-atlas country shapes from jsDelivr) and fonts. Deploys as-is to Vercel, Netlify or GitHub Pages.

## Mock data

108 fictional drop points with 231 sample boxes in 33 cities across 25 countries, with local dishes per region.

- `data/mock-data.json` holds `cities`, `foodBanks`, `packets` and `programs` (14 San Francisco programs; dates are relative to today via `dayOffset`).
- Box times are relative to page load (`packedMinutesAgo`, `eatWithinHours`), so samples always look fresh. Opening hours use each drop point's own time zone (`tz`).
- Country shapes: Natural Earth via [world-atlas](https://github.com/topojson/world-atlas) (public domain), loaded at 1:110m and 1:50m.

## Files

- `index.html` – page markup
- `css/styles.css` – design tokens (light and dark), layouts for phone and web
- `js/app.js` – map, search, filters, give form, programs
- `data/mock-data.json` – sample data

New boxes, "taken" marks, saved programs and rewards are kept in the browser (`localStorage`) when run locally.

## Next steps

- Real backend (Supabase/Firebase) for listings and pickups
- Street-level map tiles (MapLibre) for city zoom
- Translations (Spanish, Hindi, Chinese, Tagalog, Arabic…)
- Food-safety moderation and auto-expiry
