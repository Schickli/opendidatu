import proj4 from 'proj4'

export interface SwissCoordinates {
  easting: number
  northing: number
}

export interface SwissCoordinateInput {
  easting: string
  northing: string
}

export interface SwissCoordinateValidationErrors {
  easting?: string
  northing?: string
}

const LV95 = 'EPSG:2056'
const WGS84 = 'EPSG:4326'
const LV95_VALUE_PATTERN = /^\d{7}$/

export const LV95_EASTING_RANGE = {
  min: 2480000,
  max: 2840000,
} as const

export const LV95_NORTHING_RANGE = {
  min: 1070000,
  max: 1300000,
} as const

proj4.defs(
  LV95,
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs'
)

function parseCoordinatePart(value: string): number | null {
  if (!LV95_VALUE_PATTERN.test(value)) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function isWithinRange(value: number, range: { min: number; max: number }) {
  return value >= range.min && value <= range.max
}

export function validateSwissCoordinateInput(
  input: SwissCoordinateInput
): SwissCoordinateValidationErrors {
  const errors: SwissCoordinateValidationErrors = {}

  const parsedEasting = parseCoordinatePart(input.easting)
  if (parsedEasting === null) {
    errors.easting = 'Ostwert muss aus genau 7 Ziffern bestehen.'
  } else if (!isWithinRange(parsedEasting, LV95_EASTING_RANGE)) {
    errors.easting = 'Ostwert liegt ausserhalb des gueltigen LV95-Bereichs.'
  }

  const parsedNorthing = parseCoordinatePart(input.northing)
  if (parsedNorthing === null) {
    errors.northing = 'Nordwert muss aus genau 7 Ziffern bestehen.'
  } else if (!isWithinRange(parsedNorthing, LV95_NORTHING_RANGE)) {
    errors.northing = 'Nordwert liegt ausserhalb des gueltigen LV95-Bereichs.'
  }

  return errors
}

export function parseSwissCoordinateInput(
  input: SwissCoordinateInput
): SwissCoordinates | null {
  const errors = validateSwissCoordinateInput(input)
  if (errors.easting || errors.northing) {
    return null
  }

  return {
    easting: Number.parseInt(input.easting, 10),
    northing: Number.parseInt(input.northing, 10),
  }
}

export function formatSwissCoordinateValue(value: number): string {
  return String(Math.round(value))
}

export function formatSwissCoordinates(coordinates: SwissCoordinates): string {
  return `${formatSwissCoordinateValue(coordinates.easting)}, ${formatSwissCoordinateValue(coordinates.northing)}`
}

export function toSwissCoordinateInput(
  coordinates: SwissCoordinates
): SwissCoordinateInput {
  return {
    easting: formatSwissCoordinateValue(coordinates.easting),
    northing: formatSwissCoordinateValue(coordinates.northing),
  }
}

export function swissToWgs84(coordinates: SwissCoordinates): [number, number] {
  return proj4(LV95, WGS84, [coordinates.easting, coordinates.northing]) as [
    number,
    number,
  ]
}

export function wgs84ToSwiss(lng: number, lat: number): SwissCoordinates {
  const [easting, northing] = proj4(WGS84, LV95, [lng, lat]) as [number, number]

  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
  }
}