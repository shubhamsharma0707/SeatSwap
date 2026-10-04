import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiPost } from '@/lib/api'

const ResetPasswordConfirm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 12) {
      setError('Use at least 12 characters.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await apiPost<{ message: string }>('/api/v1/auth/password-reset/confirm', { token, password })
      setIsComplete(true)
      setError(result.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The password could not be updated.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 text-white">
        {!token ? (
          <div className="text-center">
            <h1 className="mb-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>Reset link missing</h1>
            <p className="mb-6">Request a new password reset link to continue.</p>
            <Link className="underline" to="/reset-password">Request another link</Link>
          </div>
        ) : <>
        <h1 className="mb-8 text-center text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {isComplete ? 'Password updated' : 'Choose a new password'}
        </h1>
        {isComplete ? <p role="status" className="text-center">{error}<br /><Link className="mt-6 inline-block underline" to="/login">Sign in</Link></p> : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={error || undefined} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !token}>{isLoading ? 'Updating…' : 'Update password'}</Button>
          </form>
        )}
        </>}
      </div>
    </AuthLayout>
  )
}

export default ResetPasswordConfirm
