import { NextResponse } from 'next/server'
import { createPostenSchema } from '@/lib/contracts'
import { createPosten } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = createPostenSchema.parse(await request.json())
    return NextResponse.json(createPosten(payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Posten konnte nicht erstellt werden.' },
      { status: 400 }
    )
  }
}