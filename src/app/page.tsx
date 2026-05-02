'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthRedirectSkeleton from '@/components/skeletons/AuthRedirectSkeleton'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return <AuthRedirectSkeleton />
}
