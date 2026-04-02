import {
  bootstrapSnapshotSchema,
  createMeldungSchema,
  createMessageTypeSchema,
  createPostenSchema,
  meldungenPageSchema,
  updateMeldungSchema,
  updateMessageTypeSchema,
  updatePostenSchema,
  type CreateMeldungInput,
  type CreateMessageTypeInput,
  type CreatePostenInput,
  type UpdateMeldungInput,
  type UpdateMessageTypeInput,
  type UpdatePostenInput,
} from '@/lib/contracts'

async function requestJson<TPayload>(
  input: RequestInfo | URL,
  schema: { parse: (value: unknown) => TPayload },
  init?: RequestInit,
): Promise<TPayload> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      (errorPayload && typeof errorPayload.error === 'string' && errorPayload.error) ||
      'Die Anfrage konnte nicht verarbeitet werden.'
    throw new Error(message)
  }

  const payload = await response.json()
  return schema.parse(payload)
}

export function fetchBootstrapSnapshot() {
  return requestJson('/api/bootstrap', bootstrapSnapshotSchema, { cache: 'no-store' })
}

export function fetchMeldungenPage(options?: {
  cursor?: string
  limit?: number
  postenId?: number
}) {
  const params = new URLSearchParams()

  if (options?.cursor) {
    params.set('cursor', options.cursor)
  }

  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit))
  }

  if (options?.postenId !== undefined) {
    params.set('postenId', String(options.postenId))
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return requestJson(`/api/meldungen${suffix}`, meldungenPageSchema, { cache: 'no-store' })
}

export function createPosten(data: CreatePostenInput) {
  return requestJson('/api/posten', bootstrapSnapshotSchema, {
    method: 'POST',
    body: JSON.stringify(createPostenSchema.parse(data)),
  })
}

export function updatePosten(id: number, data: UpdatePostenInput) {
  return requestJson(`/api/posten/${id}`, bootstrapSnapshotSchema, {
    method: 'PATCH',
    body: JSON.stringify(updatePostenSchema.parse(data)),
  })
}

export function deletePosten(id: number) {
  return requestJson(`/api/posten/${id}`, bootstrapSnapshotSchema, {
    method: 'DELETE',
  })
}

export function createMessageType(data: CreateMessageTypeInput) {
  return requestJson('/api/message-types', bootstrapSnapshotSchema, {
    method: 'POST',
    body: JSON.stringify(createMessageTypeSchema.parse(data)),
  })
}

export function updateMessageType(id: number, data: UpdateMessageTypeInput) {
  return requestJson(`/api/message-types/${id}`, bootstrapSnapshotSchema, {
    method: 'PATCH',
    body: JSON.stringify(updateMessageTypeSchema.parse(data)),
  })
}

export function deleteMessageType(id: number) {
  return requestJson(`/api/message-types/${id}`, bootstrapSnapshotSchema, {
    method: 'DELETE',
  })
}

export function createMeldung(data: CreateMeldungInput) {
  return requestJson('/api/meldungen', bootstrapSnapshotSchema, {
    method: 'POST',
    body: JSON.stringify(createMeldungSchema.parse(data)),
  })
}

export function updateMeldung(id: number, data: UpdateMeldungInput) {
  return requestJson(`/api/meldungen/${id}`, bootstrapSnapshotSchema, {
    method: 'PATCH',
    body: JSON.stringify(updateMeldungSchema.parse(data)),
  })
}

export function deleteMeldung(id: number) {
  return requestJson(`/api/meldungen/${id}`, bootstrapSnapshotSchema, {
    method: 'DELETE',
  })
}