import type { LucideIcon } from "lucide-react"
import { ExternalLink } from "lucide-react"
import type { ReactNode } from "react"

/**
 * The bordered "file listing" card: a monospace header strip with an optional
 * action, then divided rows of icon / title+note / right-aligned meta.
 *
 * Shared by the Drive originals on /about and the records and competitions on
 * /wca so the three read as the same object.
 */
export interface DetailListItem {
  id: string
  icon?: LucideIcon
  title: ReactNode
  note?: ReactNode
  meta?: ReactNode
  /** Turns the row into an external link. */
  href?: string
}

export interface DetailListProps {
  /** Monospace label in the header strip. */
  label: string
  action?: { label: string; href: string }
  items: DetailListItem[]
}

export function DetailList({ label, action, items }: DetailListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <p className="truncate font-mono text-xs text-muted-foreground">{label}</p>
        {action && (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {action.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <ul className="divide-y divide-border">
        {items.map(({ id, icon: Icon, title, note, meta, href }) => {
          const body = (
            <>
              {Icon && (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{title}</div>
                {note && <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>}
              </div>
              <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {meta}
              </div>
            </>
          )

          return (
            <li key={id}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 sm:gap-4 sm:px-5"
                >
                  {body}
                </a>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 sm:gap-4 sm:px-5">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
