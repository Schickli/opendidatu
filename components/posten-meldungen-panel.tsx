"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  parseSwissCoordinateInput,
  toSwissCoordinateInput,
} from "@/lib/coordinates";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { MeldungenFilters } from "@/lib/contracts";
import {
  MELDUNG_VALIDITY_FILTER_LABELS,
  type MeldungValidity,
  type MeldungValidityFilter,
} from "@/lib/meldung-validity";
import type { Meldung, MeldungValue, Posten } from "@/lib/store";

function toDateTimeLocalValue(timestamp: number | null) {
  if (timestamp === null) {
    return "";
  }

  const date = new Date(timestamp);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(timestamp - timezoneOffsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

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
    hasMoreMeldungen,
    isLoadingMeldungen,
    isLoadingMoreMeldungen,
    loadMoreMeldungen,
    addMeldung,
    updateMeldung,
    deleteMeldung,
    lastHourCounts,
    messageTypes,
    meldungenFilters,
    setMeldungenFilters,
    selectedPostenId,
    setSelectedPostenId,
  } = useData();

  const meldungenScrollRef = useRef<HTMLDivElement | null>(null);

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
  const [meldungValidity, setMeldungValidity] = useState<MeldungValidity>("review");
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

  const virtualizedRowCount = meldungen.length + 1;
  const meldungenVirtualizer = useVirtualizer({
    count: virtualizedRowCount,
    getScrollElement: () => meldungenScrollRef.current,
    estimateSize: (index) => (index >= meldungen.length ? 52 : 112),
    overscan: 8,
    getItemKey: (index) => {
      if (index >= meldungen.length) {
        return "meldungen-footer";
      }

      return meldungen[index]?.id ?? `meldung-${index}`;
    },
  });
  const virtualRows = meldungenVirtualizer.getVirtualItems();
  const topSpacerHeight = virtualRows[0]?.start ?? 0;
  const bottomSpacerHeight = virtualRows.length > 0
    ? meldungenVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0;

  useEffect(() => {
    if (!hasMoreMeldungen || isLoadingMoreMeldungen || isLoadingMeldungen) {
      return;
    }

    const lastVirtualRow = virtualRows.at(-1);

    if (!lastVirtualRow) {
      return;
    }

    if (lastVirtualRow.index >= meldungen.length) {
      void loadMoreMeldungen();
    }
  }, [
    hasMoreMeldungen,
    isLoadingMeldungen,
    isLoadingMoreMeldungen,
    loadMoreMeldungen,
    meldungen.length,
    virtualRows,
  ]);

  function resetMeldungForm() {
    setEditingMeldungId(null);
    setSelectedTypeId("");
    setSelectedPostenForMeldung("");
    setValues({});
    setMeldungComment("");
    setMeldungValidity("review");
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
    setMeldungValidity("review");
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
    setMeldungValidity(meldung.isValid);
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
          isValid: meldungValidity,
        });
      } else {
        await addMeldung({
          postenId: Number(selectedPostenForMeldung),
          typeId: Number(selectedTypeId),
          values: meldungValues,
          comment: meldungComment.trim(),
          isValid: meldungValidity,
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

  function toggleTypeFilter(typeId: number, checked: boolean) {
    setMeldungenFilters((current) => ({
      ...current,
      typeIds: checked
        ? [...current.typeIds, typeId].sort((left, right) => left - right)
        : current.typeIds.filter((currentTypeId) => currentTypeId !== typeId),
    }));
  }

  function setCustomRangeBoundary(
    boundary: "rangeStartAt" | "rangeEndAt",
    value: string
  ) {
    setMeldungenFilters((current) => ({
      ...current,
      [boundary]: fromDateTimeLocalValue(value),
    }));
  }

  function clearCustomRange() {
    setMeldungenFilters((current) => ({
      ...current,
      rangeStartAt: null,
      rangeEndAt: null,
    }));
  }

  function setValidityFilter(validity: MeldungenFilters["validity"]) {
    setMeldungenFilters((current) => ({
      ...current,
      validity,
    }));
  }

  function resetMeldungenFilters() {
    setMeldungenFilters({
      typeIds: [],
      validity: "all",
      rangeStartAt: null,
      rangeEndAt: null,
    });
  }

  const hasCustomRange =
    meldungenFilters.rangeStartAt !== null || meldungenFilters.rangeEndAt !== null;

  const activeFilterCount =
    meldungenFilters.typeIds.length +
    (hasCustomRange ? 1 : 0) +
    (meldungenFilters.validity === "all" ? 0 : 1);

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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="max-h-[45%] shrink-0 overflow-y-auto">
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
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-t-2 border-border">
          <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {selectedPostenId
                  ? `Meldungen — ${
                      posten.find((p) => p.id === selectedPostenId)?.name || "?"
                    }`
                  : `Alle Meldungen`}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Meldungen filtern"
                    className="relative shrink-0"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {activeFilterCount > 0 ? (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 pb-1">
                    <div className="mb-2 mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Zeitraum</span>
                      {hasCustomRange ? (
                        <button
                          type="button"
                          onClick={clearCustomRange}
                          className="hover:text-foreground"
                        >
                          Leeren
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Von</span>
                        <Input
                          type="datetime-local"
                          value={toDateTimeLocalValue(meldungenFilters.rangeStartAt)}
                          onChange={(event) =>
                            setCustomRangeBoundary("rangeStartAt", event.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Bis</span>
                        <Input
                          type="datetime-local"
                          value={toDateTimeLocalValue(meldungenFilters.rangeEndAt)}
                          onChange={(event) =>
                            setCustomRangeBoundary("rangeEndAt", event.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Gültigekeit</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={meldungenFilters.validity}
                    onValueChange={(value) =>
                      setValidityFilter(value as MeldungValidityFilter)
                    }
                  >
                    {(
                      Object.entries(MELDUNG_VALIDITY_FILTER_LABELS) as Array<[
                        MeldungValidityFilter,
                        string,
                      ]>
                    ).map(([value, label]) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Meldungstypen</DropdownMenuLabel>
                  {messageTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.id}
                      checked={meldungenFilters.typeIds.includes(type.id)}
                      onCheckedChange={(checked) =>
                        toggleTypeFilter(type.id, checked === true)
                      }
                    >
                      {type.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Button
                    variant="outline"
                    onClick={resetMeldungenFilters}
                    className="w-full"
                  >
                    Filter zuruecksetzen
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
            <div ref={meldungenScrollRef} className="min-h-0 flex-1 overflow-y-auto">
              <div
                className="w-full"
                style={{
                  paddingTop: `${topSpacerHeight}px`,
                  paddingBottom: `${bottomSpacerHeight}px`,
                }}
              >
                {virtualRows.map((virtualRow) => {
                  const isFooterRow = virtualRow.index >= meldungen.length;

                  if (isFooterRow) {
                    return (
                      <div
                        key="meldungen-footer"
                        ref={(node) => {
                          if (node) {
                            meldungenVirtualizer.measureElement(node);
                          }
                        }}
                        className="w-full px-3 py-3 text-center text-xs text-muted-foreground"
                      >
                        {isLoadingMoreMeldungen && "Weitere Meldungen werden geladen..."}
                      </div>
                    );
                  }

                  const meldung = meldungen[virtualRow.index];

                  if (!meldung) {
                    return null;
                  }

                  return (
                    <div
                      key={meldung.id}
                      ref={(node) => {
                        if (node) {
                          meldungenVirtualizer.measureElement(node);
                        }
                      }}
                      className="w-full border-b border-border bg-background"
                    >
                      <MeldungListItem
                        meldung={meldung}
                        typName={getTypName(meldung.typeId)}
                        postenName={posten.find((p) => p.id === meldung.postenId)?.name || "?"}
                        showPostenName={!selectedPostenId}
                        onEdit={() => openEditMeldung(meldung)}
                        onDelete={setDeleteMeldungConfirm}
                      />
                    </div>
                  );
                })}
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
        meldungValidity={meldungValidity}
        createdAt={editingMeldung?.createdAt}
        updatedAt={editingMeldung?.updatedAt}
        onOpenChange={handleMeldungDialogOpenChange}
        onPostenChange={setSelectedPostenForMeldung}
        onTypeChange={handleTypeChange}
        onValueChange={handleValueChange}
        onCommentChange={setMeldungComment}
        onValidityChange={setMeldungValidity}
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
