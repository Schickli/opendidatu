import { NextResponse } from 'next/server'
import { deleteImportedOverlay, readImportedOverlay, saveImportedOverlay } from '@/lib/server/imported-overlay'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return NextResponse.json({ overlay: await readImportedOverlay() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overlay konnte nicht geladen werden.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw new Error('Es wurde keine Datei hochgeladen.')
    }

    const overlay = await saveImportedOverlay(file.name, await file.text())
    return NextResponse.json({ overlay })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overlay konnte nicht gespeichert werden.' },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  try {
    await deleteImportedOverlay()
    return NextResponse.json({ overlay: null })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overlay konnte nicht geloescht werden.' },
      { status: 500 }
    )
  }
}