import { describe, it, expect } from 'vitest'
import { sanitizeHeaders } from '../src/lib/supabase-server'

describe('sanitizeHeaders', () => {
  it('drops Authorization case-insensitively', () => {
    const out = sanitizeHeaders({
      Authorization: 'Bearer secret',
      'Content-Type': 'application/json',
    })
    expect(out).toEqual({ 'Content-Type': 'application/json' })
    expect(out.Authorization).toBeUndefined()
  })

  it('drops Cookie, Set-Cookie, x-api-key', () => {
    const out = sanitizeHeaders({
      Cookie: 'a=1',
      'Set-Cookie': 'b=2',
      'X-Api-Key': 'k',
      Accept: 'application/json',
    })
    expect(out).toEqual({ Accept: 'application/json' })
  })

  it('keeps non-sensitive headers', () => {
    const out = sanitizeHeaders({
      'Content-Type': 'application/json',
      'X-Request-Id': 'abc',
    })
    expect(out).toEqual({
      'Content-Type': 'application/json',
      'X-Request-Id': 'abc',
    })
  })
})
