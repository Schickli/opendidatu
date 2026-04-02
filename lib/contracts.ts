import { z } from 'zod'

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
  isValid: z.boolean(),
})

export const dataSnapshotSchema = z.object({
  posten: z.array(postSchema),
  messageTypes: z.array(meldungTypeSchema),
  meldungen: z.array(meldungSchema),
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
  isValid: z.boolean().optional(),
})

export type DataSnapshot = z.infer<typeof dataSnapshotSchema>
export type CreatePostenInput = z.infer<typeof createPostenSchema>
export type UpdatePostenInput = z.infer<typeof updatePostenSchema>
export type CreateMessageTypeInput = z.infer<typeof createMessageTypeSchema>
export type UpdateMessageTypeInput = z.infer<typeof updateMessageTypeSchema>
export type CreateMeldungInput = z.infer<typeof createMeldungSchema>
export type UpdateMeldungInput = z.infer<typeof updateMeldungSchema>