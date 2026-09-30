import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/60 z-[1]" />

      {/* Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <a
          href="/index.html"
          className="text-3xl tracking-tight text-foreground"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          SeatSwap<sup className="text-xs">®</sup>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="/index.html" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </a>
          <a href="/dashboard.html" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Browse Seats
          </a>
          <a href="/index.html#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
