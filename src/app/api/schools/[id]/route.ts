import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, isAuthFailure, requireAuth } from '@/lib/permissions'

async function checkAccess(request: Request, schoolId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }
  if (!schoolId) return { response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!auth.user.isGlobalAdmin) return { response: forbiddenResponse() }
  
  return { auth }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.response) return access.response

    const { name, address } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const school = await prisma.school.update({
      where: { id },
      data: { name, address }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'UPDATE_SCHOOL', { schoolId: id, name }, ipAddress)

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
    if (access.response) return access.response

    await prisma.school.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'SOFT_DELETE_SCHOOL', { schoolId: id }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
