import { describe, expect, it } from 'vitest'
import {
  fromInputMonth,
  getLatestAssessmentDate,
  getMonthKey,
  getMonthRange,
  getMonthStatus,
  hasMonthlyReadingUpdate,
  isDateInMonth,
  resolveMonthInfo,
  resolveMonthKey,
  toInputMonth,
} from '@/lib/monthly-updates'

describe('monthly update helpers', () => {
  it('formats dates as MM/YYYY month keys', () => {
    expect(getMonthKey(new Date(2026, 0, 15))).toBe('01/2026')
    expect(getMonthKey(new Date(2026, 11, 15))).toBe('12/2026')
  })

  it('converts between MM/YYYY and HTML input format', () => {
    expect(toInputMonth('04/2026')).toBe('2026-04')
    expect(fromInputMonth('2026-04')).toBe('04/2026')
  })

  it('uses a valid month key or falls back to the current month', () => {
    const now = new Date(2026, 3, 27)

    expect(resolveMonthKey('02/2026', now)).toBe('02/2026')
    expect(resolveMonthKey(null, now)).toBe('04/2026')
    expect(resolveMonthKey('13/2026', now)).toBe('04/2026')
    expect(resolveMonthKey('not-a-month', now)).toBe('04/2026')
  })

  it('clamps future months to the current month', () => {
    const now = new Date(2026, 3, 27) // April 2026

    expect(resolveMonthKey('05/2026', now)).toBe('04/2026')
    expect(resolveMonthKey('01/2027', now)).toBe('04/2026')
    expect(resolveMonthKey('04/2026', now)).toBe('04/2026')
    expect(resolveMonthKey('03/2026', now)).toBe('03/2026')
  })

  it('builds an inclusive start and exclusive end date range for a month', () => {
    const range = getMonthRange('02/2026')

    expect(range.month).toBe('02/2026')
    expect(range.start).toEqual(new Date(2026, 1, 1))
    expect(range.end).toEqual(new Date(2026, 2, 1))
  })

  it('determines month status as current or past', () => {
    const now = new Date(2026, 3, 27) // April 2026

    expect(getMonthStatus('04/2026', now)).toBe('current')
    expect(getMonthStatus('03/2026', now)).toBe('past')
    expect(getMonthStatus('01/2025', now)).toBe('past')
  })

  it('resolves full month info from a raw query param', () => {
    const now = new Date(2026, 3, 27) // April 2026

    const current = resolveMonthInfo('04/2026', now)
    expect(current.month).toBe('04/2026')
    expect(current.monthStatus).toBe('current')
    expect(current.range.start).toEqual(new Date(2026, 3, 1))

    const past = resolveMonthInfo('02/2026', now)
    expect(past.monthStatus).toBe('past')

    const future = resolveMonthInfo('06/2026', now)
    expect(future.month).toBe('04/2026')
    expect(future.monthStatus).toBe('current')
  })

  it('checks whether assessment dates are inside the selected month', () => {
    const range = getMonthRange('04/2026')

    expect(isDateInMonth(new Date(2026, 3, 1), range)).toBe(true)
    expect(isDateInMonth(new Date(2026, 3, 30, 23, 59), range)).toBe(true)
    expect(isDateInMonth(new Date(2026, 2, 31, 23, 59), range)).toBe(false)
    expect(isDateInMonth(new Date(2026, 4, 1), range)).toBe(false)
  })

  it('detects whether a student has a monthly reading update', () => {
    const range = getMonthRange('04/2026')

    expect(hasMonthlyReadingUpdate([{ recordedAt: new Date(2026, 3, 12) }], range)).toBe(true)
    expect(hasMonthlyReadingUpdate([{ recordedAt: new Date(2026, 2, 12) }], range)).toBe(false)
    expect(hasMonthlyReadingUpdate([], range)).toBe(false)
    expect(hasMonthlyReadingUpdate(undefined, range)).toBe(false)
  })

  it('returns the latest assessment date as an ISO string', () => {
    expect(getLatestAssessmentDate([{ recordedAt: new Date('2026-04-12T10:30:00.000Z') }])).toBe(
      '2026-04-12T10:30:00.000Z'
    )
    expect(getLatestAssessmentDate([])).toBeNull()
  })
})
