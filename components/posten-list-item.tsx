"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { formatSwissCoordinates } from "@/lib/coordinates";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Meldung, MeldungType, Posten } from "@/lib/store";

interface PostenListItemProps {
  posten: Posten;
  isExpanded: boolean;
  isSelected: boolean;
  typesWithMinimum: MeldungType[];
  meldungen: Meldung[];
  onToggleExpand: (postenId: number) => void;
  onToggleSelect: (postenId: number, isSelected: boolean) => void;
  onCreateMeldung: (postenId: number) => void;
  onEdit: (posten: Posten) => void;
  onDelete: (postenId: number) => void;
}

function countMeldungenLastHourByTyp(
  postenId: number,
  typeId: number,
  meldungen: Pick<Meldung, "postenId" | "typeId" | "createdAt" | "isValid">[]
) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return meldungen.filter(
    (meldung) =>
      meldung.isValid &&
      meldung.postenId === postenId &&
      meldung.typeId === typeId &&
      meldung.createdAt > oneHourAgo
  ).length;
}

function getPostenOverallStatus(
  postenId: number,
  typesWithMinimum: MeldungType[],
  meldungen: Meldung[]
): "ok" | "warning" | "none" {
  if (typesWithMinimum.length === 0) return "none";

  const allFulfilled = typesWithMinimum.every((type) => {
    const count = countMeldungenLastHourByTyp(postenId, type.id, meldungen);
    return count >= type.minPerHour;
  });

  return allFulfilled ? "ok" : "warning";
}

export function PostenListItem({
  posten,
  isExpanded,
  isSelected,
  typesWithMinimum,
  meldungen,
  onToggleExpand,
  onToggleSelect,
  onCreateMeldung,
  onEdit,
  onDelete,
}: PostenListItemProps) {
  const overallStatus = getPostenOverallStatus(
    posten.id,
    typesWithMinimum,
    meldungen
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(posten.id)}>
      <div
        className={`flex items-start gap-2 px-3 py-2 transition-colors hover:bg-secondary ${
          isSelected ? "bg-secondary" : ""
        }`}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-10 shrink-0 self-stretch rounded-none"
            aria-label={isExpanded ? "Zuklappen" : "Aufklappen"}
          >
            {isExpanded ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start rounded-none px-0 py-1 font-normal hover:bg-transparent"
          onClick={() => onToggleSelect(posten.id, isSelected)}
          aria-pressed={isSelected}
          aria-label={isSelected ? `${posten.name} abwaehlen` : `${posten.name} auswaehlen`}
        >
          <span className="flex min-w-0 flex-1 flex-col items-start text-left">
            <span className="wrap-anywhere whitespace-normal break-all text-xs leading-tight font-bold text-foreground">
              {posten.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatSwissCoordinates(posten.coordinates)}
            </span>
          </span>
        </Button>

        <div className="flex shrink-0 items-center gap-0.5">
          {overallStatus === "ok" && (
            <Button type="button" variant="ghost" size="icon-sm">
              <Check />
            </Button>
          )}
          {overallStatus === "warning" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
            >
              <AlertTriangle />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onCreateMeldung(posten.id)}
            aria-label={`Meldung fuer ${posten.name} erfassen`}
            title="Meldung erfassen"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onEdit(posten)}
            aria-label={`${posten.name} bearbeiten`}
            title="Bearbeiten"
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onDelete(posten.id)}
            className="hover:text-destructive"
            aria-label={`${posten.name} löschen`}
            title="Löschen"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <div className="border-t border-dashed border-border bg-secondary/50 px-3 py-2">
          {typesWithMinimum.length === 0 ? (
            <div className="px-5 py-1 text-xs text-muted-foreground">
              Keine Meldungstypen mit Minimum definiert
            </div>
          ) : (
            <div className="flex flex-col gap-1 pl-5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status letzte Stunde
              </div>
              {typesWithMinimum.map((type) => {
                const count = countMeldungenLastHourByTyp(
                  posten.id,
                  type.id,
                  meldungen
                );
                const fulfilled = count >= type.minPerHour;

                return (
                  <div
                    key={type.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-foreground">{type.name}</span>
                    <div
                      className={`flex items-center gap-1 border px-1.5 py-0.5 text-xs ${
                        fulfilled
                          ? "border-border text-foreground"
                          : "border-destructive/40 text-destructive"
                      }`}
                    >
                      {fulfilled ? (
                        <Check className="size-3" />
                      ) : (
                        <AlertTriangle className="size-3" />
                      )}
                      {count}/{type.minPerHour}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {posten.comment && (
            <div className="mt-2 border-t border-dashed border-border pl-5 pt-1.5 text-xs text-muted-foreground">
              {posten.comment}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}