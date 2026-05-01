import { describe, expect, it } from 'vitest'
import { getSectionOptionsForGrade, resolveSectionFilter } from '@/lib/class-filters'

const classes = [
  { grade: '1º Ano', section: 'C' },
  { grade: '1º Ano', section: 'A' },
  { grade: '2º Ano', section: 'B' },
  { grade: '1º Ano', section: 'A' },
  { grade: '2º Ano', section: 'A10' },
  { grade: '2º Ano', section: 'A2' },
]

describe('class filter helpers', () => {
  it('returns all unique sections alphabetically when all grades are selected', () => {
    expect(getSectionOptionsForGrade(classes, '')).toEqual(['A', 'A2', 'A10', 'B', 'C'])
  })

  it('returns only sections for the selected grade alphabetically', () => {
    expect(getSectionOptionsForGrade(classes, '1º Ano')).toEqual(['A', 'C'])
    expect(getSectionOptionsForGrade(classes, '2º Ano')).toEqual(['A2', 'A10', 'B'])
  })

  it('ignores empty section values', () => {
    expect(getSectionOptionsForGrade([
      ...classes,
      { grade: '1º Ano', section: '' },
      { grade: '1º Ano', section: '   ' },
    ], '1º Ano')).toEqual(['A', 'C'])
  })

  it('keeps a valid selected section', () => {
    expect(resolveSectionFilter('A', ['A', 'B'])).toBe('A')
  })

  it('resets an unavailable selected section', () => {
    expect(resolveSectionFilter('C', ['A', 'B'])).toBe('')
    expect(resolveSectionFilter('', ['A', 'B'])).toBe('')
  })
})
