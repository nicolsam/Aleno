import { describe, expect, it } from 'vitest'
import {
  buildDashboardActionListHref,
  getSingleQueryParam,
} from '@/lib/dashboard-action-lists'

describe('dashboard action list helpers', () => {
  it('builds action list links with the selected month', () => {
    expect(buildDashboardActionListHref('/dashboard/students/need-attention', { month: '04/2026' })).toBe(
      '/dashboard/students/need-attention?month=04%2F2026'
    )
  })

  it('includes the selected school when present', () => {
    expect(
      buildDashboardActionListHref('/dashboard/students/missing-updates', {
        month: '04/2026',
        schoolId: 'school-1',
      })
    ).toBe('/dashboard/students/missing-updates?month=04%2F2026&schoolId=school-1')
  })

  it('builds improved-students links', () => {
    expect(buildDashboardActionListHref('/dashboard/students/improved', { month: '04/2026' })).toBe(
      '/dashboard/students/improved?month=04%2F2026'
    )
  })

  it('includes the source page when present', () => {
    expect(
      buildDashboardActionListHref('/dashboard/students/need-attention', {
        month: '04/2026',
        schoolId: 'school-1',
        from: 'dashboard',
      })
    ).toBe('/dashboard/students/need-attention?month=04%2F2026&schoolId=school-1&from=dashboard')
  })

  it('reads the first query value from Next.js search params', () => {
    expect(getSingleQueryParam('04/2026')).toBe('04/2026')
    expect(getSingleQueryParam(['04/2026', '05/2026'])).toBe('04/2026')
    expect(getSingleQueryParam(undefined)).toBeUndefined()
  })
})
