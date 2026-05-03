import { describe, expect, it } from 'vitest'
import {
  formatBrazilPhoneInput,
  getBrazilPhoneInputDigits,
  normalizeBrazilWhatsappPhone,
  normalizeStudentContactInput,
  normalizeStudentContactInputs,
} from '@/lib/student-contacts'

describe('student contacts', () => {
  it('normalizes Brazilian local phone numbers for WhatsApp', () => {
    expect(normalizeBrazilWhatsappPhone('(85) 99999-0000')).toBe('5585999990000')
    expect(normalizeBrazilWhatsappPhone('85 3333-4444')).toBe('558533334444')
  })

  it('keeps Brazilian numbers that already include country code', () => {
    expect(normalizeBrazilWhatsappPhone('+55 85 99999-0000')).toBe('5585999990000')
  })

  it('formats Brazilian phone input masks for landlines and mobile numbers', () => {
    expect(formatBrazilPhoneInput('8533334444')).toBe('(85) 3333-4444')
    expect(formatBrazilPhoneInput('85999990000')).toBe('(85) 99999-0000')
  })

  it('strips non-digits, removes pasted country code, and truncates overlong input', () => {
    expect(getBrazilPhoneInputDigits('+55 (85) 99999-0000')).toBe('85999990000')
    expect(formatBrazilPhoneInput('abc85.99999-0000xyz')).toBe('(85) 99999-0000')
    expect(getBrazilPhoneInputDigits('859999900001234')).toBe('85999990000')
  })

  it('includes the offending value when phone validation fails', () => {
    expect(() => normalizeBrazilWhatsappPhone('123')).toThrow(
      'Invalid Brazilian WhatsApp phone "123"'
    )
  })

  it('normalizes contact input with a fixed relationship value', () => {
    expect(normalizeStudentContactInput({
      name: '  Maria  ',
      relationship: '  mother  ',
      phone: '(85) 99999-0000',
      isPrimary: true,
    })).toEqual({
      name: 'Maria',
      relationship: 'MOTHER',
      phone: '(85) 99999-0000',
      whatsappPhone: '5585999990000',
      isPrimary: true,
    })
  })

  it('rejects unknown relationship values', () => {
    expect(() => normalizeStudentContactInput({
      name: 'Maria',
      relationship: 'Neighbor',
      phone: '(85) 99999-0000',
    })).toThrow('Invalid contact relationship "Neighbor"')
  })

  it('makes the first contact primary when none is selected', () => {
    expect(normalizeStudentContactInputs([
      { name: 'Maria', relationship: 'MOTHER', phone: '(85) 99999-0000' },
      { name: 'Jose', relationship: 'FATHER', phone: '(85) 3333-4444' },
    ])).toMatchObject([
      { name: 'Maria', isPrimary: true },
      { name: 'Jose', isPrimary: false },
    ])
  })
})
