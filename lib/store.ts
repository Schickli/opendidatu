// Client-side data store for Nachrichtenposten system
// All data is stored in React state and managed via context

export interface Posten {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  kommentar: string
  erstelltAm: string
}

export interface NachrichtentypKategorie {
  id: string
  name: string
  maxZiffern: number
}

export interface Nachrichtentyp {
  id: string
  name: string
  kategorien: NachrichtentypKategorie[]
}

export interface NachrichtKategorieWert {
  kategorieId: string
  kategorieName: string
  wert: string
}

export interface Nachricht {
  id: string
  postenId: string
  nachrichtentypId: string
  werte: NachrichtKategorieWert[]
  kommentar: string
  erstelltAm: string
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

// Sample data for demonstration
export const SAMPLE_POSTEN: Posten[] = [
  {
    id: 'p1',
    name: 'Posten Alpha',
    coordinates: { lat: 46.95, lng: 7.45 },
    kommentar: 'Hauptbeobachtungspunkt Nord',
    erstelltAm: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Posten Bravo',
    coordinates: { lat: 46.93, lng: 7.48 },
    kommentar: 'Sekundaerposten Ost',
    erstelltAm: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Posten Charlie',
    coordinates: { lat: 46.96, lng: 7.42 },
    kommentar: 'Vorgeschobener Posten West',
    erstelltAm: new Date().toISOString(),
  },
]

export const SAMPLE_NACHRICHTENTYPEN: Nachrichtentyp[] = [
  {
    id: 'nt1',
    name: 'TER0',
    kategorien: [
      { id: 'k1', name: 'Effeto', maxZiffern: 1 },
      { id: 'k2', name: 'Zeit', maxZiffern: 4 },
    ],
  },
  {
    id: 'nt2',
    name: 'METEO',
    kategorien: [
      { id: 'k3', name: 'Wind', maxZiffern: 3 },
      { id: 'k4', name: 'Sicht', maxZiffern: 4 },
      { id: 'k5', name: 'Temperatur', maxZiffern: 2 },
    ],
  },
]

export const SAMPLE_NACHRICHTEN: Nachricht[] = [
  {
    id: 'n1',
    postenId: 'p1',
    nachrichtentypId: 'nt1',
    werte: [
      { kategorieId: 'k1', kategorieName: 'Effeto', wert: '1' },
      { kategorieId: 'k2', kategorieName: 'Zeit', wert: '1200' },
    ],
    kommentar: 'Beobachtung bestaetigt',
    erstelltAm: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n2',
    postenId: 'p2',
    nachrichtentypId: 'nt2',
    werte: [
      { kategorieId: 'k3', kategorieName: 'Wind', wert: '120' },
      { kategorieId: 'k4', kategorieName: 'Sicht', wert: '5000' },
      { kategorieId: 'k5', kategorieName: 'Temperatur', wert: '15' },
    ],
    kommentar: 'Wetterlage stabil',
    erstelltAm: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'n3',
    postenId: 'p1',
    nachrichtentypId: 'nt1',
    werte: [
      { kategorieId: 'k1', kategorieName: 'Effeto', wert: '3' },
      { kategorieId: 'k2', kategorieName: 'Zeit', wert: '1415' },
    ],
    kommentar: '',
    erstelltAm: new Date(Date.now() - 600000).toISOString(),
  },
]
