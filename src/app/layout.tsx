import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ensureServicesStarted } from '@/lib/startup'

// Ensure background services start when the server starts
ensureServicesStarted()

export const metadata: Metadata = {
  title: 'OpenClaw Dashboard 2077',
  description: 'Futuristic AI Agent Management Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-space-black text-gray-200 overflow-x-hidden min-h-screen">
        {/* Sci-fi Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Radial gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(0, 240, 255, 0.05) 0%, transparent 50%)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at bottom right, rgba(184, 41, 247, 0.05) 0%, transparent 50%)'
            }}
          />
        </div>
        
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
