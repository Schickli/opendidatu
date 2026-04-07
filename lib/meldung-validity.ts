export const MELDUNG_VALIDITY_VALUES = ['review', 'valid', 'invalid'] as const

export type MeldungValidity = (typeof MELDUNG_VALIDITY_VALUES)[number]

export const MELDUNG_VALIDITY_FILTER_VALUES = ['all', 'review', 'valid', 'invalid'] as const

export type MeldungValidityFilter = (typeof MELDUNG_VALIDITY_FILTER_VALUES)[number]

export const MELDUNG_VALIDITY_LABELS: Record<MeldungValidity, string> = {
  review: 'Zu prüfen',
  valid: 'Gültig',
  invalid: 'Ungültig',
}

export const MELDUNG_VALIDITY_FILTER_LABELS: Record<MeldungValidityFilter, string> = {
  all: 'Alle Stati',
  review: 'Nur zu prüfen',
  valid: 'Nur gültige',
  invalid: 'Nur ungültige',
}