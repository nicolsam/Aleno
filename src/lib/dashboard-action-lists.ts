export type DashboardActionListPath = '/dashboard/students/need-attention' | '/dashboard/students/missing-updates'

interface DashboardActionListHrefParams {
  month: string
  schoolId?: string
  from?: string
}

export function buildDashboardActionListHref(
  pathname: DashboardActionListPath,
  params: DashboardActionListHrefParams
): string {
  const searchParams = new URLSearchParams({ month: params.month })

  if (params.schoolId) {
    searchParams.set('schoolId', params.schoolId)
  }

  if (params.from) {
    searchParams.set('from', params.from)
  }

  return `${pathname}?${searchParams.toString()}`
}

export function getSingleQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
