import { NextResponse } from 'next/server'
import { createMeldungSchema } from '@/lib/contracts'
import { createMeldung, getMeldungenPage } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const postenIdParam = url.searchParams.get('postenId')
    const cursor = url.searchParams.get('cursor') ?? undefined
    const limit = limitParam ? Number(limitParam) : undefined
    const postenId = postenIdParam ? Number(postenIdParam) : undefined

    if (limitParam && !Number.isFinite(limit)) {
      throw new Error('Ungueltiges Limit fuer Meldungen.')
    }

    if (postenIdParam && !Number.isFinite(postenId)) {
      throw new Error('Ungueltige Posten-ID fuer Meldungen.')
    }

    return NextResponse.json(
      getMeldungenPage({
        limit,
        postenId,
        cursor,
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