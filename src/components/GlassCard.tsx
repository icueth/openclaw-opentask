'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'cyan' | 'purple' | 'pink' | 'green' | 'yellow'
  hover?: boolean
  cornerAccent?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  cornerAccent = false,
  onClick,
  style
}: GlassCardProps) {
  const variantStyles = {
    default: 'border-neon-cyan/15 hover:border-neon-cyan/40',
    cyan: 'border-neon-cyan/30 hover:border-neon-cyan/60 shadow-[0_0_20px_rgba(0,240,255,0.1)]',
    purple: 'border-neon-purple/30 hover:border-neon-purple/60 shadow-[0_0_20px_rgba(184,41,247,0.1)]',
    pink: 'border-neon-pink/30 hover:border-neon-pink/60 shadow-[0_0_20px_rgba(255,0,128,0.1)]',
    green: 'border-neon-green/30 hover:border-neon-green/60 shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    yellow: 'border-yellow-400/30 hover:border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.1)]',
  }

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-space-800/80 to-space-900/90
        backdrop-blur-xl
        border ${variantStyles[variant]}
        shadow-card
        transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${cornerAccent ? 'corner-accent' : ''}
        ${className}
      `}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      
      {/* Subtle inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
      
      {children}
    </div>
  )
}
