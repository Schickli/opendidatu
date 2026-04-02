"use client";

import type { Dispatch, SetStateAction } from "react";
import { validateSwissCoordinateInput } from "@/lib/coordinates";
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

export interface PostenFormData {
  name: string;
  easting: string;
  northing: string;
  comment: string;
}

export const emptyPostenForm: PostenFormData = {
  name: "",
  easting: "",
  northing: "",
  comment: "",
};

interface PostenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPostenId: string | null;
  postenForm: PostenFormData;
  setPostenForm: Dispatch<SetStateAction<PostenFormData>>;
  onSave: () => void;
}

export function PostenDialog({
  open,
  onOpenChange,
  editingPostenId,
  postenForm,
  setPostenForm,
  onSave,
}: PostenDialogProps) {
  const coordinateErrors = validateSwissCoordinateInput({
    easting: postenForm.easting,
    northing: postenForm.northing,
  });

  const eastingError = postenForm.easting ? coordinateErrors.easting : undefined;
  const northingError = postenForm.northing
    ? coordinateErrors.northing
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            {editingPostenId ? "Posten bearbeiten" : "Neuer Posten"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <Input
              value={postenForm.name}
              onChange={(e) =>
                setPostenForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Posten Name"
              className="text-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Ostwert (LV95)
              </label>
              <Input
                value={postenForm.easting}
                onChange={(e) =>
                  setPostenForm((prev) => ({
                    ...prev,
                    easting: e.target.value.replace(/\D/g, "").slice(0, 7),
                  }))
                }
                placeholder="2600000"
                className="text-base"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
              {eastingError && (
                <p className="mt-1 text-xs text-destructive">{eastingError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Nordwert (LV95)
              </label>
              <Input
                value={postenForm.northing}
                onChange={(e) =>
                  setPostenForm((prev) => ({
                    ...prev,
                    northing: e.target.value.replace(/\D/g, "").slice(0, 7),
                  }))
                }
                placeholder="1200000"
                className="text-base"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
              {northingError && (
                <p className="mt-1 text-xs text-destructive">{northingError}</p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Kommentar
            </label>
            <Textarea
              value={postenForm.comment}
              onChange={(e) =>
                setPostenForm((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              placeholder="Freitext..."
              className="min-h-15 resize-none text-base"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Abbrechen
          </Button>
          <Button
            onClick={onSave}
            className="text-xs"
            disabled={
              !postenForm.name.trim() ||
              Boolean(coordinateErrors.easting) ||
              Boolean(coordinateErrors.northing)
            }
          >
            {editingPostenId ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
