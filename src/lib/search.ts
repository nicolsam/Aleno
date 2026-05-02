export type SearchableField = boolean | number | string | null | undefined

export function normalizeSearchText(value: SearchableField): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function matchesSearchQuery(query: string, fields: SearchableField[]): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  return fields.some((field) => normalizeSearchText(field).includes(normalizedQuery))
}

export function filterBySearchQuery<T>(
  items: T[],
  query: string,
  getFields: (item: T) => SearchableField[]
): T[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return items

  return items.filter((item) => matchesSearchQuery(normalizedQuery, getFields(item)))
}
