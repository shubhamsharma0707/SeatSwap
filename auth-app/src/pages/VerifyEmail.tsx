import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { apiPost } from '@/lib/api'

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [message, setMessage] = useState('Verifying your email…')
  const [isSuccess, setIsSuccess] = useState(false)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    if (!token) {
      setMessage('This verification link is incomplete.')
      return
    }
    apiPost<{ message: string }>('/api/v1/auth/email-verification/confirm', { token })
      .then((result) => {
        setMessage(result.message)
        setIsSuccess(true)
      })
      .catch((error: Error) => setMessage(error.message))
  }, [token])

  return (
    <AuthLayout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="mb-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>Email verification</h1>
        <p role="status" className="mb-8">{message}</p>
        {isSuccess && <Link className="text-sm underline" to="/login">Continue to sign in</Link>}
      </div>
    </AuthLayout>
  )
}

export default VerifyEmail
