'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { ZapIcon, CopyIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeaderEditor } from '@/components/header-editor'
import { ResponseViewer } from '@/components/response-viewer'
import { HistoryPanel } from '@/components/history-panel'
import { type RequestConfig, type ApiResponse, type HistoryItem, type HttpMethod } from '@/types'
import { getHistory, addToHistory, clearHistory, deleteHistoryItem } from '@/lib/history'
import { isValidUserId } from '@/lib/validate'
import { getDeviceId, resetDeviceId } from '@/lib/device-id'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const AVAILABLE_METHODS: HttpMethod[] = ['GET', 'POST']

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
  const [postEnabled, setPostEnabled] = useState(false)
  const [accessStatus, setAccessStatus] = useState<'checking' | 'granted' | 'denied'>('checking')

  const method = requestConfig.method

  // Stable device ID — generated once, persisted in localStorage
  const deviceId = useMemo(() => getDeviceId(), [])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Auto-check access on mount using the device ID
  useEffect(() => {
    const checkAccess = async () => {
      const id = deviceId
      if (!id || !isValidUserId(id)) {
        setPostEnabled(false)
        setAccessStatus('denied')
        return
      }

      try {
        const res = await fetch(`/api/access?user_id=${encodeURIComponent(id)}`)
        const data = await res.json()
        if (!res.ok) {
          setPostEnabled(false)
          setAccessStatus('denied')
          return
        }
        const enabled = !!data.postEnabled
        setPostEnabled(enabled)
        setAccessStatus(enabled ? 'granted' : 'denied')
      } catch {
        setPostEnabled(false)
        setAccessStatus('denied')
      }
    }

    void checkAccess()
  }, [deviceId])

  const handleResetId = useCallback(() => {
    resetDeviceId()
    window.location.reload()
  }, [])

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(deviceId).then(
      () => toast.success('Device ID copied'),
      () => toast.error('Failed to copy')
    )
  }, [deviceId])

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

    if (method === 'POST') {
      if (!postEnabled) {
        toast.error('POST not available')
        return
      }
      if (requestConfig.body.trim()) {
        try {
          JSON.parse(requestConfig.body)
        } catch {
          toast.error('Invalid JSON body')
          return
        }
      }
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
          user_id: deviceId,
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
  }, [requestConfig, method, postEnabled, deviceId])

  const statusBadge =
    accessStatus === 'checking' ? (
      <span className="text-sm text-muted-foreground">Checking access…</span>
    ) : accessStatus === 'granted' ? (
      <span className="text-sm text-green-600 font-medium">POST enabled</span>
    ) : (
      <span className="text-sm text-amber-600">
        POST not granted — copy your ID below and ask the owner to add it
      </span>
    )

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
        <Select
          value={method}
          onValueChange={(value) => {
            if (value === 'POST' && !postEnabled) return
            setRequestConfig((prev) => ({
              ...prev,
              method: value as HttpMethod,
            }))
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_METHODS.map((m) => (
              <SelectItem
                key={m}
                value={m}
                disabled={m === 'POST' && !postEnabled}
                title={m === 'POST' && !postEnabled ? 'POST not available' : undefined}
              >
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="https://api.example.com/users"
          value={requestConfig.url}
          onChange={(e) =>
            setRequestConfig((prev) => ({ ...prev, url: e.target.value }))
          }
          className="flex-1"
        />

        <Button onClick={handleSend} disabled={loading || (method === 'POST' && !postEnabled)}>
          Send
        </Button>
      </div>

      {/* Auto-generated device ID row */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Device ID
            </span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Copy device ID"
            >
              <CopyIcon className="size-3" />
              Copy
            </button>
          </div>
          <code className="block text-sm font-mono truncate mt-0.5">{deviceId}</code>
        </div>
        <button
          onClick={handleResetId}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Generate new device ID"
        >
          <RefreshCwIcon className="size-3" />
          Reset
        </button>
      </div>

      <div className="flex items-center gap-2">{statusBadge}</div>

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
          {method === 'POST' ? (
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
