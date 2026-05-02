'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { canManageTeachers, getStoredUser, type StoredUser } from '@/lib/client-auth'

type School = {
  id: string
  name: string
}

type ManagedUser = {
  id: string
  name: string
  email: string
  schools: { schoolId: string; schoolName: string; role: string }[]
}

type PendingInvite = {
  id: string
  name: string
  email: string
  role: string
  schoolName: string
  expiresAt: string
  inviteLink?: string | null
}

type PendingUnassign = {
  managedUser: ManagedUser
  schoolId: string
}

const ROLE_TEACHER = 'TEACHER'
const ROLE_COORDINATOR = 'COORDINATOR'
type InviteModalStep = 'form' | 'link'

export default function TeachersPage() {
  const router = useRouter()
  const t = useTranslations('teachers')
  const tCommon = useTranslations('common')
  const [user, setUser] = useState<StoredUser | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteStep, setInviteStep] = useState<InviteModalStep>('form')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<PendingInvite | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: ROLE_TEACHER })
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [pendingUnassign, setPendingUnassign] = useState<PendingUnassign | null>(null)

  const isGlobalAdmin = Boolean(user?.isGlobalAdmin)

  const getInviteErrorMessage = (error: string | undefined) => {
    const errorMap: Record<string, string> = {
      Forbidden: 'forbidden',
      'Email already exists': 'emailExists',
      'Invite already exists': 'inviteAlreadyExists',
      'User already assigned to this school': 'alreadyAssigned',
      'Coordinator already assigned to a school': 'coordinatorAlreadyAssigned',
    }

    return t(error ? errorMap[error] || 'inviteError' : 'inviteError')
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = getStoredUser()
    if (!token || !storedUser) {
      router.push('/login')
      return
    }
    if (!canManageTeachers(storedUser)) {
      router.push('/dashboard')
      return
    }
    queueMicrotask(() => setUser(storedUser))
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token || !user) return

      const schoolsRes = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (schoolsRes.ok) {
        const data = await schoolsRes.json()
        const fetchedSchools = data.schools || []
        setSchools(fetchedSchools)
        if (!schoolId && fetchedSchools.length === 1) setSchoolId(fetchedSchools[0].id)
      }

      const params = new URLSearchParams()
      if (schoolId) params.set('schoolId', schoolId)
      const usersRes = await fetch(`/api/users${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
        setInvites(data.invites || [])
      }
    }

    fetchData()
  }, [user, schoolId])

  const openInviteModal = () => {
    setInviteStep('form')
    setInviteLink('')
    setCreatedInvite(null)
    setShowInviteModal(true)
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteStep('form')
    setInviteLink('')
    setCreatedInvite(null)
    setForm({ name: '', email: '', role: ROLE_TEACHER })
  }

  const inviteAnother = () => {
    setInviteStep('form')
    setInviteLink('')
    setCreatedInvite(null)
  }

  const openEditModal = (managedUser: ManagedUser) => {
    setEditingUser(managedUser)
    setEditForm({ name: managedUser.name, email: managedUser.email })
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditForm({ name: '', email: '' })
  }

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    const token = localStorage.getItem('token')
    if (!token || !schoolId) return

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, schoolId }),
    })
    const data = await response.json()

    if (!response.ok) {
      toast.error(getInviteErrorMessage(data.error))
      return
    }

    if (data.user) {
      setUsers((current) => (
        current.some((currentUser) => currentUser.id === data.user.id)
          ? current.map((currentUser) => currentUser.id === data.user.id ? data.user : currentUser)
          : [data.user, ...current]
      ))
      setInvites((current) => current.filter((invite) => invite.email !== data.user.email))
      closeInviteModal()
      toast.success(t('userAssigned'))
      return
    }

    setInviteLink(data.inviteLink)
    setCreatedInvite(data.invite)
    setInvites((current) => [data.invite, ...current])
    setForm({ name: '', email: '', role: ROLE_TEACHER })
    setInviteStep('link')
    toast.success(t('inviteCreated'))
  }

  const handleUnassign = async () => {
    const token = localStorage.getItem('token')
    if (!token || !pendingUnassign) return

    const { managedUser, schoolId: targetSchoolId } = pendingUnassign
    setPendingUnassign(null)

    const response = await fetch(`/api/users/${managedUser.id}/schools/${targetSchoolId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      toast.error(t('unassignError'))
      return
    }

    setUsers((current) => current.filter((currentUser) => currentUser.id !== managedUser.id))
    toast.success(t('unassigned'))
  }

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    const token = localStorage.getItem('token')
    if (!token || !editingUser) return

    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await response.json()

    if (!response.ok) {
      toast.error(data.error || t('updateError'))
      return
    }

    setUsers((current) => current.map((currentUser) => (
      currentUser.id === data.user.id ? data.user : currentUser
    )))
    closeEditModal()
    toast.success(t('updated'))
  }

  const copyInviteLink = async (link = inviteLink) => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    toast.success(t('copied'))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <p className="text-sm text-gray-600">{t('description')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('inviteTeacher')}</CardTitle>
            <p className="mt-1 text-sm text-gray-600">{t('inviteDescription')}</p>
          </div>
          <Button type="button" onClick={openInviteModal} className="w-full sm:w-auto">
            <UserPlus className="size-4" />
            {t('openInviteModal')}
          </Button>
        </CardHeader>
      </Card>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            {inviteStep === 'form' ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{t('inviteModalTitle')}</h2>
                  <p className="text-sm text-gray-600">{t('inviteModalDescription')}</p>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0 space-y-1">
                    <Label>{t('school')}</Label>
                    <Select value={schoolId} onValueChange={setSchoolId}>
                      <SelectTrigger className="!w-full">
                        <SelectValue placeholder={t('selectSchool')} />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <Label>{t('role')}</Label>
                    <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                      <SelectTrigger className="!w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLE_TEACHER}>{t('roles.TEACHER')}</SelectItem>
                        {isGlobalAdmin && (
                          <SelectItem value={ROLE_COORDINATOR}>{t('roles.COORDINATOR')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>{t('name')}</Label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('email')}</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={closeInviteModal}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit">{t('createInvite')}</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{t('inviteLinkTitle')}</h2>
                  <p className="text-sm text-gray-600">{t('inviteLinkDescription')}</p>
                </div>

                {createdInvite && (
                  <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-800">{createdInvite.name}</p>
                    <p>{createdInvite.email}</p>
                    <p>
                      {createdInvite.schoolName} · {t(`roles.${createdInvite.role}`)}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={inviteLink} readOnly className="min-w-0" />
                  <Button type="button" variant="outline" onClick={() => copyInviteLink()}>
                    <Copy className="size-4" />
                    {t('copyInvite')}
                  </Button>
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={inviteAnother}>
                    {t('inviteAnother')}
                  </Button>
                  <Button type="button" onClick={closeInviteModal}>
                    {t('close')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{t('editTeacher')}</h2>
                <p className="text-sm text-gray-600">{t('editTeacherDescription')}</p>
              </div>

              <div className="space-y-1">
                <Label>{t('name')}</Label>
                <Input
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>{t('email')}</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  {tCommon('cancel')}
                </Button>
                <Button type="submit">{tCommon('save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('activeTeachers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-gray-700">{t('name')}</th>
                  <th className="p-4 text-left text-gray-700">{t('email')}</th>
                  <th className="p-4 text-left text-gray-700">{t('school')}</th>
                  <th className="p-4 text-left text-gray-700">{t('role')}</th>
                  <th className="p-4 text-left text-gray-700">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-700">{t('empty')}</td>
                  </tr>
                ) : users.map((managedUser) => managedUser.schools.map((school) => (
                  <tr key={`${managedUser.id}-${school.schoolId}`} className="border-t">
                    <td className="p-4">{managedUser.name}</td>
                    <td className="p-4">{managedUser.email}</td>
                    <td className="p-4">{school.schoolName}</td>
                    <td className="p-4">{t(`roles.${school.role}`)}</td>
                    <td className="flex gap-1 p-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(managedUser)}
                        title={t('editTeacher')}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingUnassign({ managedUser, schoolId: school.schoolId })}
                        title={t('unassign')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('pendingInvites')}</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-gray-600">{t('noPendingInvites')}</p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="space-y-2 border-b py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{invite.name} · {invite.email}</span>
                    <span className="text-gray-600">{invite.schoolName} · {t(`roles.${invite.role}`)}</span>
                  </div>
                  {invite.inviteLink ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input value={invite.inviteLink} readOnly className="min-w-0" />
                      <Button type="button" variant="outline" onClick={() => copyInviteLink(invite.inviteLink || '')}>
                        <Copy className="size-4" />
                        {t('copyInvite')}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">{t('inviteLinkUnavailable')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingUnassign} onOpenChange={(open) => !open && setPendingUnassign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{tCommon('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassign} className="bg-red-600 hover:bg-red-700">
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
