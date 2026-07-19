import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase-server', () => ({
  canUsePost: vi.fn(),
}))

import { canUsePost } from '../src/lib/supabase-server'
import { GET } from '../src/app/api/access/route'
import { NextRequest } from 'next/server'

function makeRequest(userId?: string) {
  const url = userId
    ? `http://localhost/api/access?user_id=${encodeURIComponent(userId)}`
    : 'http://localhost/api/access'
  return new NextRequest(url)
}

describe('GET /api/access', () => {
  beforeEach(() => {
    vi.mocked(canUsePost).mockReset()
  })

  it('returns 400 for missing user_id', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid user_id')
  })

  it('returns 400 for invalid user_id', async () => {
    const res = await GET(makeRequest('<script>'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid user_id')
  })

  it('returns postEnabled true when allowlisted', async () => {
    vi.mocked(canUsePost).mockResolvedValue(true)
    const res = await GET(makeRequest('abi'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ postEnabled: true })
    expect(canUsePost).toHaveBeenCalledWith('abi')
  })

  it('returns postEnabled false when not allowlisted', async () => {
    vi.mocked(canUsePost).mockResolvedValue(false)
    const res = await GET(makeRequest('stranger'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ postEnabled: false })
  })
})
