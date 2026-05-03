export const BRAZIL_COUNTRY_CODE = '55'

export type StudentContactInput = {
  name: unknown
  relationship?: unknown
  phone: unknown
  isPrimary?: unknown
}

export type NormalizedStudentContactInput = {
  name: string
  relationship: string | null
  phone: string
  whatsappPhone: string
  isPrimary: boolean
}

export function normalizeBrazilWhatsappPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const isLocalNumber = digits.length === 10 || digits.length === 11
  const isBrazilNumber = digits.startsWith(BRAZIL_COUNTRY_CODE) && (digits.length === 12 || digits.length === 13)

  if (isLocalNumber) return `${BRAZIL_COUNTRY_CODE}${digits}`
  if (isBrazilNumber) return digits

  throw new Error(
    `Invalid Brazilian WhatsApp phone "${phone}". Expected 10 or 11 local digits, or 12 or 13 digits starting with 55.`
  )
}

export function normalizeStudentContactInput(input: StudentContactInput): NormalizedStudentContactInput {
  if (typeof input.name !== 'string' || !input.name.trim()) {
    throw new Error(`Invalid contact name "${String(input.name)}". Expected a non-empty string.`)
  }

  if (typeof input.phone !== 'string' || !input.phone.trim()) {
    throw new Error(`Invalid contact phone "${String(input.phone)}". Expected a non-empty string.`)
  }

  const relationship = typeof input.relationship === 'string' && input.relationship.trim()
    ? input.relationship.trim()
    : null

  return {
    name: input.name.trim(),
    relationship,
    phone: input.phone.trim(),
    whatsappPhone: normalizeBrazilWhatsappPhone(input.phone),
    isPrimary: input.isPrimary === true,
  }
}
