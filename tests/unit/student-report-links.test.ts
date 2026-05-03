import { describe, expect, it } from 'vitest'
import {
  buildStudentReportShareText,
  getStudentReportExpirationDate,
  hashStudentReportToken,
  STUDENT_REPORT_EXPIRATION_DAYS,
} from '@/lib/student-report-links'
import { buildWhatsappShareUrl } from '@/lib/whatsapp'

describe('student report links', () => {
  it('expires report links after 30 days by default', () => {
    const now = new Date('2026-05-03T12:00:00.000Z')
    const expiresAt = getStudentReportExpirationDate(now)

    expect(STUDENT_REPORT_EXPIRATION_DAYS).toBe(30)
    expect(expiresAt).toEqual(new Date('2026-06-02T12:00:00.000Z'))
  })

  it('hashes tokens without returning the raw token', () => {
    const hash = hashStudentReportToken('parent-token')

    expect(hash).not.toBe('parent-token')
    expect(hash).toHaveLength(64)
  })

  it('builds a WhatsApp message and direct contact URL', () => {
    const shareText = buildStudentReportShareText('Ana', 'Escola Teste', 'https://app.test/reports/students/token')
    const url = buildWhatsappShareUrl(shareText, '5585999990000')

    expect(shareText).toContain('Aluno: Ana')
    expect(shareText).toContain('Escola: Escola Teste')
    expect(shareText.split('\n').at(-1)).toBe('https://app.test/reports/students/token')
    expect(decodeURIComponent(url)).toContain('https://app.test/reports/students/token')
    expect(url).toContain('https://wa.me/5585999990000?text=')
  })
})
