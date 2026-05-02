import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, email, password } = body
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    if (action === 'register') {
      return NextResponse.json({ error: 'Registration is invite-only' }, { status: 403 })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { schools: true },
      })
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const valid = await verifyPassword(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken({ id: user.id, email: user.email })

      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      await logAction(user.id, 'LOGIN', { email }, ipAddress)

      const authUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        isGlobalAdmin: user.isGlobalAdmin,
        schools: (user.schools || []).map((school) => ({ schoolId: school.schoolId, role: school.role })),
      }

      return NextResponse.json({ token, user: authUser, teacher: authUser })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
