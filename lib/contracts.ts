import { z } from 'zod'
import {
  MELDUNG_VALIDITY_FILTER_VALUES,
  MELDUNG_VALIDITY_VALUES,
} from '@/lib/meldung-validity'

export const swissCoordinatesSchema = z.object({
  easting: z.number().int(),
  northing: z.number().int(),
})

export const postSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  coordinates: swissCoordinatesSchema,
  comment: z.string(),
  createdAt: z.number().int().nonnegative(),
})

export const meldungTypeCategorySchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  maxDigits: z.number().int().min(1),
})

export const meldungTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  categories: z.array(meldungTypeCategorySchema),
  minPerHour: z.number().int().min(0),
})

export const meldungValueSchema = z.object({
  categoryId: z.number().int(),
  categoryName: z.string().min(1),
  value: z.string(),
})

export const meldungSchema = z.object({
  id: z.number().int().positive(),
  postenId: z.number().int().positive(),
  typeId: z.number().int().positive(),
  values: z.array(meldungValueSchema),
  comment: z.string(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  isValid: z.enum(MELDUNG_VALIDITY_VALUES),
})

export const meldungLastHourCountSchema = z.object({
  postenId: z.number().int().positive(),
  typeId: z.number().int().positive(),
  count: z.number().int().nonnegative(),
})

export const meldungValidityFilterSchema = z.enum(MELDUNG_VALIDITY_FILTER_VALUES)

export const meldungenFiltersSchema = z.object({
  typeIds: z.array(z.number().int().positive()),
  validity: meldungValidityFilterSchema,
  rangeStartAt: z.number().int().nonnegative().nullable(),
  rangeEndAt: z.number().int().nonnegative().nullable(),
})

export const postenRecentMeldungenSchema = z.object({
  postenId: z.number().int().positive(),
  meldungen: z.array(meldungSchema),
})

export const bootstrapSnapshotSchema = z.object({
  posten: z.array(postSchema),
  messageTypes: z.array(meldungTypeSchema),
  meldungCount: z.number().int().nonnegative(),
  lastHourCounts: z.array(meldungLastHourCountSchema),
  recentMeldungenByPosten: z.array(postenRecentMeldungenSchema),
})

export const importedOverlayFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
})

export const importedOverlayRecordSchema = z.object({
  fileName: z.string().min(1),
  uploadedAt: z.number().nonnegative(),
  featureCount: z.number().int().nonnegative(),
  coordinateCount: z.number().int().nonnegative(),
  data: importedOverlayFeatureCollectionSchema,
})

export const importedOverlayResponseSchema = z.object({
  overlay: importedOverlayRecordSchema.nullable(),
})

export const meldungenPageSchema = z.object({
  meldungen: z.array(meldungSchema),
  totalCount: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
})

export const createPostenSchema = postSchema.omit({
  id: true,
  createdAt: true,
})

export const updatePostenSchema = createPostenSchema.partial()

export const createMessageTypeSchema = meldungTypeSchema.omit({
  id: true,
}).extend({
  categories: z.array(meldungTypeCategorySchema.partial({ id: true })),
})

export const updateMessageTypeSchema = createMessageTypeSchema.partial()

export const createMeldungSchema = meldungSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateMeldungSchema = z.object({
  postenId: z.number().int().positive().optional(),
  values: z.array(meldungValueSchema).optional(),
  comment: z.string().optional(),
  isValid: z.enum(MELDUNG_VALIDITY_VALUES).optional(),
})

export type BootstrapSnapshot = z.infer<typeof bootstrapSnapshotSchema>
export type ImportedOverlayFeatureCollection = z.infer<typeof importedOverlayFeatureCollectionSchema>
export type ImportedOverlayRecord = z.infer<typeof importedOverlayRecordSchema>
export type ImportedOverlayResponse = z.infer<typeof importedOverlayResponseSchema>
export type MeldungenPage = z.infer<typeof meldungenPageSchema>
export type MeldungLastHourCount = z.infer<typeof meldungLastHourCountSchema>
export type PostenRecentMeldungen = z.infer<typeof postenRecentMeldungenSchema>
export type MeldungenFilters = z.infer<typeof meldungenFiltersSchema>
export type MeldungValidityFilter = z.infer<typeof meldungValidityFilterSchema>
export type CreatePostenInput = z.infer<typeof createPostenSchema>
export type UpdatePostenInput = z.infer<typeof updatePostenSchema>
export type CreateMessageTypeInput = z.infer<typeof createMessageTypeSchema>
export type UpdateMessageTypeInput = z.infer<typeof updateMessageTypeSchema>
export type CreateMeldungInput = z.infer<typeof createMeldungSchema>
export type UpdateMeldungInput = z.infer<typeof updateMeldungSchema>

// Analytics

export const analyticsValidityByPostenSchema = z.object({
  postenId: z.number(),
  postenName: z.string(),
  total: z.number(),
  review: z.number(),
  valid: z.number(),
  invalid: z.number(),
})

export const analyticsMessagesByTypeSchema = z.object({
  postenId: z.number(),
  postenName: z.string(),
  typeId: z.number(),
  typeName: z.string(),
  count: z.number(),
})

export const analyticsHourlyTrendSchema = z.object({
  hour: z.number(),
  postenId: z.number(),
  postenName: z.string(),
  total: z.number(),
  valid: z.number(),
})

export const analyticsComplianceSchema = z.object({
  postenId: z.number(),
  postenName: z.string(),
  typeId: z.number(),
  typeName: z.string(),
  minPerHour: z.number(),
  avgPerHour: z.number(),
})

export const analyticsHourlyByTypeSchema = z.object({
  hour: z.number(),
  postenId: z.number(),
  postenName: z.string(),
  typeId: z.number(),
  typeName: z.string(),
  count: z.number(),
  minPerHour: z.number(),
})

export const analyticsDataSchema = z.object({
  totalMeldungen: z.number(),
  reviewMeldungen: z.number(),
  validMeldungen: z.number(),
  invalidMeldungen: z.number(),
  validityByPosten: z.array(analyticsValidityByPostenSchema),
  messagesByType: z.array(analyticsMessagesByTypeSchema),
  hourlyTrend: z.array(analyticsHourlyTrendSchema),
  compliance: z.array(analyticsComplianceSchema),
  hourlyByType: z.array(analyticsHourlyByTypeSchema),
})

export type AnalyticsData = z.infer<typeof analyticsDataSchema>