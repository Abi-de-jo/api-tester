'use client'

// Returns a stable device ID stored in localStorage.
// Generated once as UUID, never changes unless cleared.
const STORAGE_KEY = 'api_tester_device_id'

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function resetDeviceId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
