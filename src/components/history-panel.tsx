'use client'

import { useState } from 'react'
import { HistoryIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type HistoryItem } from '@/types'
import { cn } from '@/lib/utils'

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface HistoryPanelProps {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
  onDelete: (id: string) => void
}

export function HistoryPanel({
  history,
  onSelect,
  onClear,
  onDelete,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="fixed left-3 top-3 z-50 size-9"
          title="History"
        >
          <HistoryIcon className="size-5" />
        </Button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              'fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-background shadow-lg',
              'md:static md:z-auto md:shadow-none'
            )}
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">History</span>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={onClear}>
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setOpen(false)}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No history yet
                </p>
              ) : (
                <ul className="divide-y">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                      onClick={() => onSelect(item)}
                    >
                      <Badge
                        variant={
                          item.request.method === 'GET' ? 'default' : 'secondary'
                        }
                        className={cn(
                          (item.request.method === 'POST' || item.request.method === 'PUT') &&
                            'border-green-500/30 bg-green-500/15 text-green-600',
                          item.request.method === 'PATCH' &&
                            'border-orange-500/30 bg-orange-500/15 text-orange-600',
                          item.request.method === 'DELETE' &&
                            'border-red-500/30 bg-red-500/15 text-red-600'
                        )}
                      >
                        {item.request.method}
                      </Badge>

                      <span
                        className="min-w-0 flex-1 truncate"
                        title={item.request.url}
                      >
                        {item.request.url.slice(0, 30)}
                      </span>

                      <Badge
                        variant={
                          item.response.status >= 400
                            ? 'destructive'
                            : item.response.status >= 300
                              ? 'secondary'
                              : 'default'
                        }
                        className={cn(
                          item.response.status >= 200 &&
                            item.response.status < 300 &&
                            'border-green-500/30 bg-green-500/15 text-green-600'
                        )}
                      >
                        {item.response.status}
                      </Badge>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(item.timestamp)}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(item.id)
                        }}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
