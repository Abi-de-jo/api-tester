'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { ZapIcon } from 'lucide-react'
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
  const [userId, setUserId] = useState('')
  const [postEnabled, setPostEnabled] = useState(false)
  const [accessStatus, setAccessStatus] = useState<'idle' | 'checking' | 'granted' | 'denied' | 'invalid'>('idle')

  const method = requestConfig.method

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const checkAccess = useCallback(async (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) {
      setPostEnabled(false)
      setAccessStatus('idle')
      setRequestConfig((prev) =>
        prev.method === 'POST' ? { ...prev, method: 'GET' } : prev
      )
      return
    }
    if (!isValidUserId(trimmed)) {
      setPostEnabled(false)
      setAccessStatus('invalid')
      setRequestConfig((prev) =>
        prev.method === 'POST' ? { ...prev, method: 'GET' } : prev
      )
      return
    }

    setAccessStatus('checking')
    try {
      const res = await fetch(`/api/access?user_id=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) {
        setPostEnabled(false)
        setAccessStatus('invalid')
        setRequestConfig((prev) =>
          prev.method === 'POST' ? { ...prev, method: 'GET' } : prev
        )
        return
      }
      const enabled = !!data.postEnabled
      setPostEnabled(enabled)
      setAccessStatus(enabled ? 'granted' : 'denied')
      if (!enabled) {
        setRequestConfig((prev) =>
          prev.method === 'POST' ? { ...prev, method: 'GET' } : prev
        )
      }
    } catch {
      setPostEnabled(false)
      setAccessStatus('denied')
      setRequestConfig((prev) =>
        prev.method === 'POST' ? { ...prev, method: 'GET' } : prev
      )
    }
  }, [])

  useEffect(() => {
    if (userId.trim()) {
      void checkAccess(userId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (method === 'POST') {
      if (!postEnabled) {
        toast.error('POST not available')
        return
      }
      if (!isValidUserId(userId.trim())) {
        toast.error('Invalid user_id')
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
          user_id: userId.trim() || undefined,
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
  }, [requestConfig, method, postEnabled, userId])

  const statusLabel =
    accessStatus === 'checking'
      ? 'Checking…'
      : accessStatus === 'granted'
        ? 'POST enabled'
        : accessStatus === 'denied'
          ? 'POST not granted'
          : accessStatus === 'invalid'
            ? 'Invalid user id'
            : ''

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

      <div className="flex items-center gap-2">
        <label htmlFor="user-id" className="text-sm font-medium whitespace-nowrap">
          User ID
        </label>
        <Input
          id="user-id"
          placeholder="Enter your user id"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={() => void checkAccess(userId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void checkAccess(userId)
            }
          }}
          className="flex-1"
        />
        {statusLabel ? (
          <span
            className={
              accessStatus === 'granted'
                ? 'text-sm text-green-600'
                : accessStatus === 'checking'
                  ? 'text-sm text-muted-foreground'
                  : 'text-sm text-red-600'
            }
          >
            {statusLabel}
          </span>
        ) : null}
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
