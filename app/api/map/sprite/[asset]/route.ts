import { NextResponse } from 'next/server'
import {
  getSpriteAssetContentType,
  isSupportedSpriteAsset,
  readSpriteAsset,
} from '@/lib/server/map'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    asset: string
  }>
}

export async function GET(_: Request, context: RouteContext) {
  const { asset } = await context.params

  if (!isSupportedSpriteAsset(asset)) {
    return NextResponse.json({ error: 'Sprite asset not found.' }, { status: 404 })
  }

  try {
    const body = await readSpriteAsset(asset)

    return new NextResponse(body, {
      headers: {
        'Cache-Control': 'public, max-age=3600, immutable',
        'Content-Type': getSpriteAssetContentType(asset),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sprite asset not found.' }, { status: 404 })
  }
}