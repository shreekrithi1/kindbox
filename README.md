# Kindbox SF

Find free, home-cooked food near you in San Francisco, or share a sealed box of food you'd otherwise waste.

- **People who need food** search a map of drop points (community fridges and shelves), filter by diet (vegetarian, vegan, halal, gluten-free, nut-free, soft food…), see walking distance, hours and what's inside each box, and mark a box as taken.
- **Households with extra food** pack it in a clean sealed box, drop it at a Kindbox point, and list it with a short form. The app generates a box label code (e.g. `KB-4821`) to write on the box.

The web layout (≥1024px) has a landing page and a full-screen map with floating panels. Phones get a compact map-plus-list layout.

## Run locally

It's a single static page with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or deploy the folder as-is to Vercel / Netlify / GitHub Pages.

## Mock data

All drop points and sample boxes are fictional. They live in `data/mock-data.json` and are embedded in `index.html` (`<script type="application/json" id="seed">`) so the page also works when opened straight from disk. Keep the two copies in sync when you edit the data. Box times are relative to page load (`packedMinutesAgo`, `eatWithinHours`), so the samples always look fresh.

New boxes and "taken" marks are saved in the browser (`localStorage`) when run locally. When hosted as a Claude artifact they're stored in the artifact's shared database.

## Next steps

- Real backend (Supabase/Firebase) for listings and pickups
- Real map tiles (MapLibre / Leaflet)
- Spanish, Chinese and Tagalog translations
- Food-safety moderation and auto-expiry
