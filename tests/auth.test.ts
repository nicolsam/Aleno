import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/lib/auth'

describe('auth library', () => {
  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const hash = await hashPassword('test123')
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/)  // bcrypt hash format
    })

    it('should produce different hashes for same password (salt)', async () => {
      const hash1 = await hashPassword('test123')
      const hash2 = await hashPassword('test123')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('mypassword')
      const valid = await verifyPassword('mypassword', hash)
      expect(valid).toBe(true)
    })

    it('should return false for wrong password', async () => {
      const hash = await hashPassword('mypassword')
      const valid = await verifyPassword('wrongpassword', hash)
      expect(valid).toBe(false)
    })

    it('should return false for invalid hash', async () => {
      const valid = await verifyPassword('anypassword', 'invalid-hash')
      expect(valid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken({ id: '123', email: 'test@test.com' })
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)  // JWT has 3 parts
    })

    it('should include payload in token', () => {
      const token = generateToken({ id: 'abc123', email: 'teacher@school.com' })
      const payload = verifyToken(token)
      expect(payload?.id).toBe('abc123')
      expect(payload?.email).toBe('teacher@school.com')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token and return payload', () => {
      const token = generateToken({ id: 'user-1', email: 'test@test.com' })
      const payload = verifyToken(token)
      expect(payload?.id).toBe('user-1')
      expect(payload?.email).toBe('test@test.com')
    })

    it('should return null for invalid token', () => {
      const payload = verifyToken('not.a.valid.token')
      expect(payload).toBeNull()
    })

    it('should return null for tampered token', () => {
      const token = generateToken({ id: '123', email: 'test@test.com' })
      const tampered = token.slice(0, -5) + 'xxxxx'
      const payload = verifyToken(tampered)
      expect(payload).toBeNull()
    })
  })
})
