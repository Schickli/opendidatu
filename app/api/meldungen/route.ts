import { NextResponse } from 'next/server'
import { createMeldungSchema } from '@/lib/contracts'
import { createMeldung } from '@/lib/server/repository'

export const runtime = 'nodejs'

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