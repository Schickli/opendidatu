import { NextResponse } from 'next/server'
import {
  createMeldungSchema,
  meldungValidityFilterSchema,
} from '@/lib/contracts'
import { createMeldung, getMeldungenPage } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const postenIdParam = url.searchParams.get('postenId')
    const typeIdParams = url.searchParams.getAll('typeId')
    const validityParam = url.searchParams.get('validity')
    const rangeStartAtParam = url.searchParams.get('rangeStartAt')
    const rangeEndAtParam = url.searchParams.get('rangeEndAt')
    const cursor = url.searchParams.get('cursor') ?? undefined
    const limit = limitParam ? Number(limitParam) : undefined
    const postenId = postenIdParam ? Number(postenIdParam) : undefined
    const typeIds = typeIdParams.map((value) => Number(value))
    const rangeStartAt = rangeStartAtParam ? Number(rangeStartAtParam) : null
    const rangeEndAt = rangeEndAtParam ? Number(rangeEndAtParam) : null

    if (limitParam && !Number.isFinite(limit)) {
      throw new Error('Ungültiges Limit fuer Meldungen.')
    }

    if (postenIdParam && !Number.isFinite(postenId)) {
      throw new Error('Ungültige Posten-ID fuer Meldungen.')
    }

    if (typeIds.some((typeId) => !Number.isFinite(typeId))) {
      throw new Error('Ungültige Meldungstyp-Filter fuer Meldungen.')
    }

    if (rangeStartAtParam && !Number.isFinite(rangeStartAt)) {
      throw new Error('Ungültiger Startzeitpunkt fuer Meldungen.')
    }

    if (rangeEndAtParam && !Number.isFinite(rangeEndAt)) {
      throw new Error('Ungültiger Endzeitpunkt fuer Meldungen.')
    }

    if (rangeStartAt !== null && rangeEndAt !== null && rangeStartAt > rangeEndAt) {
      throw new Error('Der Startzeitpunkt darf nicht nach dem Endzeitpunkt liegen.')
    }

    const validity = validityParam
      ? meldungValidityFilterSchema.parse(validityParam)
      : 'all'

    return NextResponse.json(
      getMeldungenPage({
        limit,
        postenId,
        cursor,
        filters: {
          typeIds,
          validity,
          rangeStartAt,
          rangeEndAt,
        },
      }),
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldungen konnten nicht geladen werden.' },
      { status: 400 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = createMeldungSchema.parse(await request.json())
    return NextResponse.json(createMeldung(payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldung konnte nicht erstellt werden.' },
      { status: 400 }
    )
  }
}