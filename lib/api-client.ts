import {
  createMeldungSchema,
  createMessageTypeSchema,
  createPostenSchema,
  dataSnapshotSchema,
  updateMeldungSchema,
  updateMessageTypeSchema,
  updatePostenSchema,
  type CreateMeldungInput,
  type CreateMessageTypeInput,
  type CreatePostenInput,
  type DataSnapshot,
  type UpdateMeldungInput,
  type UpdateMessageTypeInput,
  type UpdatePostenInput,
} from '@/lib/contracts'

async function requestSnapshot(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<DataSnapshot> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
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
  return dataSnapshotSchema.parse(payload)
}

export function fetchBootstrapSnapshot() {
  return requestSnapshot('/api/bootstrap', { cache: 'no-store' })
}

export function createPosten(data: CreatePostenInput) {
  return requestSnapshot('/api/posten', {
    method: 'POST',
    body: JSON.stringify(createPostenSchema.parse(data)),
  })
}

export function updatePosten(id: number, data: UpdatePostenInput) {
  return requestSnapshot(`/api/posten/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updatePostenSchema.parse(data)),
  })
}

export function deletePosten(id: number) {
  return requestSnapshot(`/api/posten/${id}`, {
    method: 'DELETE',
  })
}

export function createMessageType(data: CreateMessageTypeInput) {
  return requestSnapshot('/api/message-types', {
    method: 'POST',
    body: JSON.stringify(createMessageTypeSchema.parse(data)),
  })
}

export function updateMessageType(id: number, data: UpdateMessageTypeInput) {
  return requestSnapshot(`/api/message-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateMessageTypeSchema.parse(data)),
  })
}

export function deleteMessageType(id: number) {
  return requestSnapshot(`/api/message-types/${id}`, {
    method: 'DELETE',
  })
}

export function createMeldung(data: CreateMeldungInput) {
  return requestSnapshot('/api/meldungen', {
    method: 'POST',
    body: JSON.stringify(createMeldungSchema.parse(data)),
  })
}

export function updateMeldung(id: number, data: UpdateMeldungInput) {
  return requestSnapshot(`/api/meldungen/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateMeldungSchema.parse(data)),
  })
}

export function deleteMeldung(id: number) {
  return requestSnapshot(`/api/meldungen/${id}`, {
    method: 'DELETE',
  })
}