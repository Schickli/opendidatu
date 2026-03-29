"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MeldungDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function MeldungDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: MeldungDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            Meldung loeschen
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Soll diese Meldung wirklich geloescht werden?
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
            Loeschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
