export interface Posten {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  kommentar: string
  erstelltAm: string
}

export interface MeldungstypKategorie {
  id: string
  name: string
  maxZiffern: number
}

export interface Meldungstyp {
  id: string
  name: string
  kategorien: MeldungstypKategorie[]
  minProStunde: number
}

export interface MeldungKategorieWert {
  kategorieId: string
  kategorieName: string
  wert: string
}

export interface Meldung {
  id: string
  postenId: string
  meldungstypId: string
  werte: MeldungKategorieWert[]
  kommentar: string
  erstelltAm: string
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

function isoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
}

function buildNumericValue(maxZiffern: number, seed: number): string {
  const raw = String((seed + 11) * 137)
  return raw.slice(-maxZiffern).padStart(maxZiffern, '0')
}

export const SAMPLE_POSTEN: Posten[] = [
  {
    id: 'p1',
    name: 'P Alpha',
    coordinates: { lat: 46.95, lng: 7.45 },
    kommentar: 'Kurzer Name, hohe Aktivitaet, sollte alle Minima sauber erfuellen.',
    erstelltAm: isoMinutesAgo(720),
  },
  {
    id: 'p2',
    name: 'Langstreckenbeobachtungsposten Bravo-Suedhang',
    coordinates: { lat: 46.93, lng: 7.48 },
    kommentar: 'Langer Name, teilweise aktiv, einige Mindestwerte werden absichtlich verfehlt.',
    erstelltAm: isoMinutesAgo(680),
  },
  {
    id: 'p3',
    name: 'C3',
    coordinates: { lat: 46.96, lng: 7.42 },
    kommentar: 'Kurzer Name, einzelne Typen fehlen in der letzten Stunde komplett.',
    erstelltAm: isoMinutesAgo(640),
  },
  {
    id: 'p4',
    name: 'Vorgelagerter Beobachtungspunkt Delta-Westflanke',
    coordinates: { lat: 46.9721, lng: 7.4012 },
    kommentar: 'Viele aeltere Meldungen, aber keine aktuelle Erfuellung der Mindestwerte.',
    erstelltAm: isoMinutesAgo(600),
  },
  {
    id: 'p5',
    name: 'E',
    coordinates: { lat: 46.9444, lng: 7.4622 },
    kommentar: 'Erfuellt mehrere Mindestwerte exakt auf der Grenze.',
    erstelltAm: isoMinutesAgo(560),
  },
  {
    id: 'p6',
    name: 'Posten Foxtrot Innenhof',
    coordinates: { lat: 46.9188, lng: 7.4951 },
    kommentar: 'Niedrige Aktivitaet und hauptsaechlich Meldungen ohne Minimum.',
    erstelltAm: isoMinutesAgo(520),
  },
  {
    id: 'p7',
    name: 'G',
    coordinates: { lat: 46.9872, lng: 7.4389 },
    kommentar: 'Sehr viele Wetter-Meldungen, andere Pflicht-Typen fehlen.',
    erstelltAm: isoMinutesAgo(480),
  },
  {
    id: 'p8',
    name: 'Ausgedehnter Erfassungssektor Hotel-Ost-Nord mit Reserve',
    coordinates: { lat: 46.9281, lng: 7.5214 },
    kommentar: 'Hohe Last fuer Listen, Dialoge und Mindestpruefungen.',
    erstelltAm: isoMinutesAgo(440),
  },
]

