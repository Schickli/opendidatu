import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Database from 'better-sqlite3'

const STYLE_TEMPLATE_URL =
  'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json'
const MAP_DIRECTORY = path.join(process.cwd(), 'map')
const MAP_MBTILES_PATH = path.join(MAP_DIRECTORY, 'demo.mbtiles')
const MAP_TILE_METADATA_PATH = path.join(MAP_DIRECTORY, 'tiles.json')
const LOCAL_TILE_PATH = '/api/map/tiles/{z}/{x}/{y}'

type VectorSource = {
  type?: string
  tiles?: string[]
  url?: string
  bounds?: [number, number, number, number]
  minzoom?: number
  maxzoom?: number
}

type StyleDocument = {
  glyphs?: string
  sprite?: string
  sources?: Record<string, VectorSource>
  center?: [number, number]
  zoom?: number
  [key: string]: unknown
}

type TileMetadata = {
  bounds?: [number, number, number, number]
  center?: [number, number, number]
  minzoom?: number
  maxzoom?: number
}

let mbtilesDatabase: Database.Database | null = null

async function loadJsonFile<T>(filePath: string) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function loadStyleTemplate(): Promise<StyleDocument> {
  const response = await fetch(STYLE_TEMPLATE_URL, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Die Kartenkonfiguration konnte nicht geladen werden.')
  }

  return (await response.json()) as StyleDocument
}

async function loadTileMetadata() {
  return loadJsonFile<TileMetadata>(MAP_TILE_METADATA_PATH)
}

function toAbsoluteTileTemplate(tilePath: string, origin: string) {
  return `${origin.replace(/\/$/, '')}${tilePath}`
}

function getMbtilesDatabase() {
  if (mbtilesDatabase) {
    return mbtilesDatabase
  }

  mbtilesDatabase = new Database(MAP_MBTILES_PATH, { readonly: true })
  return mbtilesDatabase
}

function rewriteVectorSources(
  style: StyleDocument,
  tileUrl: string,
  metadata: TileMetadata | null
) {
  if (!style.sources) {
    return
  }

  for (const source of Object.values(style.sources)) {
    if (source.type !== 'vector') {
      continue
    }

    delete source.url
    source.tiles = [tileUrl]

    if (metadata?.bounds) {
      source.bounds = metadata.bounds
    }

    if (typeof metadata?.minzoom === 'number') {
      source.minzoom = metadata.minzoom
    }

    if (typeof metadata?.maxzoom === 'number') {
      source.maxzoom = metadata.maxzoom
    }
  }

  if (metadata?.center) {
    const [longitude, latitude, zoom] = metadata.center
    style.center = [longitude, latitude]

    if (typeof zoom === 'number') {
      style.zoom = typeof style.zoom === 'number' ? Math.min(style.zoom, zoom) : zoom
    }
  }

  if (typeof metadata?.maxzoom === 'number') {
    style.zoom = Math.min(typeof style.zoom === 'number' ? style.zoom : metadata.maxzoom, metadata.maxzoom)
  }
}

export async function getMapStyle(origin: string) {
  const style = await loadStyleTemplate()
  const metadata = await loadTileMetadata()

  rewriteVectorSources(style, toAbsoluteTileTemplate(LOCAL_TILE_PATH, origin), metadata)

  return style
}

export function readVectorTile(z: number, x: number, y: number) {
  const db = getMbtilesDatabase()

  if (!db) {
    return null
  }

  const tmsY = (1 << z) - 1 - y
  const row = db
    .prepare(
      'SELECT tile_data AS tileData FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?'
    )
    .get(z, x, tmsY) as { tileData: Buffer } | undefined

  return row?.tileData ?? null
}