'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MeldungstypDeleteDialogProps {
  open: boolean
  meldungstypName?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MeldungstypDeleteDialog({
  open,
  meldungstypName,
  onOpenChange,
  onConfirm,
}: MeldungstypDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            Meldungstyp loeschen
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Soll der Meldungstyp <strong>{meldungstypName}</strong> wirklich
          geloescht werden?
        </p>
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
            variant="destructive"
            onClick={onConfirm}
            className="font-mono text-xs"
          >
            Loeschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}