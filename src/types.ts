export interface HeaderPair {
  key: string
  value: string
  enabled: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig {
  url: string
  method: HttpMethod
  headers: HeaderPair[]
  body: string
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  timeMs: number
}

export interface HistoryItem {
  id: string
  timestamp: number
  request: RequestConfig
  response: ApiResponse
}
