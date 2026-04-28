import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins truthy class names and ignores falsey values', () => {
    expect(cn('flex', false && 'hidden', null, undefined, 'items-center')).toBe(
      'flex items-center'
    )
  })

  it('supports clsx object and array syntax', () => {
    expect(cn(['px-2', 'py-1'], { 'text-sm': true, 'text-lg': false })).toBe(
      'px-2 py-1 text-sm'
    )
  })

  it('merges conflicting Tailwind utility classes with the last value winning', () => {
    expect(cn('px-2 py-1 text-sm', 'px-4 text-lg')).toBe('py-1 px-4 text-lg')
  })
})
