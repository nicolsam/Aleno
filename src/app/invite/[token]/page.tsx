'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cachedJson, clearClientGetCache } from '@/lib/client-get-cache'

type InviteDetails = {
  name: string
  email: string
  role: string
  schoolName: string
}

function getInviteErrorKey(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid or expired invite': 'invalid',
    'Password must have at least 8 characters': 'passwordMin',
    'Gender is required': 'genderRequired',
    'Email already exists': 'emailExists',
  }

  return errorMap[error] || 'acceptError'
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const t = useTranslations('invite')
  const { token } = use(params)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvite = async () => {
      const response = await cachedJson<{ invite: InviteDetails; error?: string }>(`/api/invites/${token}`)

      if (!response.ok) {
        setError(t(getInviteErrorKey(response.data.error || '')))
      } else {
        setInvite(response.data.invite)
      }
      setLoading(false)
    }

    fetchInvite()
  }, [token, t])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!gender) {
      setError(t('genderRequired'))
      return
    }

    if (password.length < 8) {
      setError(t('passwordMin'))
      return
    }

    const response = await fetch(`/api/invites/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, gender }),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(t(getInviteErrorKey(data.error)))
      return
    }

    clearClientGetCache(`/api/invites/${token}`)
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-600">{t('loading')}</p>
          ) : error && !invite ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : invite && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-medium">{invite.name}</p>
                <p>{invite.email}</p>
                <p>{invite.schoolName}</p>
              </div>

              <div className="space-y-1">
                <Label>{t('gender')}</Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger className="!w-full">
                    <SelectValue placeholder={t('selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">{t('genders.FEMALE')}</SelectItem>
                    <SelectItem value="MALE">{t('genders.MALE')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>{t('password')}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full">
                {t('accept')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
