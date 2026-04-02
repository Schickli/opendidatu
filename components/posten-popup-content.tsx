import { formatSwissCoordinates } from "@/lib/coordinates";
import { Meldung, Posten } from "@/lib/store";
import { MeldungListItem } from "./meldung-list-item";

interface PostenPopupContentProps {
  posten: Posten
  statusRows: Array<{ id: string; name: string; count: number; minPerHour: number }>
  recentMeldungen: Meldung[]
  getTypeName: (typeId: string) => string
}

export function PostenPopupContent({
  posten,
  statusRows,
  recentMeldungen,
  getTypeName,
}: PostenPopupContentProps) {
  return (
    <div className="min-w-55 font-mono text-xs">
      <div className="mb-1 border-b border-border pb-1 text-[13px] font-bold text-foreground">
        {posten.name}
      </div>
      <div className="mb-1 text-[11px] text-muted-foreground">
        {formatSwissCoordinates(posten.coordinates)}
      </div>

      {statusRows.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
          {statusRows.map((row) => {
            const fulfilled = row.count >= row.minPerHour
            return (
              <span
                key={row.id}
                className={fulfilled ? 'text-foreground' : 'text-destructive'}
              >
                {fulfilled ? '✓' : '⚠'} {row.name} {row.count}/{row.minPerHour}
              </span>
            )
          })}
        </div>
      ) : null}

      {posten.comment ? (
        <div className="mb-2 text-[11px] text-foreground/80">{posten.comment}</div>
      ) : null}

      <div className="border-t border-border pt-1 text-[11px] text-muted-foreground">
        Letzte Meldungen:
      </div>

      {recentMeldungen.length > 0 ? (
        <div className="mt-1 divide-y divide-border">
          {recentMeldungen.map((meldung) => (
            <MeldungListItem
              key={meldung.id}
              meldung={meldung}
              typName={getTypeName(meldung.typeId)}
              showPostenName={false}
              onEdit={() => {}}
              onDelete={() => {}}
              showActions={false}
              className="px-0 py-2"
            />
          ))}
        </div>
      ) : (
        <div className="pt-1 text-[11px] text-muted-foreground">Keine Meldungen</div>
      )}
    </div>
  )
}