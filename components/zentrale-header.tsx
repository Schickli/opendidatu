'use client'

import { useData } from '@/lib/data-context'

export function ZentraleHeader() {
  const { posten, nachrichten } = useData()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = now.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
          Zentrale
        </h1>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          Nachrichtenposten
        </span>
      </div>
      <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
        <span>{posten.length} Posten</span>
        <div className="h-4 w-px bg-border" />
        <span>{nachrichten.length} Nachrichten</span>
        <div className="h-4 w-px bg-border" />
        <span>
          {dateStr} {timeStr}
        </span>
      </div>
    </header>
  )
}
