import type { SwissCoordinates } from './coordinates'

export interface Posten {
  id: string
  name: string
  coordinates: SwissCoordinates
  comment: string
  createdAt: string
}

export interface MeldungTypeCategory {
  id: string
  name: string
  maxDigits: number
}

export interface MeldungType {
  id: string
  name: string
  categories: MeldungTypeCategory[]
  minPerHour: number
}

export interface MeldungValue {
  categoryId: string
  categoryName: string
  value: string
}

export interface Meldung {
  id: string
  postenId: string
  typeId: string
  values: MeldungValue[]
  comment: string
  createdAt: string
  updatedAt: string
  isValid: boolean
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

function isoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
}

function buildNumericValue(maxDigits: number, seed: number): string {
  const raw = String((seed + 11) * 137)
  return raw.slice(-maxDigits).padStart(maxDigits, '0')
}

export const SAMPLE_POSTEN: Posten[] = [
  {
    id: 'p1',
    name: 'P Alpha',
    coordinates: { easting: 2600865, northing: 1199880 },
    comment: 'Kurzer Name, hohe Aktivitaet, sollte alle Minima sauber erfuellen.',
    createdAt: isoMinutesAgo(720),
  },
  {
    id: 'p2',
    name: 'Langstreckenbeobachtungsposten Bravo-Suedhang',
    coordinates: { easting: 2603150, northing: 1197657 },
    comment: 'Langer Name, teilweise aktiv, einige Mindestwerte werden absichtlich verfehlt.',
    createdAt: isoMinutesAgo(680),
  },
  {
    id: 'p3',
    name: 'C3',
    coordinates: { easting: 2598582, northing: 1200992 },
    comment: 'Kurzer Name, einzelne Typen fehlen in der letzten Stunde komplett.',
    createdAt: isoMinutesAgo(640),
  },
  {
    id: 'p4',
    name: 'Vorgelagerter Beobachtungspunkt Delta-Westflanke',
    coordinates: { easting: 2597152, northing: 1202337 },
    comment: 'Viele aeltere Meldungen, aber keine aktuelle Erfuellung der Mindestwerte.',
    createdAt: isoMinutesAgo(600),
  },
  {
    id: 'p5',
    name: 'E',
    coordinates: { easting: 2601794, northing: 1199257 },
    comment: 'Erfuellt mehrere Mindestwerte exakt auf der Grenze.',
    createdAt: isoMinutesAgo(560),
  },
  {
    id: 'p6',
    name: 'Posten Foxtrot Innenhof',
    coordinates: { easting: 2604301, northing: 1196413 },
    comment: 'Niedrige Aktivitaet und hauptsaechlich Meldungen ohne Minimum.',
    createdAt: isoMinutesAgo(520),
  },
  {
    id: 'p7',
    name: 'G',
    coordinates: { easting: 2600020, northing: 1204015 },
    comment: 'Sehr viele Wetter-Meldungen, andere Pflicht-Typen fehlen.',
    createdAt: isoMinutesAgo(480),
  },
  {
    id: 'p8',
    name: 'Ausgedehnter Erfassungssektor Hotel-Ost-Nord mit Reserve',
    coordinates: { easting: 2606303, northing: 1197448 },
    comment: 'Hohe Last fuer Listen, Dialoge und Mindestpruefungen.',
    createdAt: isoMinutesAgo(440),
  },
]

export const SAMPLE_MELDUNG_TYPES: MeldungType[] = [
  {
    id: 'nt1',
    name: 'TER0',
    categories: [
      { id: 'k1', name: 'Eff', maxDigits: 1 },
      { id: 'k2', name: 'Zeit', maxDigits: 4 },
    ],
    minPerHour: 1,
  },
  {
    id: 'nt2',
    name: 'METEO-LANG',
    categories: [
      { id: 'k3', name: 'Wind', maxDigits: 3 },
      { id: 'k4', name: 'Sichtweite', maxDigits: 4 },
      { id: 'k5', name: 'Temperatur', maxDigits: 2 },
      { id: 'k6', name: 'Bewoelkung', maxDigits: 2 },
      { id: 'k7', name: 'NiederschlagsartLang', maxDigits: 2 },
    ],
    minPerHour: 2,
  },
  {
    id: 'nt3',
    name: 'LAGEBEURTEILUNG',
    categories: [
      { id: 'k8', name: 'Abschnitt', maxDigits: 2 },
      { id: 'k9', name: 'Beobachtungsintensitaet', maxDigits: 1 },
      { id: 'k10', name: 'Kontaktzeit', maxDigits: 4 },
      { id: 'k11', name: 'Raumtiefe', maxDigits: 2 },
      { id: 'k12', name: 'Objektklasse', maxDigits: 2 },
      { id: 'k13', name: 'Zusatz', maxDigits: 3 },
    ],
    minPerHour: 3,
  },
  {
    id: 'nt4',
    name: 'Q',
    categories: [{ id: 'k14', name: 'Q', maxDigits: 1 }],
    minPerHour: 0,
  },
  {
    id: 'nt5',
    name: 'BEOBABSCHNITT-DETAIL',
    categories: [
      { id: 'k15', name: 'Untersektor', maxDigits: 2 },
      { id: 'k16', name: 'Prioritaet', maxDigits: 1 },
      { id: 'k17', name: 'Wirkraum', maxDigits: 2 },
      { id: 'k18', name: 'Eigenlage', maxDigits: 2 },
      { id: 'k19', name: 'Mittelansatz', maxDigits: 2 },
      { id: 'k20', name: 'Auffaelligkeitsgrad', maxDigits: 1 },
      { id: 'k21', name: 'NachfuehrungscodeExtremLang', maxDigits: 3 },
    ],
    minPerHour: 4,
  },
  {
    id: 'nt6',
    name: 'NAH',
    categories: [
      { id: 'k22', name: 'N', maxDigits: 1 },
      { id: 'k23', name: 'Kurzreferenz', maxDigits: 2 },
    ],
    minPerHour: 0,
  },
]

const meldungTypeById = Object.fromEntries(
  SAMPLE_MELDUNG_TYPES.map((meldungType) => [meldungType.id, meldungType])
) as Record<string, MeldungType>

function createValuesForType(typeId: string, seed: number): MeldungValue[] {
  const meldungType = meldungTypeById[typeId]

  return meldungType.categories.map((category, index) => ({
    categoryId: category.id,
    categoryName: category.name,
    value: buildNumericValue(category.maxDigits, seed + index),
  }))
}

function createMeldung(
  id: string,
  postenId: string,
  typeId: string,
  minutesAgo: number,
  seed: number,
  comment = ''
): Meldung {
  const createdAt = isoMinutesAgo(minutesAgo)

  return {
    id,
    postenId,
    typeId,
    values: createValuesForType(typeId, seed),
    comment,
    createdAt,
    updatedAt: createdAt,
    isValid: seed % 2 == 0 ? true : false,
  }
}

function createSeries(
  postenId: string,
  typeId: string,
  minuteOffsets: number[],
  startSeed: number,
  commentPrefix: string
): Meldung[] {
  return minuteOffsets.map((minutesAgo, index) =>
    createMeldung(
      `${postenId}-${typeId}-${index + 1}`,
      postenId,
      typeId,
      minutesAgo,
      startSeed + index,
      index % 2 === 0 ? `${commentPrefix} ${index + 1}` : ''
    )
  )
}

export const SAMPLE_MELDUNGEN: Meldung[] = [
  ...createSeries('p1', 'nt1', [5, 18], 10, 'TER0 bestaetigt'),
  ...createSeries('p1', 'nt2', [7, 22, 41], 20, 'METEO stabil'),
  ...createSeries('p1', 'nt3', [9, 27, 48], 30, 'Lagebild beobachtet'),
  ...createSeries('p1', 'nt5', [11, 19, 33, 52], 40, 'Abschnitt vollstaendig'),
  ...createSeries('p1', 'nt4', [63, 96, 130], 50, 'Zusatz ohne Minimum'),

  ...createSeries('p2', 'nt1', [8], 60, 'Nur knapp aktiv'),
  ...createSeries('p2', 'nt2', [16], 70, 'Zu wenig Wetterdaten'),
  ...createSeries('p2', 'nt3', [12, 34, 55], 80, 'Lage knapp ausreichend'),
  ...createSeries('p2', 'nt5', [21, 49], 90, 'Detailmeldungen fehlen'),
  ...createSeries('p2', 'nt6', [73, 140], 100, 'Kurzmeldung'),

  ...createSeries('p3', 'nt2', [6, 38], 110, 'Wetter erfasst'),
  ...createSeries('p3', 'nt3', [14], 120, 'Lage unvollstaendig'),
  ...createSeries('p3', 'nt5', [10, 24, 37, 58], 130, 'Detailreihe gut'),
  ...createSeries('p3', 'nt4', [82], 140, 'Freier Zusatz'),

  ...createSeries('p4', 'nt1', [75, 128], 150, 'Altmeldung TER0'),
  ...createSeries('p4', 'nt2', [91, 143, 201], 160, 'Altmeldung METEO'),
  ...createSeries('p4', 'nt3', [88, 166], 170, 'Altmeldung Lage'),
  ...createSeries('p4', 'nt5', [77, 132, 188], 180, 'Altmeldung Abschnitt'),

  ...createSeries('p5', 'nt1', [4], 190, 'Exakt auf Minimum'),
  ...createSeries('p5', 'nt2', [17, 44], 200, 'Exakt zwei Wettermeldungen'),
  ...createSeries('p5', 'nt3', [13, 29, 57], 210, 'Exakt drei Lagemeldungen'),
  ...createSeries('p5', 'nt5', [15, 26, 39, 54], 220, 'Exakt vier Detailmeldungen'),
  ...createSeries('p5', 'nt6', [95], 230, 'Zusatzmeldung'),

  ...createSeries('p6', 'nt4', [12, 31, 67], 240, 'Q-Meldung'),
  ...createSeries('p6', 'nt6', [9, 43], 250, 'NAH-Meldung'),
  ...createSeries('p6', 'nt1', [119], 260, 'Zu alt fuer Minimum'),

  ...createSeries('p7', 'nt2', [5, 14, 23, 36, 50], 270, 'Sehr viele Wetterdaten'),
  ...createSeries('p7', 'nt4', [18, 61, 102], 280, 'Freie Zusatzmeldung'),
  ...createSeries('p7', 'nt6', [28], 290, 'Kurzer Zusatz'),

  ...createSeries('p8', 'nt1', [7], 300, 'Grenzwert erreicht'),
  ...createSeries('p8', 'nt2', [6, 25], 310, 'Wetterminimum erreicht'),
  ...createSeries('p8', 'nt3', [8, 20, 32, 47], 320, 'Lagebild intensiv'),
  ...createSeries('p8', 'nt5', [9, 18, 27, 35, 53], 330, 'Sehr viele Detailmeldungen'),
  ...createSeries('p8', 'nt4', [64, 84, 124, 155], 340, 'Historische Zusatzmeldung'),
  ...createSeries('p8', 'nt6', [11, 59], 350, 'Kurze Nahmeldung'),
].sort(
  (left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
)
