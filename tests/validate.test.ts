import { describe, it, expect } from 'vitest'
import { isValidUserId } from '../src/lib/validate'

describe('isValidUserId', () => {
  it('accepts simple alphanumeric id', () => {
    expect(isValidUserId('abc')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidUserId('')).toBe(false)
  })

  it('accepts colon, dash, underscore', () => {
    expect(isValidUserId('abc:def-123_456')).toBe(true)
  })

  it('rejects script tags', () => {
    expect(isValidUserId('<script>')).toBe(false)
  })

  it('rejects SQL injection attempt', () => {
    expect(isValidUserId("' OR 1=1--")).toBe(false)
  })

  it('rejects emoji', () => {
    expect(isValidUserId('😀')).toBe(false)
  })

  it('rejects length 65', () => {
    expect(isValidUserId('a'.repeat(65))).toBe(false)
  })

  it('accepts length 64', () => {
    expect(isValidUserId('a'.repeat(64))).toBe(true)
  })
})
