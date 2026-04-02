"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meldungstyp, Posten } from "@/lib/store";

interface MeldungDialogProps {
  open: boolean;
  posten: Posten[];
  meldungstypen: Meldungstyp[];
  selectedPostenForMeldung: string;
  selectedTypId: string;
  werte: Record<string, string>;
  meldungKommentar: string;
  onOpenChange: (open: boolean) => void;
  onPostenChange: (postenId: string) => void;
  onTypChange: (typId: string) => void;
  onWertChange: (kategorieId: string, value: string, maxZiffern: number) => void;
  onKommentarChange: (value: string) => void;
  onSave: () => void;
}

export function MeldungDialog({
  open,
  posten,
  meldungstypen,
  selectedPostenForMeldung,
  selectedTypId,
  werte,
  meldungKommentar,
  onOpenChange,
  onPostenChange,
  onTypChange,
  onWertChange,
  onKommentarChange,
  onSave,
}: MeldungDialogProps) {
  const selectedTyp = meldungstypen.find((t) => t.id === selectedTypId);
  const canSave =
    !!selectedPostenForMeldung &&
    !!selectedTypId &&
    !!selectedTyp &&
    selectedTyp.kategorien.every((k) => werte[k.id] && werte[k.id].length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100vh-2rem)] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            Neue Meldung
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Posten
            </label>
            <Select
              value={selectedPostenForMeldung}
              onValueChange={onPostenChange}
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
              Meldungstyp
            </label>
            <Select value={selectedTypId} onValueChange={onTypChange}>
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Typ waehlen..." />
              </SelectTrigger>
              <SelectContent>
                {meldungstypen.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTyp && (
            <div className="min-h-0">
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                Werte
              </label>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {selectedTyp.kategorien.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-2 border border-border p-2"
                  >
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">
                      {k.name}
                    </span>
                    <Input
                      value={werte[k.id] || ""}
                      onChange={(e) =>
                        onWertChange(k.id, e.target.value, k.maxZiffern)
                      }
                      placeholder={"0".repeat(k.maxZiffern)}
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
              value={meldungKommentar}
              onChange={(e) => onKommentarChange(e.target.value)}
              placeholder="Freitext..."
              className="min-h-15 resize-none text-base"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className="text-xs"
            disabled={!canSave}
          >
            Erfassen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
