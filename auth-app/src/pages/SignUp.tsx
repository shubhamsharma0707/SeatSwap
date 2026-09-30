import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
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

    // Simulate API call - Replace this with real API call
    setTimeout(() => {
      setIsLoading(false)
      console.log('Sign up data:', formData)

      // Save authentication data (auto-login after signup)
      const mockToken = 'mock_jwt_token_' + Date.now()
      const userData = {
        email: formData.email,
        fullName: formData.fullName,
        id: 'user_' + Date.now()
      }

      localStorage.setItem('seatswap_auth_token', mockToken)
      localStorage.setItem('seatswap_user_data', JSON.stringify(userData))

      // Redirect to dashboard after successful signup
      const redirectPath = sessionStorage.getItem('seatswap_redirect_after_login')
      if (redirectPath) {
        sessionStorage.removeItem('seatswap_redirect_after_login')
        window.location.href = redirectPath.startsWith('/') ? redirectPath : '/' + redirectPath
      } else {
        window.location.href = '/dashboard.html'
      }
    }, 1500)
  }

  return (
    <AuthLayout>
      <div className="flex items-center justify-center px-6 py-12 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-rise">
            <h1
              className="text-5xl md:text-6xl leading-[0.95] tracking-[-2.46px] mb-4"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Begin your <em className="not-italic text-muted-foreground">journey</em>
            </h1>
            <p className="text-muted-foreground text-base mt-6">
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
                  placeholder="Min. 8 characters"
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
                  <span className="px-4 bg-muted/30 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                className="block text-center text-sm text-foreground hover:text-muted-foreground transition-colors"
              >
                Sign in instead
              </Link>
            </form>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-rise-delay-2">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-foreground hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-foreground hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default SignUp
