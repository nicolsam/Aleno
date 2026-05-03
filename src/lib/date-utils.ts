export function getLocalDateString(isoString: string): string {
  const d = new Date(isoString)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

export function formatPayloadDate(localDateStr: string, originalIso: string): string {
  if (getLocalDateString(originalIso) === localDateStr) {
    return originalIso // Preserve exact original time
  }
  return new Date(`${localDateStr}T12:00:00.000Z`).toISOString() // Default to noon UTC
}
