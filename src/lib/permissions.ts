import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const USER_SCHOOL_ROLES = {
  TEACHER: 'TEACHER',
  COORDINATOR: 'COORDINATOR',
} as const

export type UserSchoolRole = (typeof USER_SCHOOL_ROLES)[keyof typeof USER_SCHOOL_ROLES]

export type AuthUser = {
  id: string
  email: string
  name: string
  isGlobalAdmin: boolean
  schools: { schoolId: string; role: string }[]
}

export type AuthContext = {
  user: AuthUser
  payload: { id: string; email: string }
}

export type AuthFailure = {
  error: NextResponse
}

function getBearerToken(request: Request): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null
}

export async function requireAuth(request: Request): Promise<AuthContext | AuthFailure> {
  const token = getBearerToken(request)
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const payload = verifyToken(token)
  if (!payload) return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }

  const userDelegate = prisma.user as typeof prisma.user | undefined
  const user = await userDelegate?.findUnique({
    where: { id: payload.id },
    include: { schools: { where: { school: { deletedAt: null } } } },
  })

  if (user === undefined) {
    const schools = await prisma.userSchool?.findMany?.({
      where: { userId: payload.id, school: { deletedAt: null } },
    }) || []

    return {
      payload,
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.email,
        isGlobalAdmin: false,
        schools: schools.map((school) => ({
          schoolId: school.schoolId,
          role: school.role || USER_SCHOOL_ROLES.COORDINATOR,
        })),
      },
    }
  }

  if (!user) return { error: NextResponse.json({ error: 'User not found' }, { status: 401 }) }

  return {
    payload,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isGlobalAdmin: user.isGlobalAdmin,
      schools: (user.schools || []).map((school) => ({ schoolId: school.schoolId, role: school.role })),
    },
  }
}

export function isAuthFailure(auth: AuthContext | AuthFailure): auth is AuthFailure {
  return 'error' in auth
}

export function hasSchoolAccess(user: AuthUser, schoolId: string): boolean {
  return user.isGlobalAdmin || user.schools.some((school) => school.schoolId === schoolId)
}

export function isCoordinatorForSchool(user: AuthUser, schoolId: string): boolean {
  return user.isGlobalAdmin || user.schools.some((school) => (
    school.schoolId === schoolId && school.role === USER_SCHOOL_ROLES.COORDINATOR
  ))
}

export function getCoordinatorSchoolId(user: AuthUser): string | null {
  const coordinatorSchools = user.schools.filter((school) => school.role === USER_SCHOOL_ROLES.COORDINATOR)
  return coordinatorSchools.length === 1 ? coordinatorSchools[0].schoolId : null
}

export async function getAccessibleSchoolIds(user: AuthUser, requestedSchoolId?: string | null): Promise<string[]> {
  if (user.isGlobalAdmin) {
    if (requestedSchoolId) return [requestedSchoolId]

    const schools = await prisma.school.findMany({
      where: { deletedAt: null },
      select: { id: true },
    })
    return schools.map((school) => school.id)
  }

  if (requestedSchoolId) {
    return hasSchoolAccess(user, requestedSchoolId) ? [requestedSchoolId] : []
  }

  return user.schools.map((school) => school.schoolId)
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function getUserPermissions(user: AuthUser) {
  const coordinatorSchoolId = getCoordinatorSchoolId(user)
  return {
    canManageSchools: user.isGlobalAdmin,
    canManageCoordinators: user.isGlobalAdmin,
    canManageTeachers: user.isGlobalAdmin || Boolean(coordinatorSchoolId),
    canManageClasses: user.isGlobalAdmin || Boolean(coordinatorSchoolId),
    canManageStudents: user.isGlobalAdmin || Boolean(coordinatorSchoolId),
    canUpdateReadingLevels: user.isGlobalAdmin || user.schools.length > 0,
    coordinatorSchoolId,
  }
}