export const SAMPLE_MELDUNGSTYPEN: Meldungstyp[] = [
  {
    id: 'nt1',
    name: 'TER0',
    kategorien: [
      { id: 'k1', name: 'Eff', maxZiffern: 1 },
      { id: 'k2', name: 'Zeit', maxZiffern: 4 },
    ],
    minProStunde: 1,
  },
  {
    id: 'nt2',
    name: 'METEO-LANG',
    kategorien: [
      { id: 'k3', name: 'Wind', maxZiffern: 3 },
      { id: 'k4', name: 'Sichtweite', maxZiffern: 4 },
      { id: 'k5', name: 'Temperatur', maxZiffern: 2 },
      { id: 'k6', name: 'Bewoelkung', maxZiffern: 2 },
      { id: 'k7', name: 'NiederschlagsartLang', maxZiffern: 2 },
    ],
    minProStunde: 2,
  },
  {
    id: 'nt3',
    name: 'LAGEBEURTEILUNG',
    kategorien: [
      { id: 'k8', name: 'Abschnitt', maxZiffern: 2 },
      { id: 'k9', name: 'Beobachtungsintensitaet', maxZiffern: 1 },
      { id: 'k10', name: 'Kontaktzeit', maxZiffern: 4 },
      { id: 'k11', name: 'Raumtiefe', maxZiffern: 2 },
      { id: 'k12', name: 'Objektklasse', maxZiffern: 2 },
      { id: 'k13', name: 'Zusatz', maxZiffern: 3 },
    ],
    minProStunde: 3,
  },
  {
    id: 'nt4',
    name: 'Q',
    kategorien: [{ id: 'k14', name: 'Q', maxZiffern: 1 }],
    minProStunde: 0,
  },
  {
    id: 'nt5',
    name: 'BEOBABSCHNITT-DETAIL',
    kategorien: [
      { id: 'k15', name: 'Untersektor', maxZiffern: 2 },
      { id: 'k16', name: 'Prioritaet', maxZiffern: 1 },
      { id: 'k17', name: 'Wirkraum', maxZiffern: 2 },
      { id: 'k18', name: 'Eigenlage', maxZiffern: 2 },
      { id: 'k19', name: 'Mittelansatz', maxZiffern: 2 },
      { id: 'k20', name: 'Auffaelligkeitsgrad', maxZiffern: 1 },
      { id: 'k21', name: 'NachfuehrungscodeExtremLang', maxZiffern: 3 },
    ],
    minProStunde: 4,
  },
  {
    id: 'nt6',
    name: 'NAH',
    kategorien: [
      { id: 'k22', name: 'N', maxZiffern: 1 },
      { id: 'k23', name: 'Kurzreferenz', maxZiffern: 2 },
    ],
    minProStunde: 0,
  },
]

const meldungstypById = Object.fromEntries(
  SAMPLE_MELDUNGSTYPEN.map((meldungstyp) => [meldungstyp.id, meldungstyp])
) as Record<string, Meldungstyp>

function createWerteForTyp(meldungstypId: string, seed: number): MeldungKategorieWert[] {
  const meldungstyp = meldungstypById[meldungstypId]

  return meldungstyp.kategorien.map((kategorie, index) => ({
    kategorieId: kategorie.id,
    kategorieName: kategorie.name,
    wert: buildNumericValue(kategorie.maxZiffern, seed + index),
  }))
}

function createMeldung(
  id: string,
  postenId: string,
  meldungstypId: string,
  minutesAgo: number,
  seed: number,
  kommentar = ''
): Meldung {
  return {
    id,
    postenId,
    meldungstypId,
    werte: createWerteForTyp(meldungstypId, seed),
    kommentar,
    erstelltAm: isoMinutesAgo(minutesAgo),
  }
}

function createSeries(
  postenId: string,
  meldungstypId: string,
  minuteOffsets: number[],
  startSeed: number,
  kommentarPrefix: string
): Meldung[] {
  return minuteOffsets.map((minutesAgo, index) =>
    createMeldung(
      `${postenId}-${meldungstypId}-${index + 1}`,
      postenId,
      meldungstypId,
      minutesAgo,
      startSeed + index,
      index % 2 === 0 ? `${kommentarPrefix} ${index + 1}` : ''
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
    new Date(right.erstelltAm).getTime() - new Date(left.erstelltAm).getTime()
)
