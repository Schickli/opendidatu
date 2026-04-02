'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  KategorieFormRow,
  MeldungstypDialog,
} from '@/components/dialogs/meldungstyp-dialog'
import { MeldungstypDeleteDialog } from '@/components/dialogs/meldungstyp-delete-dialog'
import { MeldungstypListItem } from '@/components/meldungstyp-list-item'
import type { MeldungstypKategorie } from '@/lib/store'
import { generateId } from '@/lib/store'

export function MeldungstypPanel() {
  const {
    meldungstypen,
    addMeldungstyp,
    updateMeldungstyp,
    deleteMeldungstyp,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [typName, setTypName] = useState('')
  const [kategorien, setKategorien] = useState<KategorieFormRow[]>([])
  const [minProStunde, setMinProStunde] = useState('0')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setTypName('')
    setKategorien([{ id: generateId(), name: '', maxZiffern: '1' }])
    setMinProStunde('0')
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    const typ = meldungstypen.find((t) => t.id === id)
    if (!typ) return
    setEditingId(id)
    setTypName(typ.name)
    setKategorien(
      typ.kategorien.map((k) => ({
        id: k.id,
        name: k.name,
        maxZiffern: String(k.maxZiffern),
      }))
    )
    setMinProStunde(String(typ.minProStunde))
    setDialogOpen(true)
  }

  function addKategorie() {
    setKategorien((prev) => [
      ...prev,
      { id: generateId(), name: '', maxZiffern: '1' },
    ])
  }

  function removeKategorie(id: string) {
    setKategorien((prev) => prev.filter((k) => k.id !== id))
  }

  function updateKategorie(
    id: string,
    field: 'name' | 'maxZiffern',
    value: string
  ) {
    setKategorien((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    )
  }

  function handleSave() {
    if (!typName.trim()) return
    const validKategorien = kategorien.filter((k) => k.name.trim())
    if (validKategorien.length === 0) return

    const parsedKategorien: MeldungstypKategorie[] = validKategorien.map(
      (k) => ({
        id: k.id,
        name: k.name.trim(),
        maxZiffern: Math.max(1, parseInt(k.maxZiffern) || 1),
      })
    )

    const parsedMin = parseInt(minProStunde, 10)

    if (editingId) {
      updateMeldungstyp(editingId, {
        name: typName.trim(),
        kategorien: parsedKategorien,
        minProStunde: isNaN(parsedMin) || parsedMin < 0 ? 0 : parsedMin,
      })
    } else {
      addMeldungstyp({
        name: typName.trim(),
        kategorien: parsedKategorien,
        minProStunde: isNaN(parsedMin) || parsedMin < 0 ? 0 : parsedMin,
      })
    }

    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    deleteMeldungstyp(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Meldungstypen
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={openCreate}
          className="h-7 gap-1 font-mono text-xs"
        >
          <Plus className="size-3" />
          Neu
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {meldungstypen.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-muted-foreground">
            Keine Meldungstypen definiert
          </div>
        ) : (
          <div className="divide-y divide-border">
            {meldungstypen.map((typ) => (
              <MeldungstypListItem
                key={typ.id}
                typ={typ}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        )}
      </div>

      <MeldungstypDialog
        open={dialogOpen}
        editingId={editingId}
        typName={typName}
        kategorien={kategorien}
        minProStunde={minProStunde}
        onOpenChange={setDialogOpen}
        onTypNameChange={setTypName}
        onAddKategorie={addKategorie}
        onRemoveKategorie={removeKategorie}
        onUpdateKategorie={updateKategorie}
        onMinProStundeChange={setMinProStunde}
        onSave={handleSave}
      />

      <MeldungstypDeleteDialog
        open={!!deleteConfirm}
        meldungstypName={meldungstypen.find((t) => t.id === deleteConfirm)?.name}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null)
          }
        }}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  )
}
