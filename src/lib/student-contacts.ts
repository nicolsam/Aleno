export const BRAZIL_COUNTRY_CODE = '55'

export const STUDENT_CONTACT_RELATIONSHIPS = [
  'MOTHER',
  'FATHER',
  'GRANDMOTHER',
  'GRANDFATHER',
  'AUNT',
  'UNCLE',
  'GUARDIAN',
  'OTHER',
] as const

export type StudentContactRelationship = (typeof STUDENT_CONTACT_RELATIONSHIPS)[number]

export type StudentContactInput = {
  name: unknown
  relationship?: unknown
  phone: unknown
  isPrimary?: unknown
}

export type NormalizedStudentContactInput = {
  name: string
  relationship: StudentContactRelationship
  phone: string
  whatsappPhone: string
  isPrimary: boolean
}

export function isStudentContactRelationship(value: unknown): value is StudentContactRelationship {
  return typeof value === 'string' && STUDENT_CONTACT_RELATIONSHIPS.includes(value as StudentContactRelationship)
}

export function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function getBrazilPhoneInputDigits(value: string): string {
  let digits = getDigitsOnly(value)

  if (digits.startsWith(BRAZIL_COUNTRY_CODE) && digits.length >= 12) {
    digits = digits.slice(BRAZIL_COUNTRY_CODE.length)
  }

  return digits.slice(0, 11)
}

export function formatBrazilPhoneInput(value: string): string {
  const digits = getBrazilPhoneInputDigits(value)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function normalizeBrazilWhatsappPhone(phone: string): string {
  const digits = getDigitsOnly(phone)
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

  const relationship = typeof input.relationship === 'string' ? input.relationship.trim().toUpperCase() : ''
  if (!isStudentContactRelationship(relationship)) {
    throw new Error(
      `Invalid contact relationship "${String(input.relationship)}". Expected one of: ${STUDENT_CONTACT_RELATIONSHIPS.join(', ')}.`
    )
  }

  return {
    name: input.name.trim(),
    relationship,
    phone: input.phone.trim(),
    whatsappPhone: normalizeBrazilWhatsappPhone(input.phone),
    isPrimary: input.isPrimary === true,
  }
}

export function normalizeStudentContactInputs(input: unknown): NormalizedStudentContactInput[] {
  if (input === undefined || input === null) return []
  if (!Array.isArray(input)) {
    throw new Error(`Invalid contacts "${String(input)}". Expected an array of contact objects.`)
  }

  const contacts = input.map((contact) => normalizeStudentContactInput(contact as StudentContactInput))
  const primaryIndex = contacts.findIndex((contact) => contact.isPrimary)
  const fallbackPrimaryIndex = contacts.length > 0 ? Math.max(primaryIndex, 0) : -1

  return contacts.map((contact, index) => ({
    ...contact,
    isPrimary: index === fallbackPrimaryIndex,
  }))
}
