import { and, asc, count, desc, eq, gt, gte, inArray, lt, lte, or, sql } from 'drizzle-orm'
import type {
  AnalyticsData,
  BootstrapSnapshot,
  CreateMeldungInput,
  CreateMessageTypeInput,
  CreatePostenInput,
  MeldungenFilters,
  MeldungenPage,
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
import type { MeldungValidity } from '@/lib/meldung-validity'

function nowTimestamp() {
  return Date.now()
}

const DEFAULT_MELDUNGEN_PAGE_SIZE = 100

function encodeMeldungenCursor(createdAt: number, id: number) {
  return `${createdAt}:${id}`
}

function parseMeldungenCursor(cursor: string) {
  const [createdAtValue, idValue] = cursor.split(':')
  const createdAt = Number(createdAtValue)
  const id = Number(idValue)

  if (!Number.isFinite(createdAt) || !Number.isFinite(id)) {
    throw new Error('Ungültiger Meldungen-Cursor.')
  }

  return { createdAt, id }
}

function buildCategoriesByTypeId() {
  const db = getDb()

  const categoryRows = db
    .select()
    .from(messageTypeCategoriesTable)
    .orderBy(asc(messageTypeCategoriesTable.position))
    .all()

  const categoriesByTypeId = new Map<number, typeof categoryRows>()
  for (const category of categoryRows) {
    const current = categoriesByTypeId.get(category.messageTypeId) ?? []
    current.push(category)
    categoriesByTypeId.set(category.messageTypeId, current)
  }

  return categoriesByTypeId
}

function getPostenData() {
  const db = getDb()
  const postenRows = db.select().from(postenTable).orderBy(asc(postenTable.createdAt)).all()

  return postenRows.map((posten) => ({
    id: posten.id,
    name: posten.name,
    coordinates: {
      easting: posten.easting,
      northing: posten.northing,
    },
    comment: posten.comment,
    createdAt: posten.createdAt,
  }))
}

function getMessageTypeData() {
  const db = getDb()
  const categoriesByTypeId = buildCategoriesByTypeId()
  const messageTypeRows = db
    .select()
    .from(messageTypesTable)
    .orderBy(asc(messageTypesTable.createdAt))
    .all()

  return messageTypeRows.map((type) => ({
    id: type.id,
    name: type.name,
    minPerHour: type.minPerHour,
    categories: (categoriesByTypeId.get(type.id) ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      maxDigits: category.maxDigits,
    })),
  }))
}

function getMeldungValuesById(meldungIds: number[]) {
  const db = getDb()

  if (meldungIds.length === 0) {
    return new Map<number, Array<{ categoryId: number; categoryName: string; value: string }>>()
  }

  const meldungValueRows = db
    .select()
    .from(meldungValuesTable)
    .where(inArray(meldungValuesTable.meldungId, meldungIds))
    .orderBy(asc(meldungValuesTable.position))
    .all()

  const valuesByMeldungId = new Map<number, typeof meldungValueRows>()
  for (const value of meldungValueRows) {
    const current = valuesByMeldungId.get(value.meldungId) ?? []
    current.push(value)
    valuesByMeldungId.set(value.meldungId, current)
  }

  return valuesByMeldungId
}

function mapMeldungen(
  meldungRows: Array<{
    id: number
    postenId: number
    typeId: number
    comment: string
    createdAt: number
    updatedAt: number
    isValid: MeldungValidity
  }>,
) {
  const valuesByMeldungId = getMeldungValuesById(meldungRows.map((meldung) => meldung.id))

  return meldungRows.map((meldung) => ({
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
  }))
}

