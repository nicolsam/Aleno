import { describe, expect, it, vi } from 'vitest'
import { ACADEMIC_YEARS, getDefaultAcademicYear } from '@/lib/academic-years'

describe('academic year options', () => {
  it('provides predefined academic years for filters', () => {
    expect(ACADEMIC_YEARS).toEqual([2026, 2025, 2024, 2023, 2022, 2021, 2020])
  })

  it('uses the current year when it is predefined', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 29))

    expect(getDefaultAcademicYear()).toBe(2026)

    vi.useRealTimers()
  })

  it('falls back to the newest predefined year when current year is not configured', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2030, 0, 1))

    expect(getDefaultAcademicYear()).toBe(2026)

    vi.useRealTimers()
  })
})
