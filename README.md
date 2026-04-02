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

The app serves the map style through `/api/map/style` and vector tiles through `/api/map/tiles/{z}/{x}/{y}`.

Map assets default to files in `./map`, but can be overridden at runtime:

- `map/demo.mbtiles`
- `map/tiles.json`
- `map/style.json`

Relevant environment variables:

```bash
MAP_DATA_DIR=./map
MAP_MBTILES_PATH=./map/demo.mbtiles
MAP_TILE_METADATA_PATH=./map/tiles.json
MAP_STYLE_PATH=./map/style.json
MAP_AUTO_DOWNLOAD=true
```

## Docker

The project now includes Docker packaging for a published-image workflow.

Build the image locally:

```bash
docker build -t opendidatu:latest .
```

Run it with persistent named volumes for the SQLite database and map assets:

```bash
docker run --name opendidatu \
  -p 3000:3000 \
  -v opendidatu-data:/app/data \
  -v opendidatu-map:/app/map \
  opendidatu:latest
```

On first startup, the container bootstrap downloads the map metadata, the map style JSON, and the mbtiles archive into the mounted map volume. The database file is created automatically in the mounted data volume.

Useful optional runtime variables:

```bash
DATABASE_PATH=/app/data/opendidatu.sqlite
MAP_DATA_DIR=/app/map
MAP_AUTO_DOWNLOAD=true
MAP_MBTILES_URL=https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/ch.swisstopo.base.vt.mbtiles
MAP_TILE_METADATA_URL=https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/tiles.json
MAP_STYLE_PATH=/app/map/style.json
MAP_STYLE_TEMPLATE_URL=https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json
SEED_SAMPLE_DATA=false
```

Persistence behavior:

- Recreating the container keeps the database as long as `opendidatu-data` is kept.
- The large map download stays out of the image and is reused as long as `opendidatu-map` is kept.
- Set `MAP_AUTO_DOWNLOAD=false` if you want to mount pre-provisioned map files instead of downloading them on first start.
- Once you publish the image to a registry, the target machine only needs the `docker run` command and does not need a repository checkout.

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

The application is then available at `http://localhost:3000`.
