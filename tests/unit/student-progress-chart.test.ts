import { describe, expect, it } from 'vitest'
import { buildReadingLevelAxisLabels, buildStudentProgressChartData } from '@/lib/student-progress-chart'

describe('student progress chart helpers', () => {
  it('builds chronological chart points from descending reading history', () => {
    const chartData = buildStudentProgressChartData([
      {
        id: 'id-2',
        recordedAt: '2026-05-03T12:00:00.000Z',
        notes: 'Current',
        readingLevel: { code: 'RW', order: 4 },
      },
      {
        id: 'id-1',
        recordedAt: '2026-04-03T12:00:00.000Z',
        notes: 'Previous',
        readingLevel: { code: 'SO', order: 3 },
      },
    ], 'en', (code) => `Level ${code}`)

    expect(chartData).toEqual([
      { id: 'id-1', date: 'Apr 03', level: 3, levelName: 'Level SO', code: 'SO', notes: 'Previous' },
      { id: 'id-2', date: 'May 03', level: 4, levelName: 'Level RW', code: 'RW', notes: 'Current' },
    ])
  })

  it('builds reading-level axis labels', () => {
    expect(buildReadingLevelAxisLabels((code) => code)).toEqual({
      1: 'DNI',
      2: 'LO',
      3: 'SO',
      4: 'RW',
      5: 'RS',
      6: 'RTS',
      7: 'RTF',
    })
  })
})
