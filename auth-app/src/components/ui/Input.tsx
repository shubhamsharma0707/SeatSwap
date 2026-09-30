import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`
            w-full px-6 py-4 rounded-xl
            bg-muted/30 border border-input
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-foreground/20
            transition-all duration-200
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
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
