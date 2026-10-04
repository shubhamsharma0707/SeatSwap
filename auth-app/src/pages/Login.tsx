import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiPost, getSafeRedirectPath } from '@/lib/api'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      await apiPost('/api/v1/auth/login', { email: formData.email, password: formData.password, rememberMe })
      localStorage.removeItem('seatswap_auth_token')
      localStorage.removeItem('seatswap_user_data')
      window.location.href = getSafeRedirectPath()
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : 'Sign in failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
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
              Welcome <em className="not-italic" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>back</em>
            </h1>
            <p className="text-base mt-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Sign in to access your account
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

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-input bg-muted/30 text-foreground focus:ring-2 focus:ring-foreground/20"
                    disabled={isLoading}
                  />
                  <span className="text-sm" style={{ color: '#ffffff' }}>Remember me</span>
                </label>

                <Link
                  to="/reset-password"
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: '#ffffff' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-muted/30" style={{ color: '#ffffff' }}>
                    Don't have an account?
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link
                to="/signup"
                className="block text-center text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: '#ffffff' }}
              >
                Create an account
              </Link>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-8 animate-fade-rise-delay-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Login
