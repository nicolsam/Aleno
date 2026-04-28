import { describe, expect, it } from 'vitest'
import {
  getReadingLevelStyle,
  isAttentionReadingLevel,
  isReadingLevelCode,
  READING_LEVEL_METADATA,
  type ReadingLevelCode,
} from '@/lib/reading-levels'

describe('reading-level metadata', () => {
  const expectedLevels: ReadingLevelCode[] = ['DNI', 'LO', 'SO', 'RW', 'RS', 'RTS', 'RTF']

  it('defines metadata for every supported reading level', () => {
    expect(Object.keys(READING_LEVEL_METADATA)).toEqual(expectedLevels)
  })

  it('recognizes only supported reading level codes', () => {
    for (const level of expectedLevels) {
      expect(isReadingLevelCode(level)).toBe(true)
    }

    expect(isReadingLevelCode('')).toBe(false)
    expect(isReadingLevelCode('UNKNOWN')).toBe(false)
    expect(isReadingLevelCode('dni')).toBe(false)
  })

  it('marks only DNI, LO, and SO as needing attention', () => {
    expect(isAttentionReadingLevel('DNI')).toBe(true)
    expect(isAttentionReadingLevel('LO')).toBe(true)
    expect(isAttentionReadingLevel('SO')).toBe(true)

    expect(isAttentionReadingLevel('RW')).toBe(false)
    expect(isAttentionReadingLevel('RS')).toBe(false)
    expect(isAttentionReadingLevel('RTS')).toBe(false)
    expect(isAttentionReadingLevel('RTF')).toBe(false)
    expect(isAttentionReadingLevel(undefined)).toBe(false)
    expect(isAttentionReadingLevel('UNKNOWN')).toBe(false)
  })

  it('returns the shared red style for all attention levels', () => {
    expect(getReadingLevelStyle('DNI')).toEqual({
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
      textColor: '#991B1B',
    })
    expect(getReadingLevelStyle('LO')).toEqual(getReadingLevelStyle('DNI'))
    expect(getReadingLevelStyle('SO')).toEqual(getReadingLevelStyle('DNI'))
  })

  it('returns the configured progression colors for non-attention levels', () => {
    expect(getReadingLevelStyle('RW')).toEqual({
      color: '#F97316',
      backgroundColor: '#FFEDD5',
      textColor: '#9A3412',
    })
    expect(getReadingLevelStyle('RS')).toEqual({
      color: '#EAB308',
      backgroundColor: '#FEF9C3',
      textColor: '#854D0E',
    })
    expect(getReadingLevelStyle('RTS')).toEqual({
      color: '#84CC16',
      backgroundColor: '#ECFCCB',
      textColor: '#3F6212',
    })
    expect(getReadingLevelStyle('RTF')).toEqual({
      color: '#16A34A',
      backgroundColor: '#DCFCE7',
      textColor: '#166534',
    })
  })

  it('falls back to neutral styling for missing or unknown levels', () => {
    expect(getReadingLevelStyle(undefined)).toEqual({
      color: '#6B7280',
      backgroundColor: '#F3F4F6',
      textColor: '#374151',
    })
    expect(getReadingLevelStyle('UNKNOWN')).toEqual(getReadingLevelStyle(undefined))
  })
})
