'use client'

import dynamic from 'next/dynamic'
import { DataProvider } from '@/lib/data-context'
import { ZentraleHeader } from '@/components/zentrale-header'
import { ZentraleSidebar } from '@/components/zentrale-sidebar'

const ZentraleMap = dynamic(
  () => import('@/components/zentrale-map').then((mod) => ({ default: mod.ZentraleMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-secondary font-mono text-xs text-muted-foreground">
        Karte wird geladen...
      </div>
    ),
  }
)

export default function ZentralePage() {
  return (
    <DataProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <ZentraleHeader />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ZentraleMap />
          </div>
          <div className="w-105 shrink-0 overflow-hidden">
            <ZentraleSidebar />
          </div>
        </div>
      </div>
    </DataProvider>
  )
}
