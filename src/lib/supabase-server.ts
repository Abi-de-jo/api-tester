import { Pool } from 'pg'

const SENSITIVE = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key'])

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.SUPABASE_DB_URL
    if (!connectionString) {
      throw new Error('SUPABASE_DB_URL is not set')
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return pool
}

export function sanitizeHeaders(
  headers: Record<string, string> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers || typeof headers !== 'object') return out
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE.has(key.toLowerCase())) continue
    out[key] = value
  }
  return out
}

export async function canUsePost(userId: string): Promise<boolean> {
  try {
    const result = await getPool().query(
      'SELECT 1 FROM post_access WHERE user_id = $1 LIMIT 1',
      [userId]
    )
    return !!result.rows[0]
  } catch (err) {
    console.error('canUsePost failed:', err)
    return false
  }
}

export type LogRequestRow = {
  user_id: string
  method: string
  url: string
  headers: Record<string, string>
  body: unknown
  status: number | null
  response_time_ms: number | null
}

export async function logRequest(row: LogRequestRow): Promise<void> {
  try {
    let bodyJson: unknown = row.body
    if (typeof row.body === 'string') {
      try {
        bodyJson = row.body ? JSON.parse(row.body) : {}
      } catch {
        bodyJson = { _raw: row.body }
      }
    } else if (row.body == null) {
      bodyJson = {}
    }

    await getPool().query(
      `INSERT INTO request_logs (user_id, method, url, headers, body, status, response_time_ms)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)`,
      [
        row.user_id,
        row.method,
        row.url,
        JSON.stringify(sanitizeHeaders(row.headers)),
        JSON.stringify(bodyJson ?? {}),
        row.status,
        row.response_time_ms,
      ]
    )
  } catch (err) {
    console.error('logRequest failed:', err)
  }
}
