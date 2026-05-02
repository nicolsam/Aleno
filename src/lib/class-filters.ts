export interface SectionOptionClass {
  grade: string
  section: string
}

export function getSectionOptionsForGrade(
  classes: SectionOptionClass[],
  grade: string
): string[] {
  const sections = classes
    .filter((classRecord) => !grade || classRecord.grade === grade)
    .map((classRecord) => classRecord.section.trim())
    .filter(Boolean)

  return Array.from(new Set(sections)).sort((left, right) => (
    left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
  ))
}

export function resolveSectionFilter(
  currentSection: string,
  availableSections: string[]
): string {
  return currentSection && availableSections.includes(currentSection) ? currentSection : ''
}
