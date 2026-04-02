import { NextResponse } from 'next/server'
import { readVectorTile } from '@/lib/server/map'

export const runtime = 'nodejs'

function isGzipBuffer(buffer: Buffer) {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params
  const zoom = Number.parseInt(z, 10)
  const column = Number.parseInt(x, 10)
  const row = Number.parseInt(y, 10)

  if ([zoom, column, row].some((value) => Number.isNaN(value))) {
    return NextResponse.json({ error: 'Ungueltige Tile-Koordinaten.' }, { status: 400 })
  }

  const tile = readVectorTile(zoom, column, row)

  if (!tile) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(tile, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Cache-Control': 'public, max-age=3600',
      ...(isGzipBuffer(tile) ? { 'Content-Encoding': 'gzip' } : {}),
    },
  })
}