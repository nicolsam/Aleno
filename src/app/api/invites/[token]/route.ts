import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { hashInviteToken, isInviteExpired } from '@/lib/invites'
import { USER_SCHOOL_ROLES } from '@/lib/permissions'

async function findInvite(token: string) {
  return prisma.userInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: { school: true },
  })
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const invite = await findInvite(token)

    if (!invite || invite.acceptedAt || isInviteExpired(invite.expiresAt)) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    return NextResponse.json({
      invite: {
        name: invite.name,
        email: invite.email,
        role: invite.role,
        schoolName: invite.school.name,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error) {
    console.error('Invite GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must have at least 8 characters' }, { status: 400 })
    }

    const invite = await findInvite(token)
    if (!invite || invite.acceptedAt || isInviteExpired(invite.expiresAt)) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: invite.name,
          email: invite.email,
          password: hashedPassword,
          schools: {
            create: {
              schoolId: invite.schoolId,
              role: invite.role === USER_SCHOOL_ROLES.COORDINATOR
                ? USER_SCHOOL_ROLES.COORDINATOR
                : USER_SCHOOL_ROLES.TEACHER,
            },
          },
        },
      })

      await tx.userInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      })

      return createdUser
    })

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    console.error('Invite POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
