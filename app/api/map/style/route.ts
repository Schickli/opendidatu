import { NextResponse } from 'next/server'
import { getMapStyle } from '@/lib/server/map'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin
    return NextResponse.json(await getMapStyle(origin))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kartenstil konnte nicht geladen werden.' },
      { status: 500 }
    )
  }
}