import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, name, email, password } = body
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const existing = await prisma.teacher.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const teacher = await prisma.teacher.create({
        data: { name, email, password: hashedPassword },
      })

      const token = generateToken({ id: teacher.id, email: teacher.email })

      await prisma.userSession.create({
        data: {
          teacherId: teacher.id,
          token,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      await logAction(teacher.id, 'REGISTER', { email }, ipAddress)

      return NextResponse.json({ token, teacher: { id: teacher.id, name: teacher.name, email: teacher.email, isGlobalAdmin: teacher.isGlobalAdmin } })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const teacher = await prisma.teacher.findUnique({ where: { email } })
      if (!teacher) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const valid = await verifyPassword(password, teacher.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken({ id: teacher.id, email: teacher.email })

      await prisma.userSession.create({
        data: {
          teacherId: teacher.id,
          token,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      await logAction(teacher.id, 'LOGIN', { email }, ipAddress)

      return NextResponse.json({ token, teacher: { id: teacher.id, name: teacher.name, email: teacher.email, isGlobalAdmin: teacher.isGlobalAdmin } })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}