'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PostenNachrichtenPanel } from '@/components/posten-nachrichten-panel'
import { NachrichtentypPanel } from '@/components/nachrichtentyp-panel'
import { Radio, Settings2 } from 'lucide-react'

export function ZentraleSidebar() {
  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <Tabs defaultValue="uebersicht" className="flex h-full flex-col">
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-background p-0">
          <TabsTrigger
            value="uebersicht"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Radio className="size-3" />
            Uebersicht
          </TabsTrigger>
          <TabsTrigger
            value="typen"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Settings2 className="size-3" />
            Typen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="mt-0 flex-1 overflow-hidden">
          <PostenNachrichtenPanel />
        </TabsContent>
        <TabsContent value="typen" className="mt-0 flex-1 overflow-hidden">
          <NachrichtentypPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
