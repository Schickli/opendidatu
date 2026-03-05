'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PostenPanel } from '@/components/posten-panel'
import { NachrichtentypPanel } from '@/components/nachrichtentyp-panel'
import { NachrichtenPanel } from '@/components/nachrichten-panel'
import { useData } from '@/lib/data-context'
import { MapPin, Settings2, MessageSquare } from 'lucide-react'

export function ZentraleSidebar() {
  const { selectedPostenId, setSelectedPostenId } = useData()

  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <Tabs defaultValue="nachrichten" className="flex h-full flex-col">
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-background p-0">
          <TabsTrigger
            value="nachrichten"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <MessageSquare className="size-3" />
            Nachrichten
          </TabsTrigger>
          <TabsTrigger
            value="posten"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <MapPin className="size-3" />
            Posten
          </TabsTrigger>
          <TabsTrigger
            value="typen"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Settings2 className="size-3" />
            Typen
          </TabsTrigger>
        </TabsList>

        {selectedPostenId && (
          <div className="flex items-center justify-between border-b border-border bg-secondary px-3 py-1">
            <span className="font-mono text-xs text-muted-foreground">
              Filter: Ausgewaehlter Posten
            </span>
            <button
              onClick={() => setSelectedPostenId(null)}
              className="font-mono text-xs text-foreground underline underline-offset-2 hover:text-muted-foreground"
            >
              Aufheben
            </button>
          </div>
        )}

        <TabsContent value="nachrichten" className="mt-0 flex-1 overflow-hidden">
          <NachrichtenPanel />
        </TabsContent>
        <TabsContent value="posten" className="mt-0 flex-1 overflow-hidden">
          <PostenPanel />
        </TabsContent>
        <TabsContent value="typen" className="mt-0 flex-1 overflow-hidden">
          <NachrichtentypPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
