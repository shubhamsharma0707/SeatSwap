import React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => {
  return (
    <label
      className={`block text-sm font-medium mb-2 ml-2 ${className}`}
      style={{ color: '#ffffff' }}
      {...props}
    >
      {children}
    </label>
  )
}
