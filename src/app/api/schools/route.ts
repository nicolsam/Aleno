import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const teacherSchools = await prisma.teacherSchool.findMany({
      where: { teacherId: payload.id },
      include: { school: true },
    })

    const schools = teacherSchools.map((ts) => ts.school)
    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Schools error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address } = body

    if (!name) {
      return NextResponse.json({ error: 'School name required' }, { status: 400 })
    }

    const school = await prisma.school.create({
      data: { name, address },
    })

    await prisma.teacherSchool.create({
      data: { teacherId: payload.id, schoolId: school.id, role: 'admin' },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'CREATE_SCHOOL', { schoolId: school.id, name }, ipAddress)

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Create school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}