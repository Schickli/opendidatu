'use client'

import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { useData } from '@/lib/data-context'

export function ZentraleHeader() {
  const { posten, meldungCount, error, isLoading } = useData()

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
          OpenDidatu
        </h1>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          Meldungsposten
        </span>
      </div>
      <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
        {isLoading ? <span>Synchronisiert...</span> : null}
        {error ? <span className="text-destructive">{error}</span> : null}
        <span>{posten.length} Posten</span>
        <div className="h-4 w-px bg-border" />
        <span>{meldungCount} Meldungen</span>
        <div className="h-4 w-px bg-border" />
        <Link
          href="/analytics"
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Datenqualität"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
