import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiPost } from '@/lib/api'

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await apiPost('/api/v1/auth/signup', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })
      localStorage.removeItem('seatswap_auth_token')
      localStorage.removeItem('seatswap_user_data')
      sessionStorage.removeItem('seatswap_redirect_after_login')
      setSubmitted(true)
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : 'Account creation failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async () => {
    setNotice('')
    try {
      const result = await apiPost<{ message: string }>('/api/v1/auth/email-verification', { email: formData.email })
      setNotice(result.message)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Email delivery is temporarily unavailable.')
    }
  }

  if (submitted) {
    return (
      <AuthLayout>
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center text-white">
          <h1 className="mb-4 text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>Check your inbox</h1>
          <p className="mb-3">If the address is eligible, a verification link has been sent to <strong>{formData.email}</strong>.</p>
          <p role="status" className="mb-6 text-sm">{notice}</p>
          <button type="button" className="mb-6 text-sm underline" onClick={resendVerification}>Resend verification email</button>
          <Link className="text-sm underline" to="/login">Back to sign in</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="flex items-center justify-center px-6 py-12 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-rise">
            <h1
              className="text-5xl md:text-6xl leading-[0.95] tracking-[-2.46px] mb-4"
              style={{ fontFamily: "'Instrument Serif', serif", color: '#ffffff' }}
            >
              Begin your <em className="not-italic" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>journey</em>
            </h1>
            <p className="text-base mt-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Create an account to access exclusive SaaS seats
            </p>
          </div>

          {/* Form Card */}
          <div className="liquid-glass rounded-3xl p-8 animate-fade-rise-delay">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 12 characters"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-muted/30" style={{ color: '#ffffff' }}>
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                className="block text-center text-sm transition-colors hover:opacity-70"
                style={{ color: '#ffffff' }}
              >
                Sign in instead
              </Link>
            </form>
          </div>

          {/* Terms */}
          <p className="text-center text-xs mt-8 animate-fade-rise-delay-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            By creating an account, you agree to our{' '}
            <a href="#" className="hover:underline" style={{ color: '#ffffff' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="hover:underline" style={{ color: '#ffffff' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default SignUp
