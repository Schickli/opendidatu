'use client'

import { Pencil, Settings2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Meldungstyp } from '@/lib/store'

interface MeldungstypListItemProps {
  typ: Meldungstyp
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function MeldungstypListItem({
  typ,
  onEdit,
  onDelete,
}: MeldungstypListItemProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <Settings2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
      <div className="flex w-full justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">{typ.name}</span>
            {typ.minProStunde > 0 && (
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                Min {typ.minProStunde}/h
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {typ.kategorien.length} Kat.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {typ.kategorien.map((kategorie) => (
              <span
                key={kategorie.id}
                className="inline-block border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {kategorie.name}
                <span className="ml-1 text-foreground">[{kategorie.maxZiffern}]</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onEdit(typ.id)}
            aria-label={`${typ.name} bearbeiten`}
            title="Bearbeiten"
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onDelete(typ.id)}
            className="hover:text-destructive"
            aria-label={`${typ.name} loeschen`}
            title="Loeschen"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  )
}