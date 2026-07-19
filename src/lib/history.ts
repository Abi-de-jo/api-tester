'use client'

import { type HistoryItem } from '@/types'

const STORAGE_KEY = 'api-tester-history'
const MAX_ITEMS = 20

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryItem[]
  } catch {
    return []
  }
}

export function addToHistory(item: HistoryItem): void {
  try {
    const existing = getHistory()
    const updated = [item, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage full or unavailable
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}

export function deleteHistoryItem(id: string): void {
  try {
    const existing = getHistory()
    const updated = existing.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // noop
  }
}
