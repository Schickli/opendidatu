"use client";

import { Clock, MessageSquare, Trash2 } from "lucide-react";
import type { Meldung } from "@/lib/store";
import { Button } from "./ui/button";

interface MeldungListItemProps {
  meldung: Meldung;
  typName: string;
  postenName?: string;
  showPostenName: boolean;
  onDelete: (id: string) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MeldungListItem({
  meldung,
  typName,
  postenName,
  showPostenName,
  onDelete,
}: MeldungListItemProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
      <div className="flex w-full justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="text-xs font-bold text-foreground">{typName}</span>
            {showPostenName && postenName && (
              <span className="text-xs text-muted-foreground">{postenName}</span>
            )}

            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <Clock className="size-3" />
              <span className="text-xs">{formatTime(meldung.erstelltAm)}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {meldung.werte.map((wert) => (
              <span
                key={wert.kategorieId}
                className="inline-flex border border-border text-xs"
              >
                <span className="bg-secondary px-1 py-px text-muted-foreground">
                  {wert.kategorieName}
                </span>
                <span className="px-1 py-px font-bold">{wert.wert}</span>
              </span>
            ))}
          </div>
          {meldung.kommentar && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {meldung.kommentar}
            </div>
          )}
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onDelete(meldung.id)}
          aria-label="Meldung loeschen"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
