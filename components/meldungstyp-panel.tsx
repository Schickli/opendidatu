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
import type { MeldungTypeCategory } from '@/lib/store'
import { generateId } from '@/lib/store'

export function MeldungstypPanel() {
  const {
    messageTypes,
    addMessageType,
    updateMessageType,
    deleteMessageType,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [typName, setTypName] = useState('')
  const [categories, setCategories] = useState<KategorieFormRow[]>([])
  const [minPerHour, setMinPerHour] = useState('0')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setTypName('')
    setCategories([{ id: generateId(), name: '', maxDigits: '1' }])
    setMinPerHour('0')
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    const type = messageTypes.find((entry) => entry.id === id)
    if (!type) return
    setEditingId(id)
    setTypName(type.name)
    setCategories(
      type.categories.map((category) => ({
        id: category.id,
        name: category.name,
        maxDigits: String(category.maxDigits),
      }))
    )
    setMinPerHour(String(type.minPerHour))
    setDialogOpen(true)
  }

  function addKategorie() {
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name: '', maxDigits: '1' },
    ])
  }

  function removeKategorie(id: string) {
    setCategories((prev) => prev.filter((category) => category.id !== id))
  }

  function updateKategorie(
    id: string,
    field: 'name' | 'maxDigits',
    value: string
  ) {
    setCategories((prev) =>
      prev.map((category) => (category.id === id ? { ...category, [field]: value } : category))
    )
  }

  function handleSave() {
    if (!typName.trim()) return
    const validCategories = categories.filter((category) => category.name.trim())
    if (validCategories.length === 0) return

    const parsedCategories: MeldungTypeCategory[] = validCategories.map(
      (category) => ({
        id: category.id,
        name: category.name.trim(),
        maxDigits: Math.max(1, parseInt(category.maxDigits) || 1),
      })
    )

    const parsedMinPerHour = parseInt(minPerHour, 10)

    if (editingId) {
      updateMessageType(editingId, {
        name: typName.trim(),
        categories: parsedCategories,
        minPerHour:
          isNaN(parsedMinPerHour) || parsedMinPerHour < 0 ? 0 : parsedMinPerHour,
      })
    } else {
      addMessageType({
        name: typName.trim(),
        categories: parsedCategories,
        minPerHour:
          isNaN(parsedMinPerHour) || parsedMinPerHour < 0 ? 0 : parsedMinPerHour,
      })
    }

    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    deleteMessageType(id)
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
        {messageTypes.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-muted-foreground">
            Keine Meldungstypen definiert
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messageTypes.map((type) => (
              <MeldungstypListItem
                key={type.id}
                type={type}
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
        categories={categories}
        minPerHour={minPerHour}
        onOpenChange={setDialogOpen}
        onTypNameChange={setTypName}
        onAddKategorie={addKategorie}
        onRemoveKategorie={removeKategorie}
        onUpdateKategorie={updateKategorie}
        onMinPerHourChange={setMinPerHour}
        onSave={handleSave}
      />

      <MeldungstypDeleteDialog
        open={!!deleteConfirm}
        meldungstypName={messageTypes.find((type) => type.id === deleteConfirm)?.name}
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
