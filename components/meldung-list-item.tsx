"use client";

import {
  Clock,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import type { Meldung } from "@/lib/store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MeldungListItemProps {
  meldung: Meldung;
  typName: string;
  postenName?: string;
  showPostenName: boolean;
  onEdit: () => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });
}

export function MeldungListItem({
  meldung,
  typName,
  postenName,
  showPostenName,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: MeldungListItemProps) {
  const hasUpdate = meldung.updatedAt !== meldung.createdAt;

  return (
    <div className={cn("flex items-start gap-2 px-3 py-1.5", className)}>
      <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 w-full justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <span className="min-w-0 flex-1 text-xs font-bold leading-tight text-foreground">
                {typName}
              </span>

              <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                <Clock className="size-3" />
                <span className="text-xs">{formatTime(meldung.createdAt)}</span>
              </span>
              {hasUpdate ? (
                <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                  <RefreshCcw className="size-3" />
                  <span className="text-xs">
                    {formatTime(meldung.updatedAt)}
                  </span>
                </span>
              ) : null}
              <span
                className={`m-auto size-2 ${
                  meldung.isValid ? "bg-emerald-500" : "bg-red-500"
                }`}
                aria-label={meldung.isValid ? "Gültig" : "Ungültig"}
                title={meldung.isValid ? "Gültig" : "Ungültig"}
              />
            </div>

            {showPostenName && postenName ? (
              <span className="wrap-anywhere min-w-0 text-xs leading-tight text-muted-foreground break-all">
                {postenName}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {meldung.values.map((valueItem) => (
              <span
                key={valueItem.categoryId}
                className="inline-flex border border-border text-xs"
              >
                <span className="bg-secondary px-1 py-px text-muted-foreground">
                  {valueItem.categoryName}
                </span>
                <span className="px-1 py-px font-bold">{valueItem.value}</span>
              </span>
            ))}
          </div>
          {meldung.comment && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {meldung.comment}
            </div>
          )}
        </div>
        {showActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Meldung Aktionen"
                className="ml-1 shrink-0"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(meldung.id)}
              >
                <Trash2 />
                Loeschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
