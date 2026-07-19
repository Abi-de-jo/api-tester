const USER_ID_RE = /^[A-Za-z0-9_\-:]+$/

export function isValidUserId(s: string): boolean {
  if (typeof s !== 'string') return false
  if (s.length < 1 || s.length > 64) return false
  return USER_ID_RE.test(s)
}
