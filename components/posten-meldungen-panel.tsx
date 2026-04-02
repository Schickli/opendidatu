"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseSwissCoordinateInput,
  toSwissCoordinateInput,
} from "@/lib/coordinates";
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
import type { Meldung, MeldungValue, Posten } from "@/lib/store";

function postenToForm(p: Posten): PostenFormData {
  return {
    name: p.name,
    ...toSwissCoordinateInput(p.coordinates),
    comment: p.comment,
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
    updateMeldung,
    deleteMeldung,
    messageTypes,
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
  const [editingMeldungId, setEditingMeldungId] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedPostenForMeldung, setSelectedPostenForMeldung] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [meldungComment, setMeldungComment] = useState("");
  const [meldungIsValid, setMeldungIsValid] = useState(true);
  const [deleteMeldungConfirm, setDeleteMeldungConfirm] = useState<string | null>(
    null
  );

  const [expandedPosten, setExpandedPosten] = useState<Set<string>>(new Set());

  const typesWithMinimum = useMemo(
    () => messageTypes.filter((type) => type.minPerHour > 0),
    [messageTypes]
  );

  const filteredMeldungen = useMemo(() => {
    if (!selectedPostenId) return meldungen;
    return meldungen.filter((n) => n.postenId === selectedPostenId);
  }, [meldungen, selectedPostenId]);

  useEffect(() => {
    if (!selectedPostenId) return;

    setExpandedPosten((prev) => {
      if (prev.has(selectedPostenId)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(selectedPostenId);
      return next;
    });
  }, [selectedPostenId]);

  const selectedType = messageTypes.find((type) => type.id === selectedTypeId);
  const editingMeldung = useMemo(
    () => meldungen.find((meldung) => meldung.id === editingMeldungId) ?? null,
    [editingMeldungId, meldungen]
  );

  function resetMeldungForm() {
    setEditingMeldungId(null);
    setSelectedTypeId("");
    setSelectedPostenForMeldung("");
    setValues({});
    setMeldungComment("");
    setMeldungIsValid(true);
  }

  function handleMeldungDialogOpenChange(open: boolean) {
    setMeldungDialogOpen(open);
    if (!open) {
      resetMeldungForm();
    }
  }

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
    const coordinates = parseSwissCoordinateInput({
      easting: postenForm.easting,
      northing: postenForm.northing,
    });
    if (!postenForm.name.trim() || !coordinates) return;

    const data = {
      name: postenForm.name.trim(),
      coordinates,
      comment: postenForm.comment.trim(),
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
    setEditingMeldungId(null);
    setSelectedTypeId("");
    setSelectedPostenForMeldung(postenId || selectedPostenId || "");
    setValues({});
    setMeldungComment("");
    setMeldungIsValid(true);
    setMeldungDialogOpen(true);
  }

  function openEditMeldung(meldung: Meldung) {
    setEditingMeldungId(meldung.id);
    setSelectedTypeId(meldung.typeId);
    setSelectedPostenForMeldung(meldung.postenId);
    setValues(
      Object.fromEntries(meldung.values.map((valueItem) => [valueItem.categoryId, valueItem.value]))
    );
    setMeldungComment(meldung.comment);
    setMeldungIsValid(meldung.isValid);
    setMeldungDialogOpen(true);
  }

  function handleTypeChange(typeId: string) {
    if (editingMeldungId) return;
    setSelectedTypeId(typeId);
    setValues({});
  }

  function handleValueChange(
    categoryId: string,
    value: string,
    maxDigits: number
  ) {
    const cleaned = value.replace(/\D/g, "").slice(0, maxDigits);
    setValues((prev) => ({ ...prev, [categoryId]: cleaned }));
  }

  function handleSaveMeldung() {
    if (!selectedTypeId || !selectedPostenForMeldung || !selectedType) return;
    const allFilled = selectedType.categories.every(
      (category) => values[category.id] && values[category.id].length > 0
    );
    if (!allFilled) return;

    const meldungValues: MeldungValue[] = selectedType.categories.map(
      (category) => ({
        categoryId: category.id,
        categoryName: category.name,
        value: values[category.id] || "",
      })
    );

    if (editingMeldungId) {
      updateMeldung(editingMeldungId, {
        postenId: selectedPostenForMeldung,
        values: meldungValues,
        comment: meldungComment.trim(),
        isValid: meldungIsValid,
      });
    } else {
      addMeldung({
        postenId: selectedPostenForMeldung,
        typeId: selectedTypeId,
        values: meldungValues,
        comment: meldungComment.trim(),
        isValid: meldungIsValid,
      });
    }

    setMeldungDialogOpen(false);
    resetMeldungForm();
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
    return messageTypes.find((type) => type.id === id)?.name || "?";
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
                  typesWithMinimum={typesWithMinimum}
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
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-3 py-2">
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
                    typName={getTypName(n.typeId)}
                    postenName={posten.find((p) => p.id === n.postenId)?.name || "?"}
                    showPostenName={!selectedPostenId}
                    onEdit={() => openEditMeldung(n)}
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
        mode={editingMeldungId ? "edit" : "create"}
        posten={posten}
        messageTypes={messageTypes}
        selectedPostenForMeldung={selectedPostenForMeldung}
        selectedTypeId={selectedTypeId}
        values={values}
        meldungComment={meldungComment}
        meldungIsValid={meldungIsValid}
        createdAt={editingMeldung?.createdAt}
        updatedAt={editingMeldung?.updatedAt}
        onOpenChange={handleMeldungDialogOpenChange}
        onPostenChange={setSelectedPostenForMeldung}
        onTypeChange={handleTypeChange}
        onValueChange={handleValueChange}
        onCommentChange={setMeldungComment}
        onValidityChange={setMeldungIsValid}
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
