import crypto from 'crypto'

export const INVITE_EXPIRATION_DAYS = 7

export function createInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getInviteExpirationDate(now = new Date()): Date {
  return new Date(now.getTime() + INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
}

export function buildInviteUrl(request: Request, token: string): string {
  const url = new URL(request.url)
  return `${url.origin}/invite/${token}`
}

export function isInviteExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt <= now
}