export function getBootstrapSnapshot(): BootstrapSnapshot {
  const db = getDb()
  const posten = getPostenData()
  const messageTypes = getMessageTypeData()
  const [{ value: meldungCount }] = db.select({ value: count() }).from(meldungenTable).all()
  const oneHourAgo = nowTimestamp() - 60 * 60 * 1000
  const lastHourCounts = db
    .select({
      postenId: meldungenTable.postenId,
      typeId: meldungenTable.typeId,
      count: count(),
    })
    .from(meldungenTable)
    .where(and(eq(meldungenTable.isValid, 'valid'), gt(meldungenTable.createdAt, oneHourAgo)))
    .groupBy(meldungenTable.postenId, meldungenTable.typeId)
    .all()

  const recentRowsByPosten = posten.map((postenEntry) => ({
    postenId: postenEntry.id,
    rows: db
      .select()
      .from(meldungenTable)
      .where(eq(meldungenTable.postenId, postenEntry.id))
      .orderBy(desc(meldungenTable.createdAt), desc(meldungenTable.id))
      .limit(3)
      .all(),
  }))

  return {
    posten,
    messageTypes,
    meldungCount,
    lastHourCounts,
    recentMeldungenByPosten: recentRowsByPosten.map((entry) => ({
      postenId: entry.postenId,
      meldungen: mapMeldungen(entry.rows),
    })),
  }
}

export function getMeldungenPage(options?: {
  postenId?: number
  limit?: number
  cursor?: string
  filters?: MeldungenFilters
}): MeldungenPage {
  const db = getDb()
  const pageSize = Math.max(1, Math.min(options?.limit ?? DEFAULT_MELDUNGEN_PAGE_SIZE, 200))
  const meldungenFilters = options?.filters
  const filters = [] as Array<ReturnType<typeof eq> | ReturnType<typeof or>>

  if (options?.postenId !== undefined) {
    filters.push(eq(meldungenTable.postenId, options.postenId))
  }

  const filteredTypeIds = meldungenFilters?.typeIds ?? []
  const rangeStartAt = meldungenFilters?.rangeStartAt
  const rangeEndAt = meldungenFilters?.rangeEndAt

  if (filteredTypeIds.length > 0) {
    filters.push(inArray(meldungenTable.typeId, filteredTypeIds))
  }

  if (meldungenFilters?.validity && meldungenFilters.validity !== 'all') {
    filters.push(eq(meldungenTable.isValid, meldungenFilters.validity))
  }

  if (rangeStartAt !== null && rangeStartAt !== undefined) {
    filters.push(gte(meldungenTable.createdAt, rangeStartAt))
  }

  if (rangeEndAt !== null && rangeEndAt !== undefined) {
    filters.push(lte(meldungenTable.createdAt, rangeEndAt))
  }

  if (options?.cursor) {
    const cursor = parseMeldungenCursor(options.cursor)
    filters.push(
      or(
        lt(meldungenTable.createdAt, cursor.createdAt),
        and(eq(meldungenTable.createdAt, cursor.createdAt), lt(meldungenTable.id, cursor.id)),
      ),
    )
  }

  const whereClause = filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters)
  const totalQuery = db.select({ value: count() }).from(meldungenTable)
  const pageQuery = db
    .select()
    .from(meldungenTable)
    .orderBy(desc(meldungenTable.createdAt), desc(meldungenTable.id))
    .limit(pageSize + 1)

  if (whereClause) {
    totalQuery.where(whereClause)
    pageQuery.where(whereClause)
  }

  const [{ value: totalCount }] = totalQuery.all()
  const rows = pageQuery.all()
  const hasMore = rows.length > pageSize
  const meldungRows = hasMore ? rows.slice(0, pageSize) : rows
  const lastRow = meldungRows.at(-1)

  return {
    meldungen: mapMeldungen(meldungRows),
    totalCount,
    hasMore,
    nextCursor: hasMore && lastRow ? encodeMeldungenCursor(lastRow.createdAt, lastRow.id) : null,
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

  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
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
  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
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

  return getBootstrapSnapshot()
}

export function deleteMeldung(id: number) {
  const db = getDb()
  db.delete(meldungenTable).where(eq(meldungenTable.id, id)).run()
  return getBootstrapSnapshot()
}

