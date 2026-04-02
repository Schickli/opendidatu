import { asc, count, desc, eq, inArray } from 'drizzle-orm'
import type {
  CreateMeldungInput,
  CreateMessageTypeInput,
  CreatePostenInput,
  DataSnapshot,
  UpdateMeldungInput,
  UpdateMessageTypeInput,
  UpdatePostenInput,
} from '@/lib/contracts'
import { getDb } from '@/lib/server/database'
import {
  meldungenTable,
  meldungValuesTable,
  messageTypeCategoriesTable,
  messageTypesTable,
  postenTable,
} from '@/lib/server/schema'

function nowTimestamp() {
  return Date.now()
}

export function getDataSnapshot(): DataSnapshot {
  const db = getDb()

  const postenRows = db.select().from(postenTable).orderBy(asc(postenTable.createdAt)).all()
  const messageTypeRows = db
    .select()
    .from(messageTypesTable)
    .orderBy(asc(messageTypesTable.createdAt))
    .all()
  const categoryRows = db
    .select()
    .from(messageTypeCategoriesTable)
    .orderBy(asc(messageTypeCategoriesTable.position))
    .all()
  const meldungRows = db
    .select()
    .from(meldungenTable)
    .orderBy(desc(meldungenTable.createdAt), desc(meldungenTable.id))
    .all()
  const meldungValueRows = db
    .select()
    .from(meldungValuesTable)
    .orderBy(asc(meldungValuesTable.position))
    .all()

  const categoriesByTypeId = new Map<number, typeof categoryRows>()
  for (const category of categoryRows) {
    const current = categoriesByTypeId.get(category.messageTypeId) ?? []
    current.push(category)
    categoriesByTypeId.set(category.messageTypeId, current)
  }

  const valuesByMeldungId = new Map<number, typeof meldungValueRows>()
  for (const value of meldungValueRows) {
    const current = valuesByMeldungId.get(value.meldungId) ?? []
    current.push(value)
    valuesByMeldungId.set(value.meldungId, current)
  }

  return {
    posten: postenRows.map((posten) => ({
      id: posten.id,
      name: posten.name,
      coordinates: {
        easting: posten.easting,
        northing: posten.northing,
      },
      comment: posten.comment,
      createdAt: posten.createdAt,
    })),
    messageTypes: messageTypeRows.map((type) => ({
      id: type.id,
      name: type.name,
      minPerHour: type.minPerHour,
      categories: (categoriesByTypeId.get(type.id) ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        maxDigits: category.maxDigits,
      })),
    })),
    meldungen: meldungRows.map((meldung) => ({
      id: meldung.id,
      postenId: meldung.postenId,
      typeId: meldung.typeId,
      comment: meldung.comment,
      createdAt: meldung.createdAt,
      updatedAt: meldung.updatedAt,
      isValid: meldung.isValid,
      values: (valuesByMeldungId.get(meldung.id) ?? []).map((value) => ({
        categoryId: value.categoryId,
        categoryName: value.categoryName,
        value: value.value,
      })),
    })),
  }
}

export function createPosten(data: CreatePostenInput) {
  const db = getDb()

  db.insert(postenTable)
    .values({
      name: data.name,
      easting: data.coordinates.easting,
      northing: data.coordinates.northing,
      comment: data.comment,
      createdAt: nowTimestamp(),
    })
    .run()

  return getDataSnapshot()
}

export function updatePosten(id: number, data: UpdatePostenInput) {
  const db = getDb()
  const result = db
    .update(postenTable)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.coordinates !== undefined
        ? {
            easting: data.coordinates.easting,
            northing: data.coordinates.northing,
          }
        : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {}),
    })
    .where(eq(postenTable.id, id))
    .run()

  if (result.changes === 0) {
    throw new Error('Posten nicht gefunden.')
  }

  return getDataSnapshot()
}

export function deletePosten(id: number) {
  const db = getDb()

  db.transaction(() => {
    const meldungIds = db
      .select({ id: meldungenTable.id })
      .from(meldungenTable)
      .where(eq(meldungenTable.postenId, id))
      .all()
      .map((meldung) => meldung.id)

    if (meldungIds.length > 0) {
      db.delete(meldungValuesTable)
        .where(inArray(meldungValuesTable.meldungId, meldungIds))
        .run()

      db.delete(meldungenTable).where(eq(meldungenTable.postenId, id)).run()
    }

    db.delete(postenTable).where(eq(postenTable.id, id)).run()
  })

  return getDataSnapshot()
}

