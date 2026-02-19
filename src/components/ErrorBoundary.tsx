'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <GlassCard variant="pink" className="max-w-lg w-full p-8 text-center" cornerAccent>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-red/20 border border-neon-red/50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-neon-red" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              An error occurred while rendering this page. Please try refreshing.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-space-800/50 rounded-lg border border-neon-red/20 text-left">
                <code className="text-sm text-neon-red/80 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <NeonButton
              variant="cyan"
              onClick={this.handleReset}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </NeonButton>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
