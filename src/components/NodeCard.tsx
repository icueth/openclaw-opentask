'use client'

import { Server, Wifi, WifiOff, Cpu } from 'lucide-react'
import GlassCard from './GlassCard'
import NeonBadge from './NeonBadge'

interface NodeCardProps {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  platform: string
  version: string
  lastSeen: string
}

export default function NodeCard({ name, ip, status, platform, version, lastSeen }: NodeCardProps) {
  const isOnline = status === 'online'

  return (
    <GlassCard 
      variant={isOnline ? 'cyan' : 'default'}
      className="p-4 group"
      hover={true}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            p-2.5 rounded-xl 
            ${isOnline 
              ? 'bg-neon-green/10 border border-neon-green/30 shadow-[0_0_15px_rgba(0,255,157,0.2)]' 
              : 'bg-space-700 border border-space-600'
            }
            transition-all duration-300
          `}>
            <Server className={`w-5 h-5 ${isOnline ? 'text-neon-green' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white font-mono tracking-wide">{name}</h3>
            <p className="text-sm text-gray-500 font-mono">{ip}</p>
          </div>
        </div>
        
        <NeonBadge 
          variant={isOnline ? 'green' : 'red'}
          size="sm"
          icon={isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          pulse={isOnline}
        >
          {status}
        </NeonBadge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-space-800/50 rounded-lg px-3 py-2 border border-space-600/50">
          <span className="text-gray-500 text-xs font-mono uppercase">Platform</span>
          <p className="text-gray-300 font-medium truncate">{platform}</p>
        </div>
        <div className="bg-space-800/50 rounded-lg px-3 py-2 border border-space-600/50">
          <span className="text-gray-500 text-xs font-mono uppercase">Version</span>
          <p className="text-gray-300 font-medium font-mono">{version}</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-space-600/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Cpu className="w-3 h-3" />
          <span className="font-mono">{lastSeen}</span>
        </div>
        {isOnline && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
            <span className="text-[10px] text-neon-green font-mono uppercase tracking-wider">Active</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
