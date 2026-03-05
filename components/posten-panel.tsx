'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import type { Posten } from '@/lib/store'

interface PostenFormData {
  name: string
  lat: string
  lng: string
  kommentar: string
}

const emptyForm: PostenFormData = { name: '', lat: '', lng: '', kommentar: '' }

function postenToForm(p: Posten): PostenFormData {
  return {
    name: p.name,
    lat: String(p.coordinates.lat),
    lng: String(p.coordinates.lng),
    kommentar: p.kommentar,
  }
}

export function PostenPanel() {
  const {
    posten,
    addPosten,
    updatePosten,
    deletePosten,
    nachrichten,
    selectedPostenId,
    setSelectedPostenId,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PostenFormData>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(p: Posten) {
    setEditingId(p.id)
    setForm(postenToForm(p))
    setDialogOpen(true)
  }

  function handleSave() {
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (!form.name.trim() || isNaN(lat) || isNaN(lng)) return

    if (editingId) {
      updatePosten(editingId, {
        name: form.name.trim(),
        coordinates: { lat, lng },
        kommentar: form.kommentar.trim(),
      })
    } else {
      addPosten({
        name: form.name.trim(),
        coordinates: { lat, lng },
        kommentar: form.kommentar.trim(),
      })
    }
    setDialogOpen(false)
    setForm(emptyForm)
  }

  function handleDelete(id: string) {
    deletePosten(id)
    setDeleteConfirm(null)
    if (selectedPostenId === id) setSelectedPostenId(null)
  }

  function getMessageCount(postenId: string) {
    return nachrichten.filter((n) => n.postenId === postenId).length
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Posten
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
        {posten.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-muted-foreground">
            Keine Posten vorhanden
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posten.map((p) => (
              <div
                key={p.id}
                className={`group flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors hover:bg-secondary ${
                  selectedPostenId === p.id ? 'bg-secondary' : ''
                }`}
                onClick={() => setSelectedPostenId(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedPostenId(p.id)
                }}
              >
                <MapPin className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {getMessageCount(p.id)}N
                    </span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {p.coordinates.lat.toFixed(4)}, {p.coordinates.lng.toFixed(4)}
                  </div>
                  {p.kommentar && (
                    <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {p.kommentar}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(p)
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`${p.name} bearbeiten`}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(p.id)
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`${p.name} loeschen`}
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
        <DialogContent className="font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              {editingId ? 'Posten bearbeiten' : 'Neuer Posten'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Posten Name"
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Breitengrad (Lat)
                </label>
                <Input
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="46.9500"
                  className="font-mono text-sm"
                  type="number"
                  step="0.0001"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Laengengrad (Lng)
                </label>
                <Input
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="7.4500"
                  className="font-mono text-sm"
                  type="number"
                  step="0.0001"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Kommentar
              </label>
              <Textarea
                value={form.kommentar}
                onChange={(e) =>
                  setForm({ ...form, kommentar: e.target.value })
                }
                placeholder="Freitext..."
                className="min-h-[60px] resize-none font-mono text-sm"
              />
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
                !form.name.trim() ||
                isNaN(parseFloat(form.lat)) ||
                isNaN(parseFloat(form.lng))
              }
            >
              {editingId ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Posten loeschen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Soll der Posten{' '}
            <strong>
              {posten.find((p) => p.id === deleteConfirm)?.name}
            </strong>{' '}
            wirklich geloescht werden? Alle zugehoerigen Nachrichten bleiben
            bestehen.
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
