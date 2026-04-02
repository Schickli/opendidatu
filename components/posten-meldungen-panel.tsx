"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import {
  PostenDialog,
  emptyPostenForm,
  type PostenFormData,
} from "@/components/dialogs/posten-dialog";
import { PostenDeleteDialog } from "@/components/dialogs/posten-delete-dialog";
import { MeldungDialog } from "@/components/dialogs/meldung-dialog";
import { MeldungDeleteDialog } from "@/components/dialogs/meldung-delete-dialog";
import { MeldungListItem } from "@/components/meldung-list-item";
import { PostenListItem } from "@/components/posten-list-item";
import { Plus } from "lucide-react";
import type { MeldungKategorieWert, Posten } from "@/lib/store";

function postenToForm(p: Posten): PostenFormData {
  return {
    name: p.name,
    lat: String(p.coordinates.lat),
    lng: String(p.coordinates.lng),
    kommentar: p.kommentar,
  };
}

export function PostenMeldungenPanel() {
  const {
    posten,
    addPosten,
    updatePosten,
    deletePosten,
    meldungen,
    addMeldung,
    deleteMeldung,
    meldungstypen,
    selectedPostenId,
    setSelectedPostenId,
  } = useData();

  const [postenDialogOpen, setPostenDialogOpen] = useState(false);
  const [editingPostenId, setEditingPostenId] = useState<string | null>(null);
  const [postenForm, setPostenForm] = useState<PostenFormData>(emptyPostenForm);
  const [deletePostenConfirm, setDeletePostenConfirm] = useState<string | null>(
    null
  );

  const [meldungDialogOpen, setMeldungDialogOpen] = useState(false);
  const [selectedTypId, setSelectedTypId] = useState("");
  const [selectedPostenForMeldung, setSelectedPostenForMeldung] = useState("");
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [meldungKommentar, setMeldungKommentar] = useState("");
  const [deleteMeldungConfirm, setDeleteMeldungConfirm] = useState<string | null>(
    null
  );

  const [expandedPosten, setExpandedPosten] = useState<Set<string>>(new Set());

  const typenMitMinimum = useMemo(
    () => meldungstypen.filter((t) => t.minProStunde > 0),
    [meldungstypen]
  );

  const filteredMeldungen = useMemo(() => {
    if (!selectedPostenId) return meldungen;
    return meldungen.filter((n) => n.postenId === selectedPostenId);
  }, [meldungen, selectedPostenId]);

  const selectedTyp = meldungstypen.find((t) => t.id === selectedTypId);

  function openCreatePosten() {
    setEditingPostenId(null);
    setPostenForm(emptyPostenForm);
    setPostenDialogOpen(true);
  }

  function openEditPosten(p: Posten) {
    setEditingPostenId(p.id);
    setPostenForm(postenToForm(p));
    setPostenDialogOpen(true);
  }

  function handleSavePosten() {
    const lat = parseFloat(postenForm.lat);
    const lng = parseFloat(postenForm.lng);
    if (!postenForm.name.trim() || isNaN(lat) || isNaN(lng)) return;

    const data = {
      name: postenForm.name.trim(),
      coordinates: { lat, lng },
      kommentar: postenForm.kommentar.trim(),
    };

    if (editingPostenId) {
      updatePosten(editingPostenId, data);
    } else {
      addPosten(data);
    }
    setPostenDialogOpen(false);
    setPostenForm(emptyPostenForm);
  }

  function handleDeletePosten(id: string) {
    deletePosten(id);
    setDeletePostenConfirm(null);
    if (selectedPostenId === id) setSelectedPostenId(null);
  }

  function openCreateMeldung(postenId?: string) {
    setSelectedTypId("");
    setSelectedPostenForMeldung(postenId || selectedPostenId || "");
    setWerte({});
    setMeldungKommentar("");
    setMeldungDialogOpen(true);
  }

  function handleTypChange(typId: string) {
    setSelectedTypId(typId);
    setWerte({});
  }

  function handleWertChange(
    kategorieId: string,
    value: string,
    maxZiffern: number
  ) {
    const cleaned = value.replace(/\D/g, "").slice(0, maxZiffern);
    setWerte((prev) => ({ ...prev, [kategorieId]: cleaned }));
  }

  function handleSaveMeldung() {
    if (!selectedTypId || !selectedPostenForMeldung || !selectedTyp) return;
    const allFilled = selectedTyp.kategorien.every(
      (k) => werte[k.id] && werte[k.id].length > 0
    );
    if (!allFilled) return;

    const meldungWerte: MeldungKategorieWert[] = selectedTyp.kategorien.map(
      (k) => ({
        kategorieId: k.id,
        kategorieName: k.name,
        wert: werte[k.id] || "",
      })
    );

    addMeldung({
      postenId: selectedPostenForMeldung,
      meldungstypId: selectedTypId,
      werte: meldungWerte,
      kommentar: meldungKommentar.trim(),
    });

    setMeldungDialogOpen(false);
  }

  function handleDeleteMeldung(id: string) {
    deleteMeldung(id);
    setDeleteMeldungConfirm(null);
  }

  function toggleExpand(postenId: string) {
    setExpandedPosten((prev) => {
      const next = new Set(prev);
      if (next.has(postenId)) {
        next.delete(postenId);
      } else {
        next.add(postenId);
      }
      return next;
    });
  }

  function getTypName(id: string) {
    return meldungstypen.find((t) => t.id === id)?.name || "?";
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          Posten
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={openCreatePosten}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="size-3" />
            Posten
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {posten.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Keine Posten vorhanden. Erstellen Sie einen neuen Posten.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posten.map((p) => {
              const isExpanded = expandedPosten.has(p.id);
              const isSelected = selectedPostenId === p.id;

              return (
                <PostenListItem
                  key={p.id}
                  posten={p}
                  isExpanded={isExpanded}
                  isSelected={isSelected}
                  typenMitMinimum={typenMitMinimum}
                  meldungen={meldungen}
                  onToggleExpand={toggleExpand}
                  onToggleSelect={(postenId, selected) =>
                    setSelectedPostenId(selected ? null : postenId)
                  }
                  onCreateMeldung={openCreateMeldung}
                  onEdit={openEditPosten}
                  onDelete={setDeletePostenConfirm}
                />
              );
            })}
          </div>
        )}

        <div className="border-t-2 border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {selectedPostenId
                ? `Meldungen — ${
                    posten.find((p) => p.id === selectedPostenId)?.name || "?"
                  }`
                : `Alle Meldungen`}
            </span>
            <span className="text-xs text-muted-foreground">
              {filteredMeldungen.length}
            </span>
          </div>
          {filteredMeldungen.length === 0 ? (
            <div className="px-3 pb-3 text-xs text-muted-foreground">
              Keine Meldungen vorhanden
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMeldungen.map((n) => {
                return (
                  <MeldungListItem
                    key={n.id}
                    meldung={n}
                    typName={getTypName(n.meldungstypId)}
                    postenName={posten.find((p) => p.id === n.postenId)?.name || "?"}
                    showPostenName={!selectedPostenId}
                    onDelete={setDeleteMeldungConfirm}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PostenDialog
        open={postenDialogOpen}
        onOpenChange={setPostenDialogOpen}
        editingPostenId={editingPostenId}
        postenForm={postenForm}
        setPostenForm={setPostenForm}
        onSave={handleSavePosten}
      />

      <PostenDeleteDialog
        open={!!deletePostenConfirm}
        postenName={posten.find((p) => p.id === deletePostenConfirm)?.name}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePostenConfirm(null);
          }
        }}
        onConfirm={() =>
          deletePostenConfirm && handleDeletePosten(deletePostenConfirm)
        }
      />

      <MeldungDialog
        open={meldungDialogOpen}
        posten={posten}
        meldungstypen={meldungstypen}
        selectedPostenForMeldung={selectedPostenForMeldung}
        selectedTypId={selectedTypId}
        werte={werte}
        meldungKommentar={meldungKommentar}
        onOpenChange={setMeldungDialogOpen}
        onPostenChange={setSelectedPostenForMeldung}
        onTypChange={handleTypChange}
        onWertChange={handleWertChange}
        onKommentarChange={setMeldungKommentar}
        onSave={handleSaveMeldung}
      />

      <MeldungDeleteDialog
        open={!!deleteMeldungConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteMeldungConfirm(null);
          }
        }}
        onConfirm={() =>
          deleteMeldungConfirm && handleDeleteMeldung(deleteMeldungConfirm)
        }
      />
    </div>
  );
}
