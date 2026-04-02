import { NextResponse } from 'next/server'
import { updateMeldungSchema } from '@/lib/contracts'
import { deleteMeldung, updateMeldung } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = updateMeldungSchema.parse(await request.json())
    const { id } = await params
    return NextResponse.json(updateMeldung(Number(id), payload))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldung konnte nicht aktualisiert werden.' },
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
    return NextResponse.json(deleteMeldung(Number(id)))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meldung konnte nicht geloescht werden.' },
      { status: 400 }
    )
  }
}