'use client'

import { Pencil, Settings2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { MeldungType } from '@/lib/store'

interface MeldungstypListItemProps {
  type: MeldungType
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function MeldungstypListItem({
  type,
  onEdit,
  onDelete,
}: MeldungstypListItemProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <Settings2 className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
      <div className="flex w-full justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">{type.name}</span>
            {type.minPerHour > 0 && (
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                Min {type.minPerHour}/h
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {type.categories.length} Kat.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {type.categories.map((category) => (
              <span
                key={category.id}
                className="inline-block border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {category.name}
                <span className="ml-1 text-foreground">[{category.maxDigits}]</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onEdit(type.id)}
            aria-label={`${type.name} bearbeiten`}
            title="Bearbeiten"
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onDelete(type.id)}
            className="hover:text-destructive"
            aria-label={`${type.name} löschen`}
            title="Löschen"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  )
}