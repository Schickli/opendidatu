"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import type { MeldungType, Posten } from "@/lib/store";

interface MeldungDialogProps {
  open: boolean;
  mode: "create" | "edit";
  posten: Posten[];
  messageTypes: MeldungType[];
  selectedPostenForMeldung: string;
  selectedTypeId: string;
  values: Record<string, string>;
  meldungComment: string;
  meldungIsValid: boolean;
  createdAt?: string;
  updatedAt?: string;
  onOpenChange: (open: boolean) => void;
  onPostenChange: (postenId: string) => void;
  onTypeChange: (typeId: string) => void;
  onValueChange: (categoryId: string, value: string, maxDigits: number) => void;
  onCommentChange: (value: string) => void;
  onValidityChange: (isValid: boolean) => void;
  onSave: () => void;
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";

  return new Date(iso).toLocaleString("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Zurich",
  });
}

export function MeldungDialog({
  open,
  mode,
  posten,
  messageTypes,
  selectedPostenForMeldung,
  selectedTypeId,
  values,
  meldungComment,
  meldungIsValid,
  createdAt,
  updatedAt,
  onOpenChange,
  onPostenChange,
  onTypeChange,
  onValueChange,
  onCommentChange,
  onValidityChange,
  onSave,
}: MeldungDialogProps) {
  const selectedType = messageTypes.find((type) => type.id === selectedTypeId);
  const canSave =
    !!selectedPostenForMeldung &&
    !!selectedTypeId &&
    !!selectedType &&
    selectedType.categories.every(
      (category) => values[category.id] && values[category.id].length > 0
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100vh-2rem)] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            {mode === "edit" ? "Meldung bearbeiten" : "Neue Meldung"}
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
            <Select value={selectedTypeId} onValueChange={onTypeChange} disabled={mode === "edit"}>
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Typ waehlen..." />
              </SelectTrigger>
              <SelectContent>
                {messageTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <div className="min-h-0">
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                Werte
              </label>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {selectedType.categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 border border-border p-2"
                  >
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">
                      {category.name}
                    </span>
                    <Input
                      value={values[category.id] || ""}
                      onChange={(e) =>
                        onValueChange(category.id, e.target.value, category.maxDigits)
                      }
                      placeholder={"0".repeat(category.maxDigits)}
                      className="text-base"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      max {category.maxDigits}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
              Gültigkeit
            </label>
            <RadioGroup
              value={meldungIsValid ? "valid" : "invalid"}
              onValueChange={(value) => onValidityChange(value === "valid")}
              className="grid grid-cols-2 gap-2"
            >
              <Label className="flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-wider">
                <RadioGroupItem value="valid" />
                Gültig
              </Label>
              <Label className="flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-wider">
                <RadioGroupItem value="invalid" />
                Ungültig
              </Label>
            </RadioGroup>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Kommentar
            </label>
            <Textarea
              value={meldungComment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Freitext..."
              className="min-h-15 resize-none text-base"
            />
          </div>

          {mode === "edit" ? (
            <div className="grid gap-2 border border-dashed border-border p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-wider">Erstellt</span>
                <span className="text-right text-foreground">{formatDateTime(createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-wider">Aktualisiert</span>
                <span className="text-right text-foreground">{formatDateTime(updatedAt)}</span>
              </div>
            </div>
          ) : null}
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
            {mode === "edit" ? "Speichern" : "Erfassen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
