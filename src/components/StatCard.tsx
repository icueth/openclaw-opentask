'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'cyan' | 'green' | 'purple' | 'pink' | 'blue' | 'yellow'
  glow?: boolean
}

const colorStyles = {
  cyan: {
    gradient: 'from-neon-cyan/20 to-neon-cyan/5',
    border: 'border-neon-cyan/30',
    iconBg: 'bg-neon-cyan/10',
    iconColor: 'text-neon-cyan',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
  },
  blue: {
    gradient: 'from-neon-blue/20 to-neon-blue/5',
    border: 'border-neon-blue/30',
    iconBg: 'bg-neon-blue/10',
    iconColor: 'text-neon-blue',
    glow: 'shadow-[0_0_20px_rgba(0,128,255,0.15)]',
  },
  green: {
    gradient: 'from-neon-green/20 to-neon-green/5',
    border: 'border-neon-green/30',
    iconBg: 'bg-neon-green/10',
    iconColor: 'text-neon-green',
    glow: 'shadow-[0_0_20px_rgba(0,255,157,0.15)]',
  },
  purple: {
    gradient: 'from-neon-purple/20 to-neon-purple/5',
    border: 'border-neon-purple/30',
    iconBg: 'bg-neon-purple/10',
    iconColor: 'text-neon-purple',
    glow: 'shadow-[0_0_20px_rgba(184,41,247,0.15)]',
  },
  pink: {
    gradient: 'from-neon-pink/20 to-neon-pink/5',
    border: 'border-neon-pink/30',
    iconBg: 'bg-neon-pink/10',
    iconColor: 'text-neon-pink',
    glow: 'shadow-[0_0_20px_rgba(255,0,128,0.15)]',
  },
  yellow: {
    gradient: 'from-neon-yellow/20 to-neon-yellow/5',
    border: 'border-neon-yellow/30',
    iconBg: 'bg-neon-yellow/10',
    iconColor: 'text-neon-yellow',
    glow: 'shadow-[0_0_20px_rgba(255,238,0,0.15)]',
  },
}

export default function StatCard({ title, value, icon, trend, color = 'cyan', glow = true }: StatCardProps) {
  const styles = colorStyles[color]

  return (
    <div className={`
      relative overflow-hidden rounded-xl 
      bg-gradient-to-br ${styles.gradient} 
      border ${styles.border} 
      p-6 
      transition-all duration-300
      hover:border-opacity-60
      ${glow ? styles.glow : ''}
      group
    `}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color === 'blue' ? 'neon-blue' : `neon-${color}`} to-transparent opacity-50`} />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1 font-mono uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white font-mono tracking-tight">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 font-mono ${trend.isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`
          p-3 rounded-xl 
          ${styles.iconBg} ${styles.iconColor}
          border border-${color === 'blue' ? 'neon-blue' : `neon-${color}`}/30
          shadow-[0_0_15px_rgba(0,0,0,0.3)]
          group-hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]
          transition-all duration-300
        `}>
          {icon}
        </div>
      </div>
      
      {/* Bottom corner accent */}
      <div className="absolute bottom-0 right-0 w-12 h-12 overflow-hidden">
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-r border-b ${styles.border} opacity-30 rounded-br-xl`} />
      </div>
    </div>
  )
}
