import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiGet, apiPatch } from '@/lib/api'

interface ProfileData {
  id: string
  email: string
  fullName: string
}

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('Loading your account…')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    apiGet<{ user: ProfileData }>('/api/v1/account/me')
      .then(({ user }) => {
        setProfile(user)
        setFullName(user.fullName)
        setMessage('')
      })
      .catch((error: Error) => {
        if ('status' in error && error.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setMessage(error.message)
      })
  }, [navigate])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    try {
      const result = await apiPatch<{ user: ProfileData }>('/api/v1/account/me', { fullName })
      setProfile(result.user)
      setFullName(result.user.fullName)
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 text-white">
        <h1 className="mb-8 text-center text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>Your account</h1>
        {profile ? (
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <Label htmlFor="profileName">Full name</Label>
              <Input id="profileName" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={120} required disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="profileEmail">Email address</Label>
              <Input id="profileEmail" value={profile.email} disabled readOnly />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving || fullName.trim() === profile.fullName}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
          </form>
        ) : <p role="status" className="text-center">{message}</p>}
        {message && profile && <p role="status" className="mt-4 text-center text-sm">{message}</p>}
        <a className="mt-8 text-center text-sm underline" href="/dashboard.html">Back to dashboard</a>
      </div>
    </AuthLayout>
  )
}

export default Profile
