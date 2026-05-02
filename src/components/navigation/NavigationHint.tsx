'use client'

import { useLinkStatus } from 'next/link'

export default function NavigationHint() {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      className={`navigation-hint ${pending ? 'is-pending' : ''}`}
    />
  )
}
