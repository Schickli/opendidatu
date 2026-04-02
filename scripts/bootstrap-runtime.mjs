import { createWriteStream } from 'node:fs'
import { mkdir, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const DEFAULT_STYLE_TEMPLATE_URL =
  'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json'
const DEFAULT_SPRITE_BASE_URL =
  'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite'
const DEFAULT_TILE_METADATA_URL =
  'https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/tiles.json'
const DEFAULT_MBTILES_URL =
  'https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/ch.swisstopo.base.vt.mbtiles'

function resolveDatabasePath() {
  return path.resolve(process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'opendidatu.sqlite'))
}

function resolveMapDirectory() {
  return path.resolve(process.env.MAP_DATA_DIR ?? path.join(process.cwd(), 'map'))
}

function resolveMapAssetPath(envKey, fileName) {
  const configuredPath = process.env[envKey]

  if (configuredPath) {
    return path.resolve(configuredPath)
  }

  return path.join(resolveMapDirectory(), fileName)
}

function shouldAutoDownload() {
  return process.env.MAP_AUTO_DOWNLOAD !== 'false'
}

async function ensureDirectoryForFile(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true })
}

async function fileExists(filePath) {
  try {
    const fileStat = await stat(filePath)
    return fileStat.isFile() && fileStat.size > 0
  } catch {
    return false
  }
}

async function downloadFile(url, destinationPath) {
  const tempPath = `${destinationPath}.tmp`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Download failed for ${url}: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error(`Download failed for ${url}: empty response body`)
  }

  await ensureDirectoryForFile(destinationPath)
  await unlink(tempPath).catch(() => undefined)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath))

  try {
    await rename(tempPath, destinationPath)
  } catch (error) {
    await unlink(tempPath).catch(() => undefined)
    throw error
  }
}

async function ensureAsset(filePath, url, label) {
  if (await fileExists(filePath)) {
    return
  }

  if (!shouldAutoDownload()) {
    throw new Error(`${label} is missing at ${filePath}. Provide the file or set MAP_AUTO_DOWNLOAD=true.`)
  }

  console.log(`Downloading ${label}...`)
  await downloadFile(url, filePath)
}

async function ensureSpriteAssets() {
  const spriteBaseUrl = process.env.MAP_SPRITE_BASE_URL ?? DEFAULT_SPRITE_BASE_URL
  const spriteVariants = [
    ['sprite.json', `${spriteBaseUrl}.json`, 'sprite index'],
    ['sprite.png', `${spriteBaseUrl}.png`, 'sprite image'],
    ['sprite@2x.json', `${spriteBaseUrl}@2x.json`, 'sprite index (@2x)'],
    ['sprite@2x.png', `${spriteBaseUrl}@2x.png`, 'sprite image (@2x)'],
  ]

  for (const [fileName, url, label] of spriteVariants) {
    await ensureAsset(resolveMapAssetPath(`MAP_${fileName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_PATH`, fileName), url, label)
  }
}

async function bootstrapRuntime() {
  const databasePath = resolveDatabasePath()
  const mapDirectory = resolveMapDirectory()
  const tileMetadataPath = resolveMapAssetPath('MAP_TILE_METADATA_PATH', 'tiles.json')
  const mbtilesPath = resolveMapAssetPath('MAP_MBTILES_PATH', 'demo.mbtiles')
  const stylePath = resolveMapAssetPath('MAP_STYLE_PATH', 'style.json')

  await mkdir(path.dirname(databasePath), { recursive: true })
  await mkdir(mapDirectory, { recursive: true })

  await ensureAsset(
    tileMetadataPath,
    process.env.MAP_TILE_METADATA_URL ?? DEFAULT_TILE_METADATA_URL,
    'map metadata'
  )
  await ensureAsset(
    stylePath,
    process.env.MAP_STYLE_TEMPLATE_URL ?? DEFAULT_STYLE_TEMPLATE_URL,
    'map style'
  )
  await ensureSpriteAssets()
  await ensureAsset(
    mbtilesPath,
    process.env.MAP_MBTILES_URL ?? DEFAULT_MBTILES_URL,
    'mbtiles archive'
  )
}

function startServer() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.on('SIGINT', forwardSignal)
  process.on('SIGTERM', forwardSignal)

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

bootstrapRuntime()
  .then(() => startServer())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })