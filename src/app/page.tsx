'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeaderEditor } from '@/components/header-editor'
import { ResponseViewer } from '@/components/response-viewer'
import { HistoryPanel } from '@/components/history-panel'
import { type RequestConfig, type ApiResponse, type HistoryItem, type HttpMethod } from '@/types'
import { getHistory, addToHistory, clearHistory, deleteHistoryItem } from '@/lib/history'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function Home() {
  const [requestConfig, setRequestConfig] = useState<RequestConfig>({
    url: '',
    method: 'GET',
    headers: [],
    body: '',
  })
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const method = requestConfig.method

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleSend = useCallback(async () => {
    const url = requestConfig.url.trim()
    if (!url) {
      toast.error('URL is required')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('URL must start with http:// or https://')
      return
    }

    const headers: Record<string, string> = {}
    for (const h of requestConfig.headers) {
      if (h.enabled && h.key.trim()) {
        headers[h.key.trim()] = h.value
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers,
          body: requestConfig.body,
        }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      setResponse(data as ApiResponse)
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        request: requestConfig,
        response: data as ApiResponse,
      }
      addToHistory(historyItem)
      setHistory((prev) => [historyItem, ...prev].slice(0, 20))
    } catch (err: any) {
      toast.error(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [requestConfig, method])

  return (
    <div className="flex min-h-screen">
      <HistoryPanel
        history={history}
        onSelect={(item) => {
          setRequestConfig(item.request)
          setResponse(item.response)
        }}
        onClear={() => {
          clearHistory()
          setHistory([])
        }}
        onDelete={(id) => {
          deleteHistoryItem(id)
          setHistory((prev) => prev.filter((h) => h.id !== id))
        }}
      />
      <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <ZapIcon className="size-7" />
        <div>
          <h1 className="text-xl font-semibold">API Tester</h1>
          <p className="text-sm text-muted-foreground">
            Send requests and inspect responses
          </p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex h-10 w-[120px] items-center justify-center rounded-md border bg-muted text-sm font-medium">
          GET
        </div>

        <Input
          placeholder="https://api.example.com/users"
          value={requestConfig.url}
          onChange={(e) =>
            setRequestConfig((prev) => ({ ...prev, url: e.target.value }))
          }
          className="flex-1"
        />

        <Button onClick={handleSend} disabled={loading}>
          Send
        </Button>
      </div>

      <Tabs defaultValue="headers">
        <TabsList>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="headers">
          <HeaderEditor
            headers={requestConfig.headers}
            onChange={(headers) =>
              setRequestConfig((prev) => ({ ...prev, headers }))
            }
          />
        </TabsContent>
        <TabsContent value="body">
          {['POST', 'PUT', 'PATCH'].includes(method) ? (
            <MonacoEditor
              height="200px"
              language="json"
              theme="vs-dark"
              value={requestConfig.body}
              onChange={(value) =>
                setRequestConfig((prev) => ({ ...prev, body: value || '' }))
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              Body is not available for GET requests
            </p>
          )}
        </TabsContent>
      </Tabs>

      <ResponseViewer response={response} loading={loading} />
      </div>
    </div>
  )
}
