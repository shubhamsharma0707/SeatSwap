import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
}

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
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

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      console.log('Reset password for:', formData.email)
    }, 1500)
  }

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center px-6 py-12 min-h-[calc(100vh-120px)]">
          <div className="w-full max-w-md">
            {/* Success Header */}
            <div className="text-center mb-12 animate-fade-rise">
              <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8"
                  style={{ color: '#ffffff' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1
                className="text-5xl md:text-6xl leading-[0.95] tracking-[-2.46px] mb-4"
                style={{ fontFamily: "'Instrument Serif', serif", color: '#ffffff' }}
              >
                Check your <em className="not-italic" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>inbox</em>
              </h1>
              <p className="text-base mt-6 max-w-md mx-auto" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                We've sent a password reset link to <span style={{ color: '#ffffff' }}>{formData.email}</span>.
                Please check your email and follow the instructions.
              </p>
            </div>

            {/* Info Card */}
            <div className="liquid-glass rounded-3xl p-8 animate-fade-rise-delay">
              <div className="space-y-4 text-center">
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Didn't receive the email? Check your spam folder or request a new one.
                </p>

                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Resend Email
                </Button>

                <Link
                  to="/login"
                  className="block text-sm transition-colors mt-4 hover:opacity-70"
                  style={{ color: '#ffffff' }}
                >
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs mt-8 animate-fade-rise-delay-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              The link will expire in 1 hour for security reasons
            </p>
          </div>
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
              Reset your <em className="not-italic" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>password</em>
            </h1>
            <p className="text-base mt-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form Card */}
          <div className="liquid-glass rounded-3xl p-8 animate-fade-rise-delay">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoComplete="email"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-muted/30" style={{ color: '#ffffff' }}>
                    Remember your password?
                  </span>
                </div>
              </div>

              {/* Back to Login Link */}
              <Link
                to="/login"
                className="block text-center text-sm transition-colors hover:opacity-70"
                style={{ color: '#ffffff' }}
              >
                Back to Sign In
              </Link>
            </form>
          </div>

          {/* Security Note */}
          <p className="text-center text-xs mt-8 animate-fade-rise-delay-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            For security, we'll never confirm if an email is registered
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword
