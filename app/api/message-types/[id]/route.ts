import { NextResponse } from 'next/server'
import { updateMessageTypeSchema } from '@/lib/contracts'
import { deleteMessageType, updateMessageType } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = updateMessageTypeSchema.parse(await request.json())
    const { id } = await params
    return NextResponse.json(updateMessageType(Number(id), payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldungstyp konnte nicht aktualisiert werden.' },
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
    return NextResponse.json(deleteMessageType(Number(id)))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meldungstyp konnte nicht geloescht werden.'
    const status = message.includes('verweisen') ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}