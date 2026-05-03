import { describe, it, expect } from 'vitest'
import { getLocalDateString, formatPayloadDate } from '@/lib/date-utils'

describe('date-utils', () => {
  describe('getLocalDateString', () => {
    it('should correctly extract local date from UTC ISO string', () => {
      // Create a date in local time for testing logic consistency
      const d = new Date()
      const offset = d.getTimezoneOffset() * 60000
      const localDateObj = new Date(d.getTime() - offset)
      const expectedDateStr = localDateObj.toISOString().split('T')[0]

      expect(getLocalDateString(d.toISOString())).toBe(expectedDateStr)
    })
  })

  describe('formatPayloadDate', () => {
    it('should return exact original ISO if date string matches local date string of original', () => {
      const originalIso = new Date().toISOString()
      const localDateStr = getLocalDateString(originalIso)

      expect(formatPayloadDate(localDateStr, originalIso)).toBe(originalIso)
    })

    it('should return new noon UTC date if local date string has changed', () => {
      const originalIso = new Date().toISOString()
      const changedDateStr = '2025-10-15'

      const newIso = formatPayloadDate(changedDateStr, originalIso)
      expect(newIso).toBe('2025-10-15T12:00:00.000Z')
    })
  })
})
