'use client'

import { ReactNode } from 'react'

interface NeonBadgeProps {
  children: ReactNode
  variant?: 'cyan' | 'purple' | 'pink' | 'green' | 'yellow' | 'red' | 'default'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  pulse?: boolean
  className?: string
  icon?: ReactNode
}

export default function NeonBadge({
  children,
  variant = 'default',
  size = 'md',
  glow = true,
  pulse = false,
  className = '',
  icon
}: NeonBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const variantStyles = {
    cyan: {
      bg: 'bg-neon-cyan/10',
      text: 'text-neon-cyan',
      border: 'border-neon-cyan/30',
      glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)]',
    },
    purple: {
      bg: 'bg-neon-purple/10',
      text: 'text-neon-purple',
      border: 'border-neon-purple/30',
      glow: 'shadow-[0_0_10px_rgba(184,41,247,0.2)]',
    },
    pink: {
      bg: 'bg-neon-pink/10',
      text: 'text-neon-pink',
      border: 'border-neon-pink/30',
      glow: 'shadow-[0_0_10px_rgba(255,0,128,0.2)]',
    },
    green: {
      bg: 'bg-neon-green/10',
      text: 'text-neon-green',
      border: 'border-neon-green/30',
      glow: 'shadow-[0_0_10px_rgba(0,255,157,0.2)]',
    },
    yellow: {
      bg: 'bg-neon-yellow/10',
      text: 'text-neon-yellow',
      border: 'border-neon-yellow/30',
      glow: 'shadow-[0_0_10px_rgba(255,238,0,0.2)]',
    },
    red: {
      bg: 'bg-neon-red/10',
      text: 'text-neon-red',
      border: 'border-neon-red/30',
      glow: 'shadow-[0_0_10px_rgba(255,51,51,0.2)]',
    },
    default: {
      bg: 'bg-space-600',
      text: 'text-gray-400',
      border: 'border-space-500',
      glow: '',
    },
  }

  const styles = variantStyles[variant]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-mono uppercase tracking-wider
        border ${styles.bg} ${styles.text} ${styles.border}
        ${sizeStyles[size]}
        ${glow && styles.glow ? styles.glow : ''}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
