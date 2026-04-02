import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsData } from '@/lib/server/repository'

export const runtime = 'nodejs'

export function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const rangeStartAtRaw = params.get('rangeStartAt')
    const rangeEndAtRaw = params.get('rangeEndAt')

    const rangeStartAt = rangeStartAtRaw ? Number(rangeStartAtRaw) : undefined
    const rangeEndAt = rangeEndAtRaw ? Number(rangeEndAtRaw) : undefined

    if (rangeStartAt !== undefined && !Number.isFinite(rangeStartAt)) {
      return NextResponse.json({ error: 'Ungültiger Startzeitpunkt.' }, { status: 400 })
    }

    if (rangeEndAt !== undefined && !Number.isFinite(rangeEndAt)) {
      return NextResponse.json({ error: 'Ungültiger Endzeitpunkt.' }, { status: 400 })
    }

    const data = getAnalyticsData({ rangeStartAt, rangeEndAt })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
