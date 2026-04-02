"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostenDeleteDialogProps {
  open: boolean;
  postenName?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PostenDeleteDialog({
  open,
  postenName,
  onOpenChange,
  onConfirm,
}: PostenDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            Posten löschen
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Soll der Posten <strong>{postenName}</strong> wirklich gelöscht werden?
          Alle zugehörigen Meldungen werden gelöscht.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="text-xs">
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
