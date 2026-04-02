import { NextResponse } from 'next/server'
import { createMessageTypeSchema } from '@/lib/contracts'
import { createMessageType } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = createMessageTypeSchema.parse(await request.json())
    return NextResponse.json(createMessageType(payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldungstyp konnte nicht erstellt werden.' },
      { status: 400 }
    )
  }
}