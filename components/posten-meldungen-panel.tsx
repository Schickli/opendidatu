"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    meldungenTotalCount,
    hasMoreMeldungen,
    isLoadingMeldungen,
    isLoadingMoreMeldungen,
    loadMoreMeldungen,
    addMeldung,
    updateMeldung,
    deleteMeldung,
    lastHourCounts,
    messageTypes,
    selectedPostenId,
    setSelectedPostenId,
  } = useData();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [postenDialogOpen, setPostenDialogOpen] = useState(false);
  const [editingPostenId, setEditingPostenId] = useState<number | null>(null);
  const [postenForm, setPostenForm] = useState<PostenFormData>(emptyPostenForm);
  const [deletePostenConfirm, setDeletePostenConfirm] = useState<number | null>(
    null
  );

  const [meldungDialogOpen, setMeldungDialogOpen] = useState(false);
  const [editingMeldungId, setEditingMeldungId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedPostenForMeldung, setSelectedPostenForMeldung] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [meldungComment, setMeldungComment] = useState("");
  const [meldungIsValid, setMeldungIsValid] = useState(true);
  const [deleteMeldungConfirm, setDeleteMeldungConfirm] = useState<number | null>(
    null
  );

  const [expandedPosten, setExpandedPosten] = useState<Set<number>>(new Set());

  const typesWithMinimum = useMemo(
    () => messageTypes.filter((type) => type.minPerHour > 0),
    [messageTypes]
  );

  const lastHourCountLookup = useMemo(() => {
    return new Map(
      lastHourCounts.map((entry) => [`${entry.postenId}:${entry.typeId}`, entry.count])
    );
  }, [lastHourCounts]);

  function getLastHourCount(postenId: number, typeId: number) {
    return lastHourCountLookup.get(`${postenId}:${typeId}`) ?? 0;
  }

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

  const selectedType = messageTypes.find((type) => String(type.id) === selectedTypeId);
  const editingMeldung = useMemo(
    () => meldungen.find((meldung) => meldung.id === editingMeldungId) ?? null,
    [editingMeldungId, meldungen]
  );

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreRef.current;

    if (!root || !sentinel || !hasMoreMeldungen) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreMeldungen();
        }
      },
      {
        root,
        rootMargin: "0px 0px 240px 0px",
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreMeldungen, loadMoreMeldungen, meldungen.length, selectedPostenId]);

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

  async function handleSavePosten() {
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

    try {
      if (editingPostenId) {
        await updatePosten(editingPostenId, data);
      } else {
        await addPosten(data);
      }

      setPostenDialogOpen(false);
      setPostenForm(emptyPostenForm);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeletePosten(id: number) {
    try {
      await deletePosten(id);
      setDeletePostenConfirm(null);
      if (selectedPostenId === id) setSelectedPostenId(null);
    } catch (error) {
      console.error(error);
    }
  }

  function openCreateMeldung(postenId?: number) {
    setEditingMeldungId(null);
    setSelectedTypeId("");
    setSelectedPostenForMeldung(
      postenId !== undefined
        ? String(postenId)
        : selectedPostenId !== null
          ? String(selectedPostenId)
          : ""
    );
    setValues({});
    setMeldungComment("");
    setMeldungIsValid(true);
    setMeldungDialogOpen(true);
  }

  function openEditMeldung(meldung: Meldung) {
    setEditingMeldungId(meldung.id);
    setSelectedTypeId(String(meldung.typeId));
    setSelectedPostenForMeldung(String(meldung.postenId));
    setValues(
      Object.fromEntries(
        meldung.values.map((valueItem) => [String(valueItem.categoryId), valueItem.value])
      )
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

  async function handleSaveMeldung() {
    if (!selectedTypeId || !selectedPostenForMeldung || !selectedType) return;
    const allFilled = selectedType.categories.every(
      (category) => values[String(category.id)] && values[String(category.id)].length > 0
    );
    if (!allFilled) return;

    const meldungValues: MeldungValue[] = selectedType.categories.map(
      (category) => ({
        categoryId: category.id,
        categoryName: category.name,
        value: values[String(category.id)] || "",
      })
    );

    try {
      if (editingMeldungId) {
        await updateMeldung(editingMeldungId, {
          postenId: Number(selectedPostenForMeldung),
          values: meldungValues,
          comment: meldungComment.trim(),
          isValid: meldungIsValid,
        });
      } else {
        await addMeldung({
          postenId: Number(selectedPostenForMeldung),
          typeId: Number(selectedTypeId),
          values: meldungValues,
          comment: meldungComment.trim(),
          isValid: meldungIsValid,
        });
      }

      setMeldungDialogOpen(false);
      resetMeldungForm();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteMeldung(id: number) {
    try {
      await deleteMeldung(id);
      setDeleteMeldungConfirm(null);
    } catch (error) {
      console.error(error);
    }
  }

  function toggleExpand(postenId: number) {
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

  function getTypName(id: number) {
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

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {posten.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">
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
                  getLastHourCount={getLastHourCount}
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
          </div>
          {isLoadingMeldungen ? (
            <div className="p-3 text-xs text-muted-foreground">
              Meldungen werden geladen...
            </div>
          ) : meldungen.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">
              Keine Meldungen vorhanden
            </div>
          ) : (
            <div className="divide-y divide-border">
              {meldungen.map((n) => {
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
              <div ref={loadMoreRef} className="px-3 py-3 text-center text-xs text-muted-foreground">
                {isLoadingMoreMeldungen
                  ? "Weitere Meldungen werden geladen..."
                  : !hasMoreMeldungen && "Alle Meldungen geladen"}
              </div>
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
