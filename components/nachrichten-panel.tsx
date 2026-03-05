'use client'

import { useState, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, MessageSquare, Clock } from 'lucide-react'
import type { NachrichtKategorieWert } from '@/lib/store'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
  })
  const time = d.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${date} ${time}`
}

export function NachrichtenPanel() {
  const {
    nachrichten,
    addNachricht,
    deleteNachricht,
    posten,
    nachrichtentypen,
    selectedPostenId,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTypId, setSelectedTypId] = useState('')
  const [selectedPostenForMsg, setSelectedPostenForMsg] = useState('')
  const [werte, setWerte] = useState<Record<string, string>>({})
  const [kommentar, setKommentar] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Filter messages by selected posten
  const filteredNachrichten = useMemo(() => {
    if (!selectedPostenId) return nachrichten
    return nachrichten.filter((n) => n.postenId === selectedPostenId)
  }, [nachrichten, selectedPostenId])

  const selectedTyp = nachrichtentypen.find((t) => t.id === selectedTypId)

  function openCreate() {
    setSelectedTypId('')
    setSelectedPostenForMsg(selectedPostenId || '')
    setWerte({})
    setKommentar('')
    setDialogOpen(true)
  }

  function handleTypChange(typId: string) {
    setSelectedTypId(typId)
    setWerte({})
  }

  function handleWertChange(kategorieId: string, value: string, maxZiffern: number) {
    // Only allow digits and respect max length
    const cleaned = value.replace(/\D/g, '').slice(0, maxZiffern)
    setWerte((prev) => ({ ...prev, [kategorieId]: cleaned }))
  }

  function handleSave() {
    if (!selectedTypId || !selectedPostenForMsg) return
    if (!selectedTyp) return

    // Validate all categories have values
    const allFilled = selectedTyp.kategorien.every(
      (k) => werte[k.id] && werte[k.id].length > 0
    )
    if (!allFilled) return

    const nachrichtWerte: NachrichtKategorieWert[] = selectedTyp.kategorien.map(
      (k) => ({
        kategorieId: k.id,
        kategorieName: k.name,
        wert: werte[k.id] || '',
      })
    )

    addNachricht({
      postenId: selectedPostenForMsg,
      nachrichtentypId: selectedTypId,
      werte: nachrichtWerte,
      kommentar: kommentar.trim(),
    })

    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    deleteNachricht(id)
    setDeleteConfirm(null)
  }

  function getPostenName(id: string) {
    return posten.find((p) => p.id === id)?.name || 'Unbekannt'
  }

  function getTypName(id: string) {
    return nachrichtentypen.find((t) => t.id === id)?.name || 'Unbekannt'
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Nachrichten
          </span>
          {selectedPostenId && (
            <span className="border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {getPostenName(selectedPostenId)}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={openCreate}
          className="h-7 gap-1 font-mono text-xs"
          disabled={posten.length === 0 || nachrichtentypen.length === 0}
        >
          <Plus className="size-3" />
          Neu
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNachrichten.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-muted-foreground">
            {selectedPostenId
              ? 'Keine Nachrichten fuer diesen Posten'
              : 'Keine Nachrichten vorhanden'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNachrichten.map((n) => (
              <div key={n.id} className="group px-3 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-xs font-bold text-foreground">
                      {getTypName(n.nachrichtentypId)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      — {getPostenName(n.postenId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      <span className="font-mono text-xs">
                        {formatDateTime(n.erstelltAm)}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(n.id)}
                      className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label="Nachricht loeschen"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="ml-5 mt-1 flex flex-wrap gap-2">
                  {n.werte.map((w) => (
                    <div
                      key={w.kategorieId}
                      className="flex items-center border border-border"
                    >
                      <span className="bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {w.kategorieName}
                      </span>
                      <span className="px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">
                        {w.wert}
                      </span>
                    </div>
                  ))}
                </div>

                {n.kommentar && (
                  <div className="ml-5 mt-1 font-mono text-xs text-muted-foreground">
                    {n.kommentar}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="font-mono sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">
              Neue Nachricht
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Posten
              </label>
              <Select
                value={selectedPostenForMsg}
                onValueChange={setSelectedPostenForMsg}
              >
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue placeholder="Posten waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {posten.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="font-mono text-sm"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Nachrichtentyp
              </label>
              <Select value={selectedTypId} onValueChange={handleTypChange}>
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue placeholder="Typ waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {nachrichtentypen.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      className="font-mono text-sm"
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTyp && (
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                  Werte
                </label>
                <div className="flex flex-col gap-2">
                  {selectedTyp.kategorien.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center gap-2 border border-border p-2"
                    >
                      <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                        {k.name}
                      </span>
                      <Input
                        value={werte[k.id] || ''}
                        onChange={(e) =>
                          handleWertChange(k.id, e.target.value, k.maxZiffern)
                        }
                        placeholder={'0'.repeat(k.maxZiffern)}
                        className="font-mono text-sm"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        max {k.maxZiffern}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Kommentar
              </label>
              <Textarea
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
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
                !selectedPostenForMsg ||
                !selectedTypId ||
                !selectedTyp ||
                !selectedTyp.kategorien.every(
                  (k) => werte[k.id] && werte[k.id].length > 0
                )
              }
            >
              Erfassen
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
              Nachricht loeschen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Soll diese Nachricht wirklich geloescht werden?
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
