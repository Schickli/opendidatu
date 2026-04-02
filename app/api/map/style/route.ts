import { NextResponse } from 'next/server'
import { getMapStyle } from '@/lib/server/map'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return NextResponse.json(await getMapStyle())
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kartenstil konnte nicht geladen werden.' },
      { status: 500 }
    )
  }
}