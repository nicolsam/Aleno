import { describe, expect, it } from 'vitest'
import {
  getUserPermissions,
  hasSchoolAccess,
  isCoordinatorForSchool,
  USER_SCHOOL_ROLES,
  type AuthUser,
} from '@/lib/permissions'

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'User',
    isGlobalAdmin: false,
    schools: [],
    ...overrides,
  }
}

describe('permission helpers', () => {
  it('allows global admins to access and coordinate every school', () => {
    const user = createUser({ isGlobalAdmin: true })

    expect(hasSchoolAccess(user, 'school-1')).toBe(true)
    expect(isCoordinatorForSchool(user, 'school-1')).toBe(true)
    expect(getUserPermissions(user)).toMatchObject({
      canManageSchools: true,
      canManageCoordinators: true,
      canManageTeachers: true,
    })
  })

  it('allows coordinators to manage only their assigned school', () => {
    const user = createUser({
      schools: [{ schoolId: 'school-1', role: USER_SCHOOL_ROLES.COORDINATOR }],
    })

    expect(isCoordinatorForSchool(user, 'school-1')).toBe(true)
    expect(isCoordinatorForSchool(user, 'school-2')).toBe(false)
    expect(getUserPermissions(user).canManageSchools).toBe(false)
    expect(getUserPermissions(user).canManageTeachers).toBe(true)
  })

  it('allows teachers to read assigned schools but not manage records', () => {
    const user = createUser({
      schools: [{ schoolId: 'school-1', role: USER_SCHOOL_ROLES.TEACHER }],
    })

    expect(hasSchoolAccess(user, 'school-1')).toBe(true)
    expect(isCoordinatorForSchool(user, 'school-1')).toBe(false)
    expect(getUserPermissions(user)).toMatchObject({
      canManageClasses: false,
      canManageStudents: false,
      canUpdateReadingLevels: true,
    })
  })
})