export function getAnalyticsData(options?: {
  rangeStartAt?: number
  rangeEndAt?: number
}): AnalyticsData {
  const db = getDb()
  const HOUR_MS = 60 * 60 * 1000
  const floorToHour = (timestamp: number) => Math.floor(timestamp / HOUR_MS) * HOUR_MS
  const timeFilters: Array<ReturnType<typeof gte>> = []

  if (options?.rangeStartAt !== undefined) {
    timeFilters.push(gte(meldungenTable.createdAt, options.rangeStartAt))
  }
  if (options?.rangeEndAt !== undefined) {
    timeFilters.push(lte(meldungenTable.createdAt, options.rangeEndAt))
  }

  const whereClause =
    timeFilters.length === 0
      ? undefined
      : timeFilters.length === 1
        ? timeFilters[0]
        : and(...timeFilters)

  const postenRows = db.select().from(postenTable).all()
  const postenMap = new Map(postenRows.map((p) => [p.id, p.name]))

  const typeRows = db.select().from(messageTypesTable).all()
  const typeMap = new Map(typeRows.map((t) => [t.id, t]))

  // Overall counts
  const [{ value: totalMeldungen }] = db
    .select({ value: count() })
    .from(meldungenTable)
    .where(whereClause)
    .all()

  const validWhere = whereClause
    ? and(whereClause, eq(meldungenTable.isValid, 'valid'))
    : eq(meldungenTable.isValid, 'valid')

  const [{ value: validMeldungen }] = db
    .select({ value: count() })
    .from(meldungenTable)
    .where(validWhere)
    .all()

  const reviewWhere = whereClause
    ? and(whereClause, eq(meldungenTable.isValid, 'review'))
    : eq(meldungenTable.isValid, 'review')

  const [{ value: reviewMeldungen }] = db
    .select({ value: count() })
    .from(meldungenTable)
    .where(reviewWhere)
    .all()

  const invalidWhere = whereClause
    ? and(whereClause, eq(meldungenTable.isValid, 'invalid'))
    : eq(meldungenTable.isValid, 'invalid')

  const [{ value: invalidMeldungen }] = db
    .select({ value: count() })
    .from(meldungenTable)
    .where(invalidWhere)
    .all()

  // Validity grouped by posten
  const validityGrouped = db
    .select({
      postenId: meldungenTable.postenId,
      isValid: meldungenTable.isValid,
      count: count(),
    })
    .from(meldungenTable)
    .where(whereClause)
    .groupBy(meldungenTable.postenId, meldungenTable.isValid)
    .all()

  const validityAgg = new Map<number, { review: number; valid: number; invalid: number }>()
  for (const row of validityGrouped) {
    const cur = validityAgg.get(row.postenId) ?? { review: 0, valid: 0, invalid: 0 }
    if (row.isValid === 'valid') {
      cur.valid = row.count
    } else if (row.isValid === 'invalid') {
      cur.invalid = row.count
    } else {
      cur.review = row.count
    }
    validityAgg.set(row.postenId, cur)
  }

  const validityByPosten = Array.from(validityAgg.entries()).map(([postenId, c]) => ({
    postenId,
    postenName: postenMap.get(postenId) ?? `Posten ${postenId}`,
    total: c.review + c.valid + c.invalid,
    review: c.review,
    valid: c.valid,
    invalid: c.invalid,
  }))

  // Messages per type per posten
  const msgByTypeGrouped = db
    .select({
      postenId: meldungenTable.postenId,
      typeId: meldungenTable.typeId,
      count: count(),
    })
    .from(meldungenTable)
    .where(whereClause)
    .groupBy(meldungenTable.postenId, meldungenTable.typeId)
    .all()

  const messagesByType = msgByTypeGrouped.map((row) => ({
    postenId: row.postenId,
    postenName: postenMap.get(row.postenId) ?? `Posten ${row.postenId}`,
    typeId: row.typeId,
    typeName: typeMap.get(row.typeId)?.name ?? `Typ ${row.typeId}`,
    count: row.count,
  }))

  // Trend uses 30-minute bins; compliance view keeps hourly bins below.
  const trendBucket = sql<number>`(${meldungenTable.createdAt} / 1800000) * 1800000`
  const hourBucket = sql<number>`(${meldungenTable.createdAt} / 3600000) * 3600000`

  const hourlyRows = db
    .select({
      trendBucket,
      postenId: meldungenTable.postenId,
      isValid: meldungenTable.isValid,
      count: count(),
    })
    .from(meldungenTable)
    .where(whereClause)
    .groupBy(trendBucket, meldungenTable.postenId, meldungenTable.isValid)
    .orderBy(trendBucket)
    .all()

  const hourlyAgg = new Map<string, { hour: number; postenId: number; total: number; valid: number }>()
  for (const row of hourlyRows) {
    const key = `${row.trendBucket}:${row.postenId}`
    const cur = hourlyAgg.get(key) ?? { hour: row.trendBucket, postenId: row.postenId, total: 0, valid: 0 }
    cur.total += row.count
    if (row.isValid === 'valid') {
      cur.valid += row.count
    }
    hourlyAgg.set(key, cur)
  }

  const hourlyTrend = Array.from(hourlyAgg.values()).map((entry) => ({
    ...entry,
    postenName: postenMap.get(entry.postenId) ?? `Posten ${entry.postenId}`,
  }))

  const observedHours = hourlyTrend.map((entry) => floorToHour(entry.hour))
  const observedHourStart = observedHours.length > 0 ? Math.min(...observedHours) : undefined
  const observedHourEnd = observedHours.length > 0 ? Math.max(...observedHours) : undefined
  const hourRangeStart =
    options?.rangeStartAt !== undefined
      ? floorToHour(options.rangeStartAt)
      : observedHourStart
  const hourRangeEnd =
    options?.rangeEndAt !== undefined ? floorToHour(options.rangeEndAt) : observedHourEnd
  const distinctHours =
    hourRangeStart !== undefined && hourRangeEnd !== undefined
      ? Math.max(1, Math.floor((hourRangeEnd - hourRangeStart) / HOUR_MS) + 1)
      : 1

  // Compliance: avg messages per hour vs minPerHour
  const validMsgByTypeGrouped = db
    .select({
      postenId: meldungenTable.postenId,
      typeId: meldungenTable.typeId,
      count: count(),
    })
    .from(meldungenTable)
    .where(validWhere)
    .groupBy(meldungenTable.postenId, meldungenTable.typeId)
    .all()

  const complianceMap = new Map<string, number>()
  for (const row of validMsgByTypeGrouped) {
    complianceMap.set(`${row.postenId}:${row.typeId}`, row.count)
  }

  const compliance: AnalyticsData['compliance'] = []
  for (const [postenId] of postenMap) {
    for (const [typeId, typeRow] of typeMap) {
      if (typeRow.minPerHour <= 0) continue
      const totalCount = complianceMap.get(`${postenId}:${typeId}`) ?? 0
      compliance.push({
        postenId,
        postenName: postenMap.get(postenId) ?? `Posten ${postenId}`,
        typeId,
        typeName: typeRow.name,
        minPerHour: typeRow.minPerHour,
        avgPerHour: Math.round((totalCount / distinctHours) * 100) / 100,
      })
    }
  }

  // Hourly valid counts by type (for per-hour compliance heatmap)
  const hourlyByTypeRows = db
    .select({
      hourBucket,
      postenId: meldungenTable.postenId,
      typeId: meldungenTable.typeId,
      count: count(),
    })
    .from(meldungenTable)
    .where(validWhere)
    .groupBy(hourBucket, meldungenTable.postenId, meldungenTable.typeId)
    .orderBy(hourBucket)
    .all()

  const hourlyByType = hourlyByTypeRows.map((row) => ({
    hour: row.hourBucket,
    postenId: row.postenId,
    postenName: postenMap.get(row.postenId) ?? `Posten ${row.postenId}`,
    typeId: row.typeId,
    typeName: typeMap.get(row.typeId)?.name ?? `Typ ${row.typeId}`,
    count: row.count,
    minPerHour: typeMap.get(row.typeId)?.minPerHour ?? 0,
  }))

  return {
    totalMeldungen,
    reviewMeldungen,
    validMeldungen,
    invalidMeldungen,
    validityByPosten,
    messagesByType,
    hourlyTrend,
    compliance,
    hourlyByType,
  }
}