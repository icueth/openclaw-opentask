'use client'

import { ReactNode } from 'react'

interface NeonButtonProps {
  children: ReactNode
  variant?: 'cyan' | 'purple' | 'pink' | 'green' | 'yellow' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  icon?: ReactNode
}

export default function NeonButton({
  children,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  icon
}: NeonButtonProps) {
  const baseStyles = `
    relative overflow-hidden
    font-medium tracking-wide
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    group
  `

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  }

  const variantStyles = {
    cyan: `
      bg-gradient-to-r from-neon-cyan/10 to-neon-blue/10
      border border-neon-cyan/40
      text-neon-cyan
      hover:border-neon-cyan
      hover:shadow-neon-cyan
      hover:from-neon-cyan/20 hover:to-neon-blue/20
    `,
    purple: `
      bg-gradient-to-r from-neon-purple/10 to-neon-pink/10
      border border-neon-purple/40
      text-neon-purple
      hover:border-neon-purple
      hover:shadow-neon-purple
      hover:from-neon-purple/20 hover:to-neon-pink/20
    `,
    pink: `
      bg-gradient-to-r from-neon-pink/10 to-neon-purple/10
      border border-neon-pink/40
      text-neon-pink
      hover:border-neon-pink
      hover:shadow-neon-pink
      hover:from-neon-pink/20 hover:to-neon-purple/20
    `,
    green: `
      bg-gradient-to-r from-neon-green/10 to-neon-cyan/10
      border border-neon-green/40
      text-neon-green
      hover:border-neon-green
      hover:shadow-[0_0_20px_rgba(0,255,157,0.3)]
      hover:from-neon-green/20 hover:to-neon-cyan/20
    `,
    yellow: `
      bg-gradient-to-r from-neon-yellow/10 to-neon-yellow/5
      border border-neon-yellow/40
      text-neon-yellow
      hover:border-neon-yellow
      hover:shadow-[0_0_20px_rgba(255,238,0,0.3)]
      hover:from-neon-yellow/20 hover:to-neon-yellow/10
    `,
    outline: `
      bg-transparent
      border border-space-500
      text-gray-300
      hover:border-neon-cyan/50
      hover:text-neon-cyan
    `,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && icon}
        {children}
      </span>
    </button>
  )
}
