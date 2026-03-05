'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Settings2, X } from 'lucide-react'
import type { NachrichtentypKategorie } from '@/lib/store'
import { generateId } from '@/lib/store'

interface KategorieFormRow {
  id: string
  name: string
  maxZiffern: string
}

export function NachrichtentypPanel() {
  const {
    nachrichtentypen,
    addNachrichtentyp,
    updateNachrichtentyp,
    deleteNachrichtentyp,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [typName, setTypName] = useState('')
  const [kategorien, setKategorien] = useState<KategorieFormRow[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setTypName('')
    setKategorien([{ id: generateId(), name: '', maxZiffern: '1' }])
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    const typ = nachrichtentypen.find((t) => t.id === id)
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

    const parsedKategorien: NachrichtentypKategorie[] = validKategorien.map(
      (k) => ({
        id: k.id,
        name: k.name.trim(),
        maxZiffern: Math.max(1, parseInt(k.maxZiffern) || 1),
      })
    )

    if (editingId) {
      updateNachrichtentyp(editingId, {
        name: typName.trim(),
        kategorien: parsedKategorien,
      })
    } else {
      addNachrichtentyp({
        name: typName.trim(),
        kategorien: parsedKategorien,
      })
    }

    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    deleteNachrichtentyp(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Nachrichtentypen
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
        {nachrichtentypen.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-muted-foreground">
            Keine Nachrichtentypen definiert
          </div>
        ) : (
          <div className="divide-y divide-border">
            {nachrichtentypen.map((typ) => (
              <div
                key={typ.id}
                className="group flex items-start gap-2 px-3 py-2"
              >
                <Settings2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {typ.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {typ.kategorien.length} Kat.
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {typ.kategorien.map((k) => (
                      <span
                        key={k.id}
                        className="inline-block border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                      >
                        {k.name}
                        <span className="ml-1 text-foreground">
                          [{k.maxZiffern}]
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(typ.id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`${typ.name} bearbeiten`}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(typ.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`${typ.name} loeschen`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="font-mono sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              {editingId ? 'Nachrichtentyp bearbeiten' : 'Neuer Nachrichtentyp'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Typbezeichnung
              </label>
              <Input
                value={typName}
                onChange={(e) => setTypName(e.target.value)}
                placeholder="z.B. TER0, METEO..."
                className="font-mono text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Kategorien
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addKategorie}
                  className="h-6 gap-1 font-mono text-xs"
                >
                  <Plus className="size-3" />
                  Kategorie
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {kategorien.map((k, idx) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-2 border border-border p-2"
                  >
                    <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <Input
                      value={k.name}
                      onChange={(e) =>
                        updateKategorie(k.id, 'name', e.target.value)
                      }
                      placeholder="Kategoriename"
                      className="flex-1 font-mono text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground">
                        Max:
                      </label>
                      <Input
                        value={k.maxZiffern}
                        onChange={(e) =>
                          updateKategorie(k.id, 'maxZiffern', e.target.value)
                        }
                        className="w-14 font-mono text-sm"
                        type="number"
                        min={1}
                        max={10}
                      />
                    </div>
                    {kategorien.length > 1 && (
                      <button
                        onClick={() => removeKategorie(k.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Kategorie entfernen"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Max = Maximale Anzahl Ziffern pro Kategorie
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="font-mono text-xs"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              className="font-mono text-xs"
              disabled={
                !typName.trim() ||
                kategorien.filter((k) => k.name.trim()).length === 0
              }
            >
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Nachrichtentyp loeschen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Soll der Nachrichtentyp{' '}
            <strong>
              {nachrichtentypen.find((t) => t.id === deleteConfirm)?.name}
            </strong>{' '}
            wirklich geloescht werden?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="font-mono text-xs"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="font-mono text-xs"
            >
              Loeschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
