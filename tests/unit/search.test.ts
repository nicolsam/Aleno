import { describe, expect, it } from 'vitest'
import { filterBySearchQuery, normalizeSearchText } from '@/lib/search'

const records = [
  { name: 'João Silva', code: 'A-001' },
  { name: 'Maria Souza', code: 'B-002' },
]

describe('search helpers', () => {
  it('normalizes text by trimming, lowercasing, and removing accents', () => {
    expect(normalizeSearchText('  JOÃO  ')).toBe('joao')
  })

  it('matches records case-insensitively', () => {
    expect(filterBySearchQuery(records, 'maria', (record) => [record.name])).toEqual([records[1]])
  })

  it('matches records accent-insensitively', () => {
    expect(filterBySearchQuery(records, 'joao', (record) => [record.name])).toEqual([records[0]])
  })

  it('returns all records for a trimmed empty query', () => {
    expect(filterBySearchQuery(records, '   ', (record) => [record.name])).toBe(records)
  })

  it('excludes records when no searchable fields match', () => {
    expect(filterBySearchQuery(records, 'missing', (record) => [record.name, record.code])).toEqual([])
  })
})
