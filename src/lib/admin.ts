import { type NextResponse } from 'next/server'
import { forbiddenResponse, isAuthFailure, requireAuth, type AuthUser } from '@/lib/permissions'

type AdminAuthResult =
  | { error: NextResponse; payload?: never; user?: never; teacher?: never }
  | { error?: never; payload: { id: string; email: string }; user: AuthUser; teacher: AuthUser }

export async function verifyAdmin(request: Request): Promise<AdminAuthResult> {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return auth

  if (!auth.user.isGlobalAdmin) {
    return { error: forbiddenResponse() }
  }

  return { payload: auth.payload, user: auth.user, teacher: auth.user }
}
