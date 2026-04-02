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

import { Button } from "@/components/ui/button";
import type { Meldung, Meldungstyp, Posten } from "@/lib/store";

interface PostenListItemProps {
  posten: Posten;
  isExpanded: boolean;
  isSelected: boolean;
  typenMitMinimum: Meldungstyp[];
  meldungen: Meldung[];
  onToggleExpand: (postenId: string) => void;
  onToggleSelect: (postenId: string, isSelected: boolean) => void;
  onCreateMeldung: (postenId: string) => void;
  onEdit: (posten: Posten) => void;
  onDelete: (postenId: string) => void;
}

function countMeldungenLastHourByTyp(
  postenId: string,
  meldungstypId: string,
  meldungen: Pick<Meldung, "postenId" | "meldungstypId" | "erstelltAm">[]
) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return meldungen.filter(
    (meldung) =>
      meldung.postenId === postenId &&
      meldung.meldungstypId === meldungstypId &&
      new Date(meldung.erstelltAm).getTime() > oneHourAgo
  ).length;
}

function getPostenOverallStatus(
  postenId: string,
  typenMitMinimum: Meldungstyp[],
  meldungen: Meldung[]
): "ok" | "warning" | "none" {
  if (typenMitMinimum.length === 0) return "none";

  const allFulfilled = typenMitMinimum.every((typ) => {
    const count = countMeldungenLastHourByTyp(postenId, typ.id, meldungen);
    return count >= typ.minProStunde;
  });

  return allFulfilled ? "ok" : "warning";
}

export function PostenListItem({
  posten,
  isExpanded,
  isSelected,
  typenMitMinimum,
  meldungen,
  onToggleExpand,
  onToggleSelect,
  onCreateMeldung,
  onEdit,
  onDelete,
}: PostenListItemProps) {
  const overallStatus = getPostenOverallStatus(
    posten.id,
    typenMitMinimum,
    meldungen
  );

  return (
    <div>
      <div
        className={`flex items-start gap-2 px-3 py-2 transition-colors hover:bg-secondary ${
          isSelected ? "bg-secondary" : ""
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start gap-0 rounded-none px-0 py-0 font-normal hover:bg-transparent"
          onClick={() => {
            onToggleExpand(posten.id);
            onToggleSelect(posten.id, isSelected);
          }}
          aria-label={isExpanded ? "Zuklappen" : "Aufklappen"}
        >
          <span className="flex min-h-10 shrink-0 items-center self-stretch px-1.5 text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start py-1 text-left">
            <span className="text-xs font-bold text-foreground">{posten.name}</span>
            <span className="text-xs text-muted-foreground">
              {posten.coordinates.lat.toFixed(4)}, {" "}
              {posten.coordinates.lng.toFixed(4)}
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
            aria-label={`${posten.name} loeschen`}
            title="Loeschen"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-dashed border-border bg-secondary/50 px-3 py-2">
          {typenMitMinimum.length === 0 ? (
            <div className="px-5 py-1 text-xs text-muted-foreground">
              Keine Meldungstypen mit Minimum definiert
            </div>
          ) : (
            <div className="flex flex-col gap-1 pl-5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status letzte Stunde
              </div>
              {typenMitMinimum.map((typ) => {
                const count = countMeldungenLastHourByTyp(
                  posten.id,
                  typ.id,
                  meldungen
                );
                const fulfilled = count >= typ.minProStunde;

                return (
                  <div
                    key={typ.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-foreground">{typ.name}</span>
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
                      {count}/{typ.minProStunde}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {posten.kommentar && (
            <div className="mt-2 border-t border-dashed border-border pl-5 pt-1.5 text-xs text-muted-foreground">
              {posten.kommentar}
            </div>
          )}
        </div>
      )}
    </div>
  );
}