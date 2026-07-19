'use client'

import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { type ApiResponse } from '@/types'
import { Loader2Icon } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface ResponseViewerProps {
  response: ApiResponse | null
  loading: boolean
}

function formatBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

function bodyLanguage(body: string): string {
  try {
    JSON.parse(body)
    return 'json'
  } catch {
    return 'text'
  }
}

export function ResponseViewer({ response, loading }: ResponseViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        <span>Sending request...</span>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Send a request to see the response
      </div>
    )
  }

  const statusVariant =
    response.status >= 400 ? 'destructive' :
    response.status >= 300 ? 'secondary' :
    'default'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant}>{response.status}</Badge>
        <span className="text-sm font-medium">{response.statusText}</span>
        <Badge variant="outline" className="ml-auto">
          {response.timeMs}ms
        </Badge>
      </div>

      <MonacoEditor
        height="400px"
        language={bodyLanguage(response.body)}
        theme="vs-dark"
        value={formatBody(response.body)}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
        }}
      />

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
          Response Headers
        </summary>
        <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 text-xs">
          {JSON.stringify(response.headers, null, 2)}
        </pre>
      </details>
    </div>
  )
}
