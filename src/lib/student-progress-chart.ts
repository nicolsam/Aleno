export type StudentProgressHistoryEntry = {
  recordedAt: string | Date
  notes: string | null
  readingLevel: {
    code: string
    order: number
  }
}

export type StudentProgressChartPoint = {
  date: string
  level: number
  levelName: string
  notes: string | null
}

const LEVEL_CODES_BY_ORDER: Record<number, string> = {
  1: 'DNI',
  2: 'LO',
  3: 'SO',
  4: 'RW',
  5: 'RS',
  6: 'RTS',
  7: 'RTF',
}

export function buildReadingLevelAxisLabels(translateLevel: (code: string) => string): Record<number, string> {
  return Object.fromEntries(
    Object.entries(LEVEL_CODES_BY_ORDER).map(([order, code]) => [Number(order), translateLevel(code)])
  )
}

export function buildStudentProgressChartData(
  history: StudentProgressHistoryEntry[],
  locale: string,
  translateLevel: (code: string) => string
): StudentProgressChartPoint[] {
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : 'en-US'

  return [...history].reverse().map((entry) => ({
    date: new Date(entry.recordedAt).toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'short',
    }),
    level: entry.readingLevel.order,
    levelName: translateLevel(entry.readingLevel.code),
    notes: entry.notes,
  }))
}
