import { describe, expect, it } from 'vitest'
import {
  buildInviteUrl,
  createInviteToken,
  getInviteExpirationDate,
  hashInviteToken,
  INVITE_EXPIRATION_DAYS,
  isInviteExpired,
} from '@/lib/invites'

describe('invite helpers', () => {
  it('creates opaque tokens and stable hashes', () => {
    const token = createInviteToken()
    const secondToken = createInviteToken()

    expect(token).not.toBe(secondToken)
    expect(token.length).toBeGreaterThan(20)
    expect(hashInviteToken(token)).toBe(hashInviteToken(token))
    expect(hashInviteToken(token)).not.toBe(token)
  })

  it('expires invites after seven days', () => {
    const now = new Date('2026-05-01T12:00:00.000Z')
    const expiresAt = getInviteExpirationDate(now)

    expect(expiresAt.getTime()).toBe(now.getTime() + INVITE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
    expect(isInviteExpired(expiresAt, new Date('2026-05-08T11:59:59.000Z'))).toBe(false)
    expect(isInviteExpired(expiresAt, expiresAt)).toBe(true)
  })

  it('builds invite links from the current request origin', () => {
    expect(buildInviteUrl(new Request('https://aleno.test/api/users'), 'abc123')).toBe('https://aleno.test/invite/abc123')
  })
})
