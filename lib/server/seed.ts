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

  db.transaction(() => {
    db.insert(postenTable)
      .values(
        SAMPLE_POSTEN.map((posten) => ({
          id: posten.id,
          name: posten.name,
          easting: posten.coordinates.easting,
          northing: posten.coordinates.northing,
          comment: posten.comment,
          createdAt: posten.createdAt,
        }))
      )
      .run()

    db.insert(messageTypesTable)
      .values(
        SAMPLE_MELDUNG_TYPES.map((type) => ({
          id: type.id,
          name: type.name,
          minPerHour: type.minPerHour,
          createdAt: Date.now(),
        }))
      )
      .run()

    db.insert(messageTypeCategoriesTable)
      .values(
        SAMPLE_MELDUNG_TYPES.flatMap((type) =>
          type.categories.map((category, index) => ({
            id: category.id,
            messageTypeId: type.id,
            name: category.name,
            maxDigits: category.maxDigits,
            position: index,
          }))
        )
      )
      .run()

    db.insert(meldungenTable)
      .values(
        SAMPLE_MELDUNGEN.map((meldung) => ({
          id: meldung.id,
          postenId: meldung.postenId,
          typeId: meldung.typeId,
          comment: meldung.comment,
          createdAt: meldung.createdAt,
          updatedAt: meldung.updatedAt,
          isValid: meldung.isValid,
        }))
      )
      .run()

    db.insert(meldungValuesTable)
      .values(
        SAMPLE_MELDUNGEN.flatMap((meldung) =>
          meldung.values.map((value, index) => ({
            meldungId: meldung.id,
            categoryId: value.categoryId,
            categoryName: value.categoryName,
            value: value.value,
            position: index,
          }))
        )
      )
      .run()
  })
}