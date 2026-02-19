'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Settings,
  Cpu, Sparkles, FolderKanban
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Cpu },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 
      bg-gradient-to-b from-space-800/95 to-space-900/95
      backdrop-blur-xl
      border-r border-neon-cyan/10
      flex flex-col">
      
      {/* Logo Section */}
      <div className="flex items-center gap-3 h-16 px-6 
        border-b border-neon-cyan/10
        bg-gradient-to-r from-space-800/50 to-transparent">
        <div className="relative w-10 h-10 
          bg-gradient-to-br from-neon-cyan to-neon-purple 
          rounded-xl 
          flex items-center justify-center
          shadow-[0_0_20px_rgba(0,240,255,0.3)]
          animate-pulse-glow">
          <Sparkles className="w-5 h-5 text-white" />
          {/* Corner accents */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight">
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Open
            </span>
            <span className="text-white">Claw</span>
          </span>
          <div className="text-[10px] text-neon-cyan/60 font-mono tracking-widest uppercase">
            Dashboard 2077
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-300 ease-out
                ${isActive 
                  ? 'bg-gradient-to-r from-neon-cyan/10 to-transparent text-neon-cyan border-l-2 border-neon-cyan shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]' 
                  : 'text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/5'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className={`
                w-5 h-5 transition-all duration-300
                ${isActive ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'group-hover:text-neon-cyan'}
              `} />
              <span className="font-medium tracking-wide">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-neon-cyan/10">
        <div className="glass-card rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-neon-green animate-ping opacity-50" />
            </div>
            <span className="text-neon-green font-mono uppercase tracking-wider">Gateway Online</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>SYS.VER</span>
            <span className="text-neon-cyan/70">v2077.2.14</span>
          </div>
          <div className="h-1 bg-space-900 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-neon-cyan to-neon-purple animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  )
}
