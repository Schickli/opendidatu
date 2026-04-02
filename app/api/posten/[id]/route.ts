import { NextResponse } from 'next/server'
import { updatePostenSchema } from '@/lib/contracts'
import { deletePosten, updatePosten } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = updatePostenSchema.parse(await request.json())
    const { id } = await params
    return NextResponse.json(updatePosten(Number(id), payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Posten konnte nicht aktualisiert werden.' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return NextResponse.json(deletePosten(Number(id)))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Posten konnte nicht geloescht werden.' },
      { status: 400 }
    )
  }
}