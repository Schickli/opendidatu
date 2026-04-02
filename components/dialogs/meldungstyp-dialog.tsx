"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface KategorieFormRow {
  id: string;
  name: string;
  maxZiffern: string;
}

interface MeldungstypDialogProps {
  open: boolean;
  editingId: string | null;
  typName: string;
  kategorien: KategorieFormRow[];
  minProStunde: string;
  onOpenChange: (open: boolean) => void;
  onTypNameChange: (value: string) => void;
  onAddKategorie: () => void;
  onRemoveKategorie: (id: string) => void;
  onUpdateKategorie: (
    id: string,
    field: "name" | "maxZiffern",
    value: string,
  ) => void;
  onMinProStundeChange: (value: string) => void;
  onSave: () => void;
}

export function MeldungstypDialog({
  open,
  editingId,
  typName,
  kategorien,
  minProStunde,
  onOpenChange,
  onTypNameChange,
  onAddKategorie,
  onRemoveKategorie,
  onUpdateKategorie,
  onMinProStundeChange,
  onSave,
}: MeldungstypDialogProps) {
  const canSave =
    typName.trim().length > 0 &&
    kategorien.some((kategorie) => kategorie.name.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono grid max-h-[calc(100vh-2rem)] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            {editingId ? "Meldungstyp bearbeiten" : "Neuer Meldungstyp"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Typbezeichnung
            </label>
            <Input
              value={typName}
              onChange={(e) => onTypNameChange(e.target.value)}
              placeholder="z.B. TER0, METEO..."
              className="font-mono text-sm"
            />
          </div>

          <div className="min-h-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Kategorien
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddKategorie}
                className="h-7 gap-1 font-mono text-xs"
              >
                <Plus className="size-3" />
                Kategorie
              </Button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {kategorien.map((kategorie, index) => (
                <div
                  key={kategorie.id}
                  className="flex items-center gap-2 border border-border p-2"
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                    {index + 1}.
                  </span>
                  <Input
                    value={kategorie.name}
                    onChange={(e) =>
                      onUpdateKategorie(kategorie.id, "name", e.target.value)
                    }
                    placeholder="Kategoriename"
                    className="flex-1 font-mono text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">
                      Max:
                    </label>
                    <Input
                      value={kategorie.maxZiffern}
                      onChange={(e) =>
                        onUpdateKategorie(
                          kategorie.id,
                          "maxZiffern",
                          e.target.value,
                        )
                      }
                      className="w-14 font-mono text-sm"
                      type="number"
                      min={1}
                      max={10}
                    />
                  </div>
                  {kategorien.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemoveKategorie(kategorie.id)}
                      className="hover:text-destructive"
                      aria-label="Kategorie entfernen"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Max = Maximale Anzahl Ziffern pro Kategorie
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Min. Meldungen / Stunde
            </label>
            <Input
              value={minProStunde}
              onChange={(e) =>
                onMinProStundeChange(e.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
              className="w-24 font-mono text-sm"
              type="number"
              min="0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              0 = keine Mindestanforderung
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono text-xs"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className="font-mono text-xs"
            disabled={!canSave}
          >
            {editingId ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
