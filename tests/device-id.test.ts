import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as deviceIdModule from '../src/lib/device-id'

const STORAGE_KEY = 'api_tester_device_id'

// Minimal localStorage mock for node environment
function createMockStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() { return store.size },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => { store.delete(key) },
    setItem: (key: string, value: string) => { store.set(key, value) },
  }
}

describe('device-id', () => {
  let mod: typeof deviceIdModule

  beforeEach(async () => {
    // Replace global localStorage with mock for each test
    const mock = createMockStorage()
    vi.stubGlobal('localStorage', mock)
    vi.stubGlobal('window', {})
    // Re-import module fresh so it initializes with mocked globals
    vi.resetModules()
    mod = await import('../src/lib/device-id')
  })

  it('generates a UUID on first call', () => {
    const id = mod.getDeviceId()
    expect(id).toHaveLength(36)
    expect(id).toMatch(/^[\da-f-]+$/)
  })

  it('returns the same id on repeated calls', () => {
    const id1 = mod.getDeviceId()
    const id2 = mod.getDeviceId()
    expect(id1).toBe(id2)
  })

  it('persists in localStorage', () => {
    const id1 = mod.getDeviceId()
    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).toBe(id1)
  })

  it('resetDeviceId clears the stored id', () => {
    mod.getDeviceId()
    mod.resetDeviceId()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('generates a new id after reset and re-get', () => {
    const id1 = mod.getDeviceId()
    mod.resetDeviceId()
    // re-import so module re-initializes with cleared storage
    const id2 = mod.getDeviceId()
    expect(id2).not.toBe(id1)
  })

  it('id is 36 chars (UUID length)', () => {
    expect(mod.getDeviceId()).toHaveLength(36)
  })
})
