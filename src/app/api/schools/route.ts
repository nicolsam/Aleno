import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, isAuthFailure, requireAuth, USER_SCHOOL_ROLES } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error

    if (auth.user.isGlobalAdmin) {
      const schools = await prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json({ schools })
    }

    const userSchools = await prisma.userSchool.findMany({
      where: { userId: auth.user.id, school: { deletedAt: null } },
      include: { school: true },
    })

    const schools = userSchools.map((ts) => ts.school)
    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Schools error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error
    if (!auth.user.isGlobalAdmin) return forbiddenResponse()

    const body = await request.json()
    const { name, address } = body

    if (!name) {
      return NextResponse.json({ error: 'School name required' }, { status: 400 })
    }

    const school = await prisma.school.create({
      data: { name, address },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'CREATE_SCHOOL', { schoolId: school.id, name, role: USER_SCHOOL_ROLES.COORDINATOR }, ipAddress)

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Create school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
