import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

async function checkAccess(request: Request, schoolId: string) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', status: 401 }
  const payload = verifyToken(token)
  if (!payload) return { error: 'Invalid token', status: 401 }

  const teacher = await prisma.teacher.findUnique({ where: { id: payload.id } })
  if (!teacher) return { error: 'User not found', status: 401 }

  const teacherSchool = await prisma.teacherSchool.findUnique({
    where: { teacherId_schoolId: { teacherId: payload.id, schoolId } }
  })
  if (!teacherSchool) return { error: 'Forbidden', status: 403 }
  
  return { payload }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

    const { name, address } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const school = await prisma.school.update({
      where: { id },
      data: { name, address }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.payload!.id, 'UPDATE_SCHOOL', { schoolId: id, name }, ipAddress)

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Update school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

    await prisma.school.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.payload!.id, 'SOFT_DELETE_SCHOOL', { schoolId: id }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
