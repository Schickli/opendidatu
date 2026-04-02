# opendidatu

Tries to be a simple alternative to Didatu, with a focus on ease of use. The main goal is to have something for training purposes until a new full featured application is in place.

## Database

By default, the SQLite database is created at `./data/opendidatu.sqlite`.

You can override that location with:

```bash
DATABASE_PATH=/absolute/path/to/opendidatu.sqlite
```

Useful database commands:

```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
```

## Map Assets

The app now serves the map style through `/api/map/style` and can serve vector tiles from a local MBTiles file through `/api/map/tiles/{z}/{x}/{y}`.

Relevant environment variables:

- `MAP_MBTILES_PATH`: absolute or repo-relative path to the `.mbtiles` file
- `MAP_METADATA_JSON_PATH`: optional path to the tiles metadata json
- `MAP_STYLE_JSON_PATH`: optional path to a local style json template
- `MAP_STYLE_URL`: optional remote style URL fallback if no local style file is provided
- `MAP_GLYPHS_URL`: optional override for glyphs endpoint or asset URL
- `MAP_SPRITE_URL`: optional override for sprite endpoint or asset URL

If `MAP_MBTILES_PATH` is set, vector tile sources in the served style are rewritten to the local tile route automatically.

## Docker

The Docker packaging from the architecture plan is still the next major step. The codebase now has the server-side pieces needed for that containerization work, but the image and runtime packaging are not implemented yet.

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

The application is then available at `http://localhost:3000`.
