import React from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-shell relative min-h-dvh w-full overflow-hidden">
      <nav className="auth-shell__nav relative z-10 flex justify-between items-center px-6 md:px-8 py-5 max-w-7xl mx-auto">
        <a
          href="/index.html"
          className="ss-brand-link"
          aria-label="SeatSwap home"
        >
          SeatSwap
        </a>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/profile" className="text-sm transition-colors hover:opacity-70" style={{ color: '#ffffff' }}>
            Account
          </Link>
          <a href="/index.html" className="text-sm transition-colors hover:opacity-70" style={{ color: '#ffffff' }}>
            Home
          </a>
          <a href="/dashboard.html" className="text-sm transition-colors hover:opacity-70" style={{ color: '#ffffff' }}>
            Browse Seats
          </a>
          <a href="/index.html#how" className="text-sm transition-colors hover:opacity-70" style={{ color: '#ffffff' }}>
            How it Works
          </a>
        </div>
      </nav>

      {import.meta.env.MODE === 'preview' && (
        <div role="status" className="relative z-10 mx-auto max-w-3xl px-6 pb-4 text-center text-sm text-white/90">
          Frontend preview only. Account features are not connected yet.
        </div>
      )}

      <main className="auth-shell__main relative z-10">
        {children}
      </main>
    </div>
  )
}

export default AuthLayout
