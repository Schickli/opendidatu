import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { count } from 'drizzle-orm'
import {
  SAMPLE_MELDUNGEN,
  SAMPLE_MELDUNG_TYPES,
  SAMPLE_POSTEN,
} from '@/lib/store'
import {
  meldungenTable,
  meldungValuesTable,
  messageTypeCategoriesTable,
  messageTypesTable,
  postenTable,
} from '@/lib/server/schema'

const SQLITE_MAX_VARIABLES = 32766

function insertInChunks<TValue>(
  values: TValue[],
  columnsPerRow: number,
  insertChunk: (chunk: TValue[]) => void,
) {
  if (values.length === 0) {
    return
  }

  const maxRowsPerInsert = Math.max(1, Math.floor(SQLITE_MAX_VARIABLES / columnsPerRow))

  for (let startIndex = 0; startIndex < values.length; startIndex += maxRowsPerInsert) {
    insertChunk(values.slice(startIndex, startIndex + maxRowsPerInsert))
  }
}

function shouldSeedDevelopmentData() {
  if (process.env.SEED_SAMPLE_DATA === 'true') {
    return true
  }

  if (process.env.SEED_SAMPLE_DATA === 'false') {
    return false
  }

  return process.env.NODE_ENV !== 'production'
}

export function seedSampleDataIfNeeded(db: BetterSQLite3Database<any>) {
  if (!shouldSeedDevelopmentData()) {
    return
  }

  const [{ value: postenCount }] = db
    .select({ value: count() })
    .from(postenTable)
    .all()

  if (postenCount > 0) {
    return
  }

  const postenValues = SAMPLE_POSTEN.map((posten) => ({
    id: posten.id,
    name: posten.name,
    easting: posten.coordinates.easting,
    northing: posten.coordinates.northing,
    comment: posten.comment,
    createdAt: posten.createdAt,
  }))

  const messageTypeValues = SAMPLE_MELDUNG_TYPES.map((type) => ({
    id: type.id,
    name: type.name,
    minPerHour: type.minPerHour,
    createdAt: Date.now(),
  }))

  const messageTypeCategoryValues = SAMPLE_MELDUNG_TYPES.flatMap((type) =>
    type.categories.map((category, index) => ({
      id: category.id,
      messageTypeId: type.id,
      name: category.name,
      maxDigits: category.maxDigits,
      position: index,
    }))
  )

  const meldungRows = SAMPLE_MELDUNGEN.map((meldung) => ({
    id: meldung.id,
    postenId: meldung.postenId,
    typeId: meldung.typeId,
    comment: meldung.comment,
    createdAt: meldung.createdAt,
    updatedAt: meldung.updatedAt,
    isValid: meldung.isValid,
  }))

  const meldungValueRows = SAMPLE_MELDUNGEN.flatMap((meldung) =>
    meldung.values.map((value, index) => ({
      meldungId: meldung.id,
      categoryId: value.categoryId,
      categoryName: value.categoryName,
      value: value.value,
      position: index,
    }))
  )

  db.transaction((tx) => {
    insertInChunks(postenValues, 6, (chunk) => {
      tx.insert(postenTable).values(chunk).run()
    })

    insertInChunks(messageTypeValues, 4, (chunk) => {
      tx.insert(messageTypesTable).values(chunk).run()
    })

    insertInChunks(messageTypeCategoryValues, 5, (chunk) => {
      tx.insert(messageTypeCategoriesTable).values(chunk).run()
    })

    insertInChunks(meldungRows, 7, (chunk) => {
      tx.insert(meldungenTable).values(chunk).run()
    })

    insertInChunks(meldungValueRows, 5, (chunk) => {
      tx.insert(meldungValuesTable).values(chunk).run()
    })
  })
}