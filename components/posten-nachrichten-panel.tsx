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
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react'
import type { Posten, NachrichtKategorieWert } from '@/lib/store'

// --- Helpers ---

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

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMessagesLastHour(
  postenId: string,
  nachrichten: { postenId: string; erstelltAm: string }[]
) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return nachrichten.filter(
    (n) => n.postenId === postenId && new Date(n.erstelltAm).getTime() > oneHourAgo
  ).length
}

// --- Posten Form Data ---

interface PostenFormData {
  name: string
  lat: string
  lng: string
  kommentar: string
  minNachrichtenProStunde: string
}

const emptyPostenForm: PostenFormData = {
  name: '',
  lat: '',
  lng: '',
  kommentar: '',
  minNachrichtenProStunde: '1',
}

function postenToForm(p: Posten): PostenFormData {
  return {
    name: p.name,
    lat: String(p.coordinates.lat),
    lng: String(p.coordinates.lng),
    kommentar: p.kommentar,
    minNachrichtenProStunde: String(p.minNachrichtenProStunde),
  }
}

// --- Status Badge ---

function StatusBadge({
  current,
  required,
}: {
  current: number
  required: number
}) {
  const fulfilled = current >= required
  return (
    <div
      className={`flex items-center gap-1 border px-1.5 py-0.5 font-mono text-xs ${
        fulfilled
          ? 'border-border text-foreground'
          : 'border-destructive/30 bg-destructive/5 text-destructive'
      }`}
    >
      {fulfilled ? (
        <Check className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      )}
      <span>
        {current}/{required} N/h
      </span>
    </div>
  )
}

// --- Main Component ---

export function PostenNachrichtenPanel() {
  const {
    posten,
    addPosten,
    updatePosten,
    deletePosten,
    nachrichten,
    addNachricht,
    deleteNachricht,
    nachrichtentypen,
    selectedPostenId,
    setSelectedPostenId,
  } = useData()

  // Posten dialog state
  const [postenDialogOpen, setPostenDialogOpen] = useState(false)
  const [editingPostenId, setEditingPostenId] = useState<string | null>(null)
  const [postenForm, setPostenForm] = useState<PostenFormData>(emptyPostenForm)
  const [deletePostenConfirm, setDeletePostenConfirm] = useState<string | null>(null)

  // Nachrichten dialog state
  const [nachrichtDialogOpen, setNachrichtDialogOpen] = useState(false)
  const [selectedTypId, setSelectedTypId] = useState('')
  const [selectedPostenForMsg, setSelectedPostenForMsg] = useState('')
  const [werte, setWerte] = useState<Record<string, string>>({})
  const [msgKommentar, setMsgKommentar] = useState('')
  const [deleteNachrichtConfirm, setDeleteNachrichtConfirm] = useState<string | null>(null)

  // Expanded posten in the list (to show messages inline)
  const [expandedPosten, setExpandedPosten] = useState<Set<string>>(new Set())

  // Filtered messages
  const filteredNachrichten = useMemo(() => {
    if (!selectedPostenId) return nachrichten
    return nachrichten.filter((n) => n.postenId === selectedPostenId)
  }, [nachrichten, selectedPostenId])

  // Display posten: if filtered, only show the selected one; otherwise all
  const displayPosten = useMemo(() => {
    if (selectedPostenId) return posten.filter((p) => p.id === selectedPostenId)
    return posten
  }, [posten, selectedPostenId])

  const selectedTyp = nachrichtentypen.find((t) => t.id === selectedTypId)

  // --- Posten CRUD ---

  function openCreatePosten() {
    setEditingPostenId(null)
    setPostenForm(emptyPostenForm)
    setPostenDialogOpen(true)
  }

  function openEditPosten(p: Posten) {
    setEditingPostenId(p.id)
    setPostenForm(postenToForm(p))
    setPostenDialogOpen(true)
  }

  function handleSavePosten() {
    const lat = parseFloat(postenForm.lat)
    const lng = parseFloat(postenForm.lng)
    const minMsg = parseInt(postenForm.minNachrichtenProStunde, 10)
    if (!postenForm.name.trim() || isNaN(lat) || isNaN(lng)) return

    const data = {
      name: postenForm.name.trim(),
      coordinates: { lat, lng },
      kommentar: postenForm.kommentar.trim(),
      minNachrichtenProStunde: isNaN(minMsg) || minMsg < 0 ? 0 : minMsg,
    }

    if (editingPostenId) {
      updatePosten(editingPostenId, data)
    } else {
      addPosten(data)
    }
    setPostenDialogOpen(false)
    setPostenForm(emptyPostenForm)
  }

  function handleDeletePosten(id: string) {
    deletePosten(id)
    setDeletePostenConfirm(null)
    if (selectedPostenId === id) setSelectedPostenId(null)
  }

  // --- Nachrichten CRUD ---

  function openCreateNachricht(postenId?: string) {
    setSelectedTypId('')
    setSelectedPostenForMsg(postenId || selectedPostenId || '')
    setWerte({})
    setMsgKommentar('')
    setNachrichtDialogOpen(true)
  }

  function handleTypChange(typId: string) {
    setSelectedTypId(typId)
    setWerte({})
  }

  function handleWertChange(kategorieId: string, value: string, maxZiffern: number) {
    const cleaned = value.replace(/\D/g, '').slice(0, maxZiffern)
    setWerte((prev) => ({ ...prev, [kategorieId]: cleaned }))
  }

  function handleSaveNachricht() {
    if (!selectedTypId || !selectedPostenForMsg || !selectedTyp) return
    const allFilled = selectedTyp.kategorien.every(
      (k) => werte[k.id] && werte[k.id].length > 0
    )
    if (!allFilled) return

    const nachrichtWerte: NachrichtKategorieWert[] = selectedTyp.kategorien.map((k) => ({
      kategorieId: k.id,
      kategorieName: k.name,
      wert: werte[k.id] || '',
    }))

    addNachricht({
      postenId: selectedPostenForMsg,
      nachrichtentypId: selectedTypId,
      werte: nachrichtWerte,
      kommentar: msgKommentar.trim(),
    })

    setNachrichtDialogOpen(false)
  }

  function handleDeleteNachricht(id: string) {
    deleteNachricht(id)
    setDeleteNachrichtConfirm(null)
  }

  // --- Toggle expand ---

  function toggleExpand(postenId: string) {
    setExpandedPosten((prev) => {
      const next = new Set(prev)
      if (next.has(postenId)) {
        next.delete(postenId)
      } else {
        next.add(postenId)
      }
      return next
    })
  }

  // --- Helpers ---

  function getTypName(id: string) {
    return nachrichtentypen.find((t) => t.id === id)?.name || '?'
  }

  function getPostenNachrichten(postenId: string) {
    return nachrichten.filter((n) => n.postenId === postenId)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Posten / Nachrichten
          </span>
          {selectedPostenId && (
            <button
              onClick={() => setSelectedPostenId(null)}
              className="flex items-center gap-1 border border-border bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <X className="size-3" />
              Filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={openCreatePosten}
            className="h-7 gap-1 text-xs"
          >
            <MapPin className="size-3" />
            Posten
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreateNachricht()}
            className="h-7 gap-1 text-xs"
            disabled={posten.length === 0 || nachrichtentypen.length === 0}
          >
            <MessageSquare className="size-3" />
            Nachricht
          </Button>
        </div>
      </div>

      {/* Posten list with nested messages */}
      <div className="flex-1 overflow-y-auto">
        {displayPosten.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {selectedPostenId
              ? 'Ausgewaehlter Posten nicht gefunden'
              : 'Keine Posten vorhanden. Erstellen Sie einen neuen Posten.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayPosten.map((p) => {
              const postenMessages = getPostenNachrichten(p.id)
              const messagesLastHour = getMessagesLastHour(p.id, nachrichten)
              const isExpanded =
                expandedPosten.has(p.id) || selectedPostenId === p.id

              return (
                <div key={p.id}>
                  {/* Posten row */}
                  <div
                    className={`group flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors hover:bg-secondary ${
                      selectedPostenId === p.id ? 'bg-secondary' : ''
                    }`}
                    onClick={() => toggleExpand(p.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        toggleExpand(p.id)
                    }}
                  >
                    {/* Expand chevron */}
                    <div className="mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="size-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3 text-muted-foreground" />
                      )}
                    </div>

                    {/* Posten info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {p.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.coordinates.lat.toFixed(4)},{' '}
                            {p.coordinates.lng.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            current={messagesLastHour}
                            required={p.minNachrichtenProStunde}
                          />
                          <span className="text-xs text-muted-foreground">
                            {postenMessages.length} total
                          </span>
                        </div>
                      </div>
                      {p.kommentar && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.kommentar}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openCreateNachricht(p.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label={`Nachricht fuer ${p.name} erfassen`}
                        title="Nachricht erfassen"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPostenId(
                            selectedPostenId === p.id ? null : p.id
                          )
                        }}
                        className={`p-1 ${
                          selectedPostenId === p.id
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label={`Auf Karte zeigen`}
                        title="Auf Karte filtern"
                      >
                        <MapPin className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditPosten(p)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label={`${p.name} bearbeiten`}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletePostenConfirm(p.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label={`${p.name} loeschen`}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: messages for this posten */}
                  {isExpanded && (
                    <div className="border-t border-dashed border-border bg-secondary/50">
                      {postenMessages.length === 0 ? (
                        <div className="px-8 py-2 text-xs text-muted-foreground">
                          Keine Nachrichten vorhanden
                        </div>
                      ) : (
                        <div className="divide-y divide-dashed divide-border">
                          {postenMessages.map((n) => (
                            <div
                              key={n.id}
                              className="group/msg flex items-start gap-2 px-8 py-1.5"
                            >
                              <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">
                                    {getTypName(n.nachrichtentypId)}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {n.werte.map((w) => (
                                      <span
                                        key={w.kategorieId}
                                        className="inline-flex border border-border text-xs"
                                      >
                                        <span className="bg-secondary px-1 py-px text-muted-foreground">
                                          {w.kategorieName}
                                        </span>
                                        <span className="px-1 py-px font-bold">
                                          {w.wert}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                                    <Clock className="size-3" />
                                    <span className="text-xs">
                                      {formatTime(n.erstelltAm)}
                                    </span>
                                  </div>
                                </div>
                                {n.kommentar && (
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {n.kommentar}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setDeleteNachrichtConfirm(n.id)}
                                className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/msg:opacity-100"
                                aria-label="Nachricht loeschen"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Unassigned messages section (when no filter) */}
        {!selectedPostenId && (
          <div className="border-t border-border">
            <div className="px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Alle Nachrichten ({filteredNachrichten.length})
              </span>
            </div>
            <div className="divide-y divide-border">
              {filteredNachrichten.map((n) => {
                const postenName =
                  posten.find((p) => p.id === n.postenId)?.name || '?'
                return (
                  <div
                    key={n.id}
                    className="group/msg flex items-start gap-2 px-3 py-1.5"
                  >
                    <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {getTypName(n.nachrichtentypId)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {postenName}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {n.werte.map((w) => (
                            <span
                              key={w.kategorieId}
                              className="inline-flex border border-border text-xs"
                            >
                              <span className="bg-secondary px-1 py-px text-muted-foreground">
                                {w.kategorieName}
                              </span>
                              <span className="px-1 py-px font-bold">
                                {w.wert}
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                          <Clock className="size-3" />
                          <span className="text-xs">
                            {formatDateTime(n.erstelltAm)}
                          </span>
                        </div>
                      </div>
                      {n.kommentar && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {n.kommentar}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteNachrichtConfirm(n.id)}
                      className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/msg:opacity-100"
                      aria-label="Nachricht loeschen"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Posten Create/Edit Dialog */}
      <Dialog open={postenDialogOpen} onOpenChange={setPostenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              {editingPostenId ? 'Posten bearbeiten' : 'Neuer Posten'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                value={postenForm.name}
                onChange={(e) =>
                  setPostenForm({ ...postenForm, name: e.target.value })
                }
                placeholder="Posten Name"
                className="text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Breitengrad (Lat)
                </label>
                <Input
                  value={postenForm.lat}
                  onChange={(e) =>
                    setPostenForm({ ...postenForm, lat: e.target.value })
                  }
                  placeholder="46.9500"
                  className="text-base"
                  type="number"
                  step="0.0001"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Laengengrad (Lng)
                </label>
                <Input
                  value={postenForm.lng}
                  onChange={(e) =>
                    setPostenForm({ ...postenForm, lng: e.target.value })
                  }
                  placeholder="7.4500"
                  className="text-base"
                  type="number"
                  step="0.0001"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Min. Nachrichten / Stunde
              </label>
              <Input
                value={postenForm.minNachrichtenProStunde}
                onChange={(e) =>
                  setPostenForm({
                    ...postenForm,
                    minNachrichtenProStunde: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="1"
                className="text-base"
                type="number"
                min="0"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mindestanzahl Nachrichten pro Stunde fuer Statusueberwachung
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Kommentar
              </label>
              <Textarea
                value={postenForm.kommentar}
                onChange={(e) =>
                  setPostenForm({ ...postenForm, kommentar: e.target.value })
                }
                placeholder="Freitext..."
                className="min-h-[60px] resize-none text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPostenDialogOpen(false)}
              className="text-xs"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSavePosten}
              className="text-xs"
              disabled={
                !postenForm.name.trim() ||
                isNaN(parseFloat(postenForm.lat)) ||
                isNaN(parseFloat(postenForm.lng))
              }
            >
              {editingPostenId ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posten Delete Confirm */}
      <Dialog
        open={!!deletePostenConfirm}
        onOpenChange={() => setDeletePostenConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Posten loeschen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Soll der Posten{' '}
            <strong>
              {posten.find((p) => p.id === deletePostenConfirm)?.name}
            </strong>{' '}
            wirklich geloescht werden? Alle zugehoerigen Nachrichten bleiben
            bestehen.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePostenConfirm(null)}
              className="text-xs"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletePostenConfirm && handleDeletePosten(deletePostenConfirm)
              }
              className="text-xs"
            >
              Loeschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nachricht Create Dialog */}
      <Dialog open={nachrichtDialogOpen} onOpenChange={setNachrichtDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
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
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Posten waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {posten.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
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
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Typ waehlen..." />
                </SelectTrigger>
                <SelectContent>
                  {nachrichtentypen.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
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
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">
                        {k.name}
                      </span>
                      <Input
                        value={werte[k.id] || ''}
                        onChange={(e) =>
                          handleWertChange(k.id, e.target.value, k.maxZiffern)
                        }
                        placeholder={'0'.repeat(k.maxZiffern)}
                        className="text-base"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">
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
                value={msgKommentar}
                onChange={(e) => setMsgKommentar(e.target.value)}
                placeholder="Freitext..."
                className="min-h-[60px] resize-none text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNachrichtDialogOpen(false)}
              className="text-xs"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveNachricht}
              className="text-xs"
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

      {/* Nachricht Delete Confirm */}
      <Dialog
        open={!!deleteNachrichtConfirm}
        onOpenChange={() => setDeleteNachrichtConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Nachricht loeschen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Soll diese Nachricht wirklich geloescht werden?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteNachrichtConfirm(null)}
              className="text-xs"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteNachrichtConfirm &&
                handleDeleteNachricht(deleteNachrichtConfirm)
              }
              className="text-xs"
            >
              Loeschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
