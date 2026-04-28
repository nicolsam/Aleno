export type MonthStatus = 'current' | 'past'

export interface MonthRange {
  month: string
  start: Date
  end: Date
}

export interface MonthInfo {
  month: string
  monthStatus: MonthStatus
  range: MonthRange
}

export interface ReadingAssessmentDate {
  recordedAt: Date | string
}

/** Matches MM/YYYY — the Brazilian standard month format. */
const MONTH_KEY_PATTERN = /^(0[1-9]|1[0-2])\/\d{4}$/

/**
 * Build a month key from a Date in MM/YYYY format.
 *
 * @example getMonthKey(new Date(2026, 3, 27)) // "04/2026"
 */
export function getMonthKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
}

/**
 * Convert a MM/YYYY key into an HTML `<input type="month">` value (YYYY-MM)
 * so the native picker works correctly.
 */
export function toInputMonth(monthKey: string): string {
  const [month, year] = monthKey.split('/')
  return `${year}-${month}`
}

/**
 * Convert an HTML month input value (YYYY-MM) back to MM/YYYY.
 */
export function fromInputMonth(inputValue: string): string {
  const [year, month] = inputValue.split('-')
  return `${month}/${year}`
}

/**
 * Accept a month string and resolve it to a valid MM/YYYY key.
 *
 * - Valid MM/YYYY → returned as-is (unless it's in the future, see below).
 * - Invalid / null → defaults to the current month.
 * - Future months are clamped to the current month for safety.
 */
export function resolveMonthKey(month: string | null | undefined, now = new Date()): string {
  const currentKey = getMonthKey(now)

  if (!month || !MONTH_KEY_PATTERN.test(month)) {
    return currentKey
  }

  // Clamp future months to the current month
  const [monthPart, yearPart] = month.split('/').map(Number)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (yearPart > currentYear || (yearPart === currentYear && monthPart > currentMonth)) {
    return currentKey
  }

  return month
}

/**
 * Build an inclusive start / exclusive end Date range for a MM/YYYY key.
 */
export function getMonthRange(month: string): MonthRange {
  const [monthValue, yearValue] = month.split('/').map(Number)
  const monthIndex = monthValue - 1

  return {
    month,
    start: new Date(yearValue, monthIndex, 1),
    end: new Date(yearValue, monthIndex + 1, 1),
  }
}

/**
 * Determine whether a month key represents the current month or a past month.
 */
export function getMonthStatus(month: string, now = new Date()): MonthStatus {
  const currentKey = getMonthKey(now)
  return month === currentKey ? 'current' : 'past'
}

/**
 * Return a fully resolved month info object from a raw query param.
 */
export function resolveMonthInfo(raw: string | null | undefined, now = new Date()): MonthInfo {
  const month = resolveMonthKey(raw, now)
  return {
    month,
    monthStatus: getMonthStatus(month, now),
    range: getMonthRange(month),
  }
}

export function isDateInMonth(date: Date | string | undefined, range: MonthRange): boolean {
  if (!date) return false

  const assessmentDate = new Date(date)
  return assessmentDate >= range.start && assessmentDate < range.end
}

export function hasMonthlyReadingUpdate(
  readingHistory: ReadingAssessmentDate[] | undefined,
  range: MonthRange
): boolean {
  return !!readingHistory?.some((record) => isDateInMonth(record.recordedAt, range))
}

export function getLatestAssessmentDate(
  readingHistory: ReadingAssessmentDate[] | undefined
): string | null {
  const latestDate = readingHistory?.[0]?.recordedAt
  return latestDate ? new Date(latestDate).toISOString() : null
}
