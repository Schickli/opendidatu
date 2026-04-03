# OPENDIDATU

![opendidatu](docs/panel.png)

Tries to be a simple alternative to Didatu, with a focus on ease of use. The main goal is to have something for training purposes until a new full featured application is in place.

Its fully self-contained application that can run without any internet connection after the initial setup. It uses SQLite for data storage and serves map assets from local files. We use the Swiss topo vector tiles as a map source.

With the KML/GPX import function, you can easily add additional data to the map, for example a planned route or a security perimeter.

The application also provides a simple way of assesing if periodic messages were sent by the outposts. If for example a outpost forgets to send a hourly mandatory message, this can be easily spotted in the UI and the outpost can be contacted to check if everything is ok.

For every message there is a flag for recording if the message was valid or not. This allows to easily filter out invalid messages in the UI and to have a better overview of the data quality.

![datanqualität](docs/datanqualität.png)

With some built in charts it is also possible to have a quick overview of the data quality and to see if there are any outposts that are not sending valid messages or are missing their hourly mandatory messages.

## Docker

The project now includes Docker packaging for a published-image workflow.

Pushes to `main` automatically build and publish the Docker image to GitHub Container Registry through [docker-publish.yml](.github/workflows/docker-publish.yml). The published image path is:

```bash
ghcr.io/schickli/opendidatu:latest
```

Build the image locally:

```bash
docker build -t opendidatu:latest .
```

Run it with persistent named volumes for the SQLite database and map assets:

```bash
docker run --name opendidatu -p 3000:3000 -v opendidatu-data:/app/data -v opendidatu-map:/app/map ghcr.io/schickli/opendidatu:latest
```

On first startup, the container bootstrap downloads the map metadata, the map style JSON, the sprite assets, and the mbtiles archive into the mounted map volume. The database file is created automatically in the mounted data volume.

Useful optional runtime variables:

```bash
DATABASE_PATH=/app/data/opendidatu.sqlite
IMPORTED_OVERLAY_DIR=/app/data/imports
MAP_DATA_DIR=/app/map
MAP_AUTO_DOWNLOAD=true
MAP_MBTILES_URL=https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/ch.swisstopo.base.vt.mbtiles
MAP_TILE_METADATA_URL=https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/tiles.json
MAP_STYLE_PATH=/app/map/style.json
MAP_STYLE_TEMPLATE_URL=https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json
MAP_SPRITE_BASE_URL=https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite
SEED_SAMPLE_DATA=false
```

Persistence behavior:

- Recreating the container keeps the database as long as `opendidatu-data` is kept.
- The imported GPX/KML overlay is normalized to GeoJSON and persisted under `IMPORTED_OVERLAY_DIR`, which defaults to the same persistent data volume.
- The large map download stays out of the image and is reused as long as `opendidatu-map` is kept.
- Set `MAP_AUTO_DOWNLOAD=false` if you want to mount pre-provisioned map files instead of downloading them on first start.

When you are running this service so that other people in the same network can access it, you might want them to be able to access the application under opendidatu.local instead of the IP address. You can achieve that by adding the following line to your hosts file: 
(On Windows, the hosts file is located at `C:\Windows\System32\drivers\etc\hosts`, on Linux and MacOS it's at `/etc/hosts`)

```
127.0.0.1 opendidatu.local
```

Then you can access the application at `http://opendidatu.local:3000`.

## Import a Overlay

You can upload a GPX or KML file from the header bar. The server converts it to GeoJSON, stores it on disk, and reloads it automatically on the next app start.

You can get a KML file from [map.geo.admin.ch](https://map.geo.admin.ch) where you can use the "Draw & Measure on map" function.

The persisted overlay location defaults to a folder next to the SQLite database, but can be overridden explicitly:

```bash
IMPORTED_OVERLAY_DIR=./data/imports
```

Behavior:

- Only one imported overlay is kept at a time.
- Uploading a new GPX or KML file replaces the previous overlay.
- Clearing the overlay removes the persisted file.
- Imported points, lines, and polygons are rendered only on the map and do not become `Posten` or `Meldungen`.

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

The application is then available at `http://localhost:3000`.

You can also run the download script to fetch the map assets:

```bash
./map/downloadMap.sh
```

## Database

By default, the SQLite database is created at `./data/opendidatu.sqlite`.

You can override that location with:

```bash
DATABASE_PATH=/absolute/path/to/opendidatu.sqlite
```

## Map Assets

The app serves the map style through `/api/map/style`, sprite assets through `/api/map/sprite/sprite(.json|.png|@2x.json|@2x.png)`, and vector tiles through `/api/map/tiles/{z}/{x}/{y}`.

Map assets default to files in `./map`, but can be overridden at runtime:

- `map/demo.mbtiles`
- `map/tiles.json`
- `map/style.json`
- `map/sprite.json`
- `map/sprite.png`
- `map/sprite@2x.json`
- `map/sprite@2x.png`

Relevant environment variables:

```bash
MAP_DATA_DIR=./map
MAP_MBTILES_PATH=./map/demo.mbtiles
MAP_TILE_METADATA_PATH=./map/tiles.json
MAP_STYLE_PATH=./map/style.json
MAP_SPRITE_BASE_URL=https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite
MAP_AUTO_DOWNLOAD=true
```

## Todo's

- [ ] Add a csv export endpoint for the data
- [x] Add a GPX import option for additional data on the map
- [ ] Add integration tests for the API endpoints
- [x] Filters to only show certain type of messages in a certain time range
- [x] Data quality overview with the percentage of valid messages per outpost
- [ ] Instead of console.error handle errors in a more user friendly way and show them in the UI
- [ ] Look at a Threema integration for automatic message creation
- [ ] Implement a permission system for allowing different roles like admin, inspector, reporter
- [ ] Further load test the solution (Maximum tested currently ca. 24'000 Messages)
