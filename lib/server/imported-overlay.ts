import path from 'node:path'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { DOMParser } from '@xmldom/xmldom'
import { gpx, kml } from '@tmcw/togeojson'
import { resolveDatabasePath } from '@/lib/server/database'
import type { ImportedOverlayRecord, ImportedOverlayFeatureCollection } from '@/lib/contracts'

const ACTIVE_OVERLAY_FILE_NAME = 'active-overlay.geojson'

type SupportedImportFormat = 'gpx' | 'kml'

type PersistedOverlayDocument = {
  fileName: string
  data: ImportedOverlayFeatureCollection
}

function resolveImportedOverlayDirectory() {
  const configuredDirectory = process.env.IMPORTED_OVERLAY_DIR

  if (configuredDirectory) {
    return path.resolve(configuredDirectory)
  }

  return path.join(path.dirname(resolveDatabasePath()), 'imports')
}

function getActiveOverlayPath() {
  return path.join(resolveImportedOverlayDirectory(), ACTIVE_OVERLAY_FILE_NAME)
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === '.gpx') {
    return 'gpx'
  }

  if (extension === '.kml') {
    return 'kml'
  }

  return null
}

function isPosition(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 && value.every((entry) => typeof entry === 'number')
}

function collectPositionCount(coordinates: unknown): number {
  if (isPosition(coordinates)) {
    return 1
  }

  if (!Array.isArray(coordinates)) {
    return 0
  }

  return coordinates.reduce<number>((count, entry) => count + collectPositionCount(entry), 0)
}

function countFeatureCoordinates(featureCollection: ImportedOverlayFeatureCollection): number {
  return featureCollection.features.reduce<number>((count, feature) => {
    if (!feature || typeof feature !== 'object' || !('geometry' in feature)) {
      return count
    }

    const geometry = feature.geometry

    if (!geometry || typeof geometry !== 'object' || !('coordinates' in geometry)) {
      return count
    }

    return count + collectPositionCount(geometry.coordinates)
  }, 0)
}

function ensureFeatureCollection(value: unknown): ImportedOverlayFeatureCollection {
  if (
    !value ||
    typeof value !== 'object' ||
    !('type' in value) ||
    value.type !== 'FeatureCollection' ||
    !('features' in value) ||
    !Array.isArray(value.features)
  ) {
    throw new Error('Die importierte Datei konnte nicht als GeoJSON-FeatureCollection gelesen werden.')
  }

  return value as ImportedOverlayFeatureCollection
}

function ensurePersistedOverlayDocument(value: unknown): PersistedOverlayDocument {
  if (
    !value ||
    typeof value !== 'object' ||
    !('fileName' in value) ||
    typeof value.fileName !== 'string' ||
    !('data' in value)
  ) {
    throw new Error('Die gespeicherte Overlay-Datei ist ungueltig.')
  }

  return {
    fileName: value.fileName,
    data: ensureFeatureCollection(value.data),
  }
}

function parseImportedOverlay(xml: string, format: SupportedImportFormat) {
  const document = new DOMParser().parseFromString(xml, 'text/xml')
  const parseErrors = document.getElementsByTagName('parsererror')

  if (parseErrors.length > 0) {
    throw new Error('Die Datei ist kein gueltiges XML.')
  }

  const featureCollection = ensureFeatureCollection(format === 'gpx' ? gpx(document) : kml(document))

  if (featureCollection.features.length === 0) {
    throw new Error('Die Datei enthaelt keine darstellbaren Geometrien.')
  }

  return featureCollection
}

async function ensureImportedOverlayDirectory() {
  await mkdir(resolveImportedOverlayDirectory(), { recursive: true })
}

export async function readImportedOverlay(): Promise<ImportedOverlayRecord | null> {
  const overlayPath = getActiveOverlayPath()

  try {
    const [raw, overlayStat] = await Promise.all([
      readFile(overlayPath, 'utf8'),
      stat(overlayPath),
    ])
    const parsed = ensurePersistedOverlayDocument(JSON.parse(raw))

    return {
      fileName: parsed.fileName,
      uploadedAt: overlayStat.mtimeMs,
      featureCount: parsed.data.features.length,
      coordinateCount: countFeatureCoordinates(parsed.data),
      data: parsed.data,
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }

    throw error
  }
}

export async function saveImportedOverlay(fileName: string, fileContents: string) {
  const format = getFileExtension(fileName)

  if (!format) {
    throw new Error('Nur GPX- und KML-Dateien werden unterstuetzt.')
  }

  const parsed = parseImportedOverlay(fileContents, format)
  const overlayPath = getActiveOverlayPath()
  const tempPath = `${overlayPath}.tmp`

  await ensureImportedOverlayDirectory()
  await writeFile(tempPath, JSON.stringify({ fileName, data: parsed }), 'utf8')
  await rename(tempPath, overlayPath)

  const overlay = await readImportedOverlay()

  if (!overlay) {
    throw new Error('Die importierte Datei konnte nicht gespeichert werden.')
  }

  return {
    ...overlay,
    fileName,
  }
}

export async function deleteImportedOverlay() {
  await rm(getActiveOverlayPath(), { force: true })
}