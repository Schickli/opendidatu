"use client";

import type { Dispatch, SetStateAction } from "react";
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
  lat: string;
  lng: string;
  kommentar: string;
}

export const emptyPostenForm: PostenFormData = {
  name: "",
  lat: "",
  lng: "",
  kommentar: "",
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
                Breitengrad (Lat)
              </label>
              <Input
                value={postenForm.lat}
                onChange={(e) =>
                  setPostenForm((prev) => ({ ...prev, lat: e.target.value }))
                }
                placeholder="46.9500"
                className="text-base"
                type="number"
                step="0.0001"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Laengengrad (Lng)
              </label>
              <Input
                value={postenForm.lng}
                onChange={(e) =>
                  setPostenForm((prev) => ({ ...prev, lng: e.target.value }))
                }
                placeholder="7.4500"
                className="text-base"
                type="number"
                step="0.0001"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Kommentar
            </label>
            <Textarea
              value={postenForm.kommentar}
              onChange={(e) =>
                setPostenForm((prev) => ({
                  ...prev,
                  kommentar: e.target.value,
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
              isNaN(parseFloat(postenForm.lat)) ||
              isNaN(parseFloat(postenForm.lng))
            }
          >
            {editingPostenId ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
