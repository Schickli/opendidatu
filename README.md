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

Map assets are loaded from fixed files in the repository:

- `map/demo.mbtiles`
- `map/tiles.json`

There is no map-specific environment configuration anymore.

## Docker

The Docker packaging from the architecture plan is still the next major step. The codebase now has the server-side pieces needed for that containerization work, but the image and runtime packaging are not implemented yet.

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

The application is then available at `http://localhost:3000`.