export function createMessageType(data: CreateMessageTypeInput) {
  const db = getDb()
  db.transaction(() => {
    const insertResult = db.insert(messageTypesTable)
      .values({
        name: data.name,
        minPerHour: data.minPerHour,
        createdAt: nowTimestamp(),
      })
      .run()

    const typeId = Number(insertResult.lastInsertRowid)

    if (data.categories.length > 0) {
      db.insert(messageTypeCategoriesTable)
        .values(
          data.categories.map((category, index) => ({
            messageTypeId: typeId,
            name: category.name,
            maxDigits: category.maxDigits,
            position: index,
          }))
        )
        .run()
    }
  })

  return getDataSnapshot()
}

export function updateMessageType(id: number, data: UpdateMessageTypeInput) {
  const db = getDb()

  db.transaction(() => {
    const result = db
      .update(messageTypesTable)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.minPerHour !== undefined ? { minPerHour: data.minPerHour } : {}),
      })
      .where(eq(messageTypesTable.id, id))
      .run()

    if (result.changes === 0) {
      throw new Error('Meldungstyp nicht gefunden.')
    }

    if (data.categories) {
      db.delete(messageTypeCategoriesTable)
        .where(eq(messageTypeCategoriesTable.messageTypeId, id))
        .run()

      db.insert(messageTypeCategoriesTable)
        .values(
          data.categories.map((category, index) => ({
            messageTypeId: id,
            name: category.name,
            maxDigits: category.maxDigits,
            position: index,
          }))
        )
        .run()
    }
  })

  return getDataSnapshot()
}

export function deleteMessageType(id: number) {
  const db = getDb()
  const [{ value: meldungCount }] = db
    .select({ value: count() })
    .from(meldungenTable)
    .where(eq(meldungenTable.typeId, id))
    .all()

  if (meldungCount > 0) {
    throw new Error('Meldungstyp kann nicht geloescht werden, solange noch Meldungen darauf verweisen.')
  }

  db.delete(messageTypesTable).where(eq(messageTypesTable.id, id)).run()
  return getDataSnapshot()
}

export function createMeldung(data: CreateMeldungInput) {
  const db = getDb()
  const timestamp = nowTimestamp()

  db.transaction(() => {
    const insertResult = db.insert(meldungenTable)
      .values({
        postenId: data.postenId,
        typeId: data.typeId,
        comment: data.comment,
        createdAt: timestamp,
        updatedAt: timestamp,
        isValid: data.isValid,
      })
      .run()

    const meldungId = Number(insertResult.lastInsertRowid)

    db.insert(meldungValuesTable)
      .values(
        data.values.map((value, index) => ({
          meldungId,
          categoryId: value.categoryId,
          categoryName: value.categoryName,
          value: value.value,
          position: index,
        }))
      )
      .run()
  })

  return getDataSnapshot()
}

export function updateMeldung(id: number, data: UpdateMeldungInput) {
  const db = getDb()

  db.transaction(() => {
    const result = db
      .update(meldungenTable)
      .set({
        ...(data.postenId !== undefined ? { postenId: data.postenId } : {}),
        ...(data.comment !== undefined ? { comment: data.comment } : {}),
        ...(data.isValid !== undefined ? { isValid: data.isValid } : {}),
        updatedAt: nowTimestamp(),
      })
      .where(eq(meldungenTable.id, id))
      .run()

    if (result.changes === 0) {
      throw new Error('Meldung nicht gefunden.')
    }

    if (data.values) {
      db.delete(meldungValuesTable).where(eq(meldungValuesTable.meldungId, id)).run()
      db.insert(meldungValuesTable)
        .values(
          data.values.map((value, index) => ({
            meldungId: id,
            categoryId: value.categoryId,
            categoryName: value.categoryName,
            value: value.value,
            position: index,
          }))
        )
        .run()
    }
  })

  return getDataSnapshot()
}

export function deleteMeldung(id: number) {
  const db = getDb()
  db.delete(meldungenTable).where(eq(meldungenTable.id, id)).run()
  return getDataSnapshot()
}