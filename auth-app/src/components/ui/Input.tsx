import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`
            w-full px-6 py-4 rounded-xl
            bg-muted/50 border-2 border-input
            focus:outline-none focus:ring-2 focus:ring-foreground/30 focus:border-foreground/50
            transition-all duration-200
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
          style={{ color: '#ffffff', ...style }}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-sm mt-2 ml-2">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
