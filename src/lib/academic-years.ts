export const ACADEMIC_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020]

export function getCurrentAcademicYear(): number {
  return new Date().getFullYear()
}

export function getDefaultAcademicYear(): number {
  const currentYear = getCurrentAcademicYear()
  return ACADEMIC_YEARS.includes(currentYear) ? currentYear : ACADEMIC_YEARS[0]
}
