export const USER_GENDERS = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
} as const

export type UserGender = (typeof USER_GENDERS)[keyof typeof USER_GENDERS]

export function normalizeGender(gender: unknown): UserGender | null {
  return typeof gender === 'string' && Object.values(USER_GENDERS).includes(gender as UserGender)
    ? gender as UserGender
    : null
}
