import { describe, expect, it } from 'vitest'
import { normalizeBrazilWhatsappPhone, normalizeStudentContactInput } from '@/lib/student-contacts'

describe('student contacts', () => {
  it('normalizes Brazilian local phone numbers for WhatsApp', () => {
    expect(normalizeBrazilWhatsappPhone('(85) 99999-0000')).toBe('5585999990000')
    expect(normalizeBrazilWhatsappPhone('85 3333-4444')).toBe('558533334444')
  })

  it('keeps Brazilian numbers that already include country code', () => {
    expect(normalizeBrazilWhatsappPhone('+55 85 99999-0000')).toBe('5585999990000')
  })

  it('includes the offending value when phone validation fails', () => {
    expect(() => normalizeBrazilWhatsappPhone('123')).toThrow(
      'Invalid Brazilian WhatsApp phone "123"'
    )
  })

  it('normalizes contact input with optional relationship', () => {
    expect(normalizeStudentContactInput({
      name: '  Maria  ',
      relationship: '  Mother  ',
      phone: '(85) 99999-0000',
      isPrimary: true,
    })).toEqual({
      name: 'Maria',
      relationship: 'Mother',
      phone: '(85) 99999-0000',
      whatsappPhone: '5585999990000',
      isPrimary: true,
    })
  })
})
