import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import Database from 'better-sqlite3'

const DEFAULT_STYLE_URL =
  'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json'

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
  center?: [number, number, number]
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
let mbtilesPathCache: string | null = null

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function resolveConfiguredPath(configuredPath: string | undefined) {
  if (!configuredPath) {
    return null
  }

  return path.resolve(configuredPath)
}

async function loadJsonFile<T>(filePath: string) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function loadStyleTemplate(): Promise<StyleDocument> {
  const configuredStylePath = resolveConfiguredPath(process.env.MAP_STYLE_JSON_PATH)

  if (configuredStylePath && (await fileExists(configuredStylePath))) {
    return loadJsonFile<StyleDocument>(configuredStylePath)
  }

  const response = await fetch(process.env.MAP_STYLE_URL ?? DEFAULT_STYLE_URL, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Die Kartenkonfiguration konnte nicht geladen werden.')
  }

  return (await response.json()) as StyleDocument
}

async function loadTileMetadata(): Promise<TileMetadata | null> {
  const metadataPath = resolveConfiguredPath(process.env.MAP_METADATA_JSON_PATH)

  if (!metadataPath || !(await fileExists(metadataPath))) {
    return null
  }

  return loadJsonFile<TileMetadata>(metadataPath)
}

function toAbsoluteUrl(urlOrPath: string, origin: string) {
  return new URL(urlOrPath, origin).toString()
}

function getMbtilesPath() {
  return resolveConfiguredPath(process.env.MAP_MBTILES_PATH)
}

function getMbtilesDatabase() {
  const mbtilesPath = getMbtilesPath()

  if (!mbtilesPath) {
    return null
  }

  if (mbtilesDatabase && mbtilesPathCache === mbtilesPath) {
    return mbtilesDatabase
  }

  mbtilesDatabase = new Database(mbtilesPath, { readonly: true })
  mbtilesPathCache = mbtilesPath
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
    style.center = metadata.center
  }

  if (typeof metadata?.maxzoom === 'number') {
    style.zoom = Math.min(typeof style.zoom === 'number' ? style.zoom : metadata.maxzoom, metadata.maxzoom)
  }
}

export async function getMapStyle(origin: string) {
  const style = await loadStyleTemplate()
  const metadata = await loadTileMetadata()

  if (getMbtilesPath()) {
    rewriteVectorSources(style, `${origin}/api/map/tiles/{z}/{x}/{y}`, metadata)
  }

  if (process.env.MAP_GLYPHS_URL) {
    style.glyphs = toAbsoluteUrl(process.env.MAP_GLYPHS_URL, origin)
  }

  if (process.env.MAP_SPRITE_URL) {
    style.sprite = toAbsoluteUrl(process.env.MAP_SPRITE_URL, origin)
  }

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