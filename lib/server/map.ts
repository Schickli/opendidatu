import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Database from 'better-sqlite3'

const DEFAULT_MAP_DIRECTORY = path.join(process.cwd(), 'map')
const LOCAL_TILE_PATH = '/api/map/tiles/{z}/{x}/{y}'
const LOCAL_SPRITE_PATH = '/api/map/sprite/sprite'
const SPRITE_ASSET_CONTENT_TYPES: Record<string, string> = {
  'sprite.json': 'application/json; charset=utf-8',
  'sprite.png': 'image/png',
  'sprite@2x.json': 'application/json; charset=utf-8',
  'sprite@2x.png': 'image/png',
}

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

function resolveMapDirectory() {
  const configuredDirectory = process.env.MAP_DATA_DIR

  if (configuredDirectory) {
    return path.resolve(configuredDirectory)
  }

  return DEFAULT_MAP_DIRECTORY
}

function resolveMapAssetPath(envKey: string, fileName: string) {
  const configuredPath = process.env[envKey]

  if (configuredPath) {
    return path.resolve(configuredPath)
  }

  return path.join(resolveMapDirectory(), fileName)
}

function getMapMbtilesPath() {
  return resolveMapAssetPath('MAP_MBTILES_PATH', 'demo.mbtiles')
}

function getMapTileMetadataPath() {
  return resolveMapAssetPath('MAP_TILE_METADATA_PATH', 'tiles.json')
}

function getStyleTemplatePath() {
  return resolveMapAssetPath('MAP_STYLE_PATH', 'style.json')
}

function getSpriteAssetPath(assetName: keyof typeof SPRITE_ASSET_CONTENT_TYPES) {
  return resolveMapAssetPath(`MAP_${assetName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_PATH`, assetName)
}

async function loadJsonFile<T>(filePath: string) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function loadStyleTemplate(): Promise<StyleDocument> {
  return loadJsonFile<StyleDocument>(getStyleTemplatePath())
}

async function loadTileMetadata() {
  return loadJsonFile<TileMetadata>(getMapTileMetadataPath())
}

function getMbtilesDatabase() {
  if (mbtilesDatabase) {
    return mbtilesDatabase
  }

  mbtilesDatabase = new Database(getMapMbtilesPath(), { readonly: true })
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

export async function getMapStyle() {
  const style = await loadStyleTemplate()
  const metadata = await loadTileMetadata()

  rewriteVectorSources(style, LOCAL_TILE_PATH, metadata)
  style.sprite = LOCAL_SPRITE_PATH

  return style
}

export function isSupportedSpriteAsset(assetName: string): assetName is keyof typeof SPRITE_ASSET_CONTENT_TYPES {
  return assetName in SPRITE_ASSET_CONTENT_TYPES
}

export function getSpriteAssetContentType(assetName: keyof typeof SPRITE_ASSET_CONTENT_TYPES) {
  return SPRITE_ASSET_CONTENT_TYPES[assetName]
}

export async function readSpriteAsset(assetName: keyof typeof SPRITE_ASSET_CONTENT_TYPES) {
  return readFile(getSpriteAssetPath(assetName))
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