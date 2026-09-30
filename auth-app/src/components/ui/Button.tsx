import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'glass'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-full transition-all duration-300 font-medium'

  const variantClasses = {
    default: 'bg-foreground text-primary-foreground hover:scale-[1.03] px-14 py-5 text-base',
    glass: 'liquid-glass hover:scale-[1.03] px-6 py-2.5 text-sm text-foreground'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
