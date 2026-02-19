'use client'

import { ReactNode } from 'react'

interface HolographicTextProps {
  children: ReactNode
  variant?: 'cyan' | 'purple' | 'pink' | 'multi'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  animated?: boolean
  glow?: boolean
}

export default function HolographicText({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
  animated = true,
  glow = true
}: HolographicTextProps) {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
  }

  const variantStyles = {
    cyan: 'from-neon-cyan to-neon-blue',
    purple: 'from-neon-purple to-neon-pink',
    pink: 'from-neon-pink to-neon-purple',
    multi: 'from-neon-cyan via-neon-purple to-neon-pink',
  }

  const glowStyles = {
    cyan: 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]',
    purple: 'drop-shadow-[0_0_8px_rgba(184,41,247,0.5)]',
    pink: 'drop-shadow-[0_0_8px_rgba(255,0,128,0.5)]',
    multi: 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]',
  }

  return (
    <span
      className={`
        inline-block
        font-bold
        bg-gradient-to-r ${variantStyles[variant]}
        bg-clip-text text-transparent
        ${animated ? 'bg-[length:200%_auto] animate-shimmer' : ''}
        ${glow ? glowStyles[variant] : ''}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
