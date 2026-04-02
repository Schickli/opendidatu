import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const postenTable = sqliteTable('posten', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  easting: integer('easting').notNull(),
  northing: integer('northing').notNull(),
  comment: text('comment').notNull().default(''),
  createdAt: integer('created_at').notNull(),
})

export const messageTypesTable = sqliteTable('message_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  minPerHour: integer('min_per_hour').notNull().default(0),
  createdAt: integer('created_at').notNull(),
})

export const messageTypeCategoriesTable = sqliteTable('message_type_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  messageTypeId: integer('message_type_id')
    .notNull()
    .references(() => messageTypesTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  maxDigits: integer('max_digits').notNull(),
  position: integer('position').notNull(),
})

export const meldungenTable = sqliteTable('meldungen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postenId: integer('posten_id')
    .notNull()
    .references(() => postenTable.id, { onDelete: 'cascade' }),
  typeId: integer('type_id')
    .notNull()
    .references(() => messageTypesTable.id, { onDelete: 'restrict' }),
  comment: text('comment').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  isValid: integer('is_valid', { mode: 'boolean' }).notNull().default(true),
})

export const meldungValuesTable = sqliteTable('meldung_values', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meldungId: integer('meldung_id')
    .notNull()
    .references(() => meldungenTable.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull(),
  categoryName: text('category_name').notNull(),
  value: text('value').notNull(),
  position: integer('position').notNull(),
})