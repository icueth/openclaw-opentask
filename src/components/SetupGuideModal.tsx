'use client'

import { useState, useCallback } from 'react'
import { 
  X, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  BookOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import NeonButton from './NeonButton'

interface SetupGuideModalProps {
  isOpen: boolean
  onClose: () => void
  callbackUrl: string
}

export default function SetupGuideModal({ isOpen, onClose, callbackUrl }: SetupGuideModalProps) {
  const [copied, setCopied] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const copyCallbackUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [callbackUrl])

  if (!isOpen) return null

  const steps = [
    {
      number: 1,
      title: 'Create OAuth App',
      content: (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-xs font-mono">1</span>
              <span>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline inline-flex items-center gap-1">github.com/settings/developers <ExternalLink className="w-3 h-3" /></a></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-xs font-mono">2</span>
              <span>Click <strong className="text-white">"New OAuth App"</strong> or <strong className="text-white">"Register a new application"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-xs font-mono">3</span>
              <span>Fill in the form with the following details:</span>
            </li>
          </ol>
          
          <div className="bg-space-900/50 rounded-lg p-4 space-y-3 font-mono text-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Application name</label>
              <div className="text-neon-cyan">OpenClaw Dashboard</div>
              <p className="text-xs text-gray-600 mt-1">(or any name you prefer)</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Homepage URL</label>
              <div className="text-neon-cyan">{callbackUrl.replace('/api/auth/github/callback', '')}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Authorization callback URL</label>
              <div className="flex items-center gap-2">
                <code className="text-neon-cyan text-xs break-all">{callbackUrl}</code>
                <button
                  onClick={copyCallbackUrl}
                  className="p-1.5 rounded hover:bg-neon-cyan/10 text-gray-400 hover:text-neon-cyan transition-colors"
                  title="Copy callback URL"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-sm">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-xs font-mono">4</span>
            <span>Click <strong className="text-white">"Register application"</strong></span>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'Copy Credentials',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">After registering your app:</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <Copy className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">Copy the <strong className="text-white">"Client ID"</strong> - it looks like: <code className="text-neon-cyan text-xs">Iv23lixxxxxxxxxxxxxx</code></span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Copy className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">Click <strong className="text-white">"Generate a new client secret"</strong></span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-neon-yellow flex-shrink-0 mt-0.5" />
              <span className="text-gray-300"><strong className="text-neon-yellow">Important:</strong> Copy the secret immediately - you won't be able to see it again!</span>
            </li>
          </ul>
          
          <div className="bg-neon-yellow/5 border border-neon-yellow/20 rounded-lg p-3">
            <p className="text-xs text-neon-yellow/80 font-mono">
              ⚠️ Keep your client secret secure. Never share it or commit it to git.
            </p>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'Paste in Settings',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Return to this settings page and:</p>
          <ol className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-xs font-mono">1</span>
              <span className="text-gray-300">Paste the <strong className="text-white">Client ID</strong> into the Client ID field</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-xs font-mono">2</span>
              <span className="text-gray-300">Paste the <strong className="text-white">Client Secret</strong> into the Client Secret field</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-xs font-mono">3</span>
              <span className="text-gray-300">Click <strong className="text-neon-cyan">"Save App Credentials"</strong></span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-xs font-mono">4</span>
              <span className="text-gray-300">Click <strong className="text-neon-cyan">"Test App Config"</strong> to verify</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-xs font-mono">5</span>
              <span className="text-gray-300">Click <strong className="text-neon-green">"Connect GitHub Account"</strong></span>
            </li>
          </ol>
          
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-3">
            <p className="text-xs text-neon-cyan/80 font-mono">
              💡 Your credentials will be encrypted with AES-256-GCM and stored securely in your system keychain (macOS) or encrypted file.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-space-800 border border-neon-cyan/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">How to Setup GitHub OAuth</h2>
              <p className="text-xs text-gray-500 font-mono">Step-by-step guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neon-pink/10 text-gray-400 hover:text-neon-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center px-5 py-3 bg-space-900/50 border-b border-space-600/50">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono transition-all
                  ${currentStep === step.number 
                    ? 'bg-neon-cyan text-space-900 font-bold' 
                    : currentStep > step.number 
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-space-700 text-gray-500'
                  }
                `}
              >
                {currentStep > step.number ? <CheckCircle className="w-4 h-4" /> : step.number}
              </button>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-1
                  ${currentStep > step.number ? 'bg-neon-green/30' : 'bg-space-700'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4">
            <span className="text-xs text-neon-cyan font-mono">STEP {currentStep} OF 3</span>
            <h3 className="text-xl font-semibold text-white mt-1">{steps[currentStep - 1].title}</h3>
          </div>
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {steps[currentStep - 1].content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-space-600/50 bg-space-900/50">
          <button
            onClick={copyCallbackUrl}
            className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-gray-400 hover:text-neon-cyan transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Callback URL'}
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <NeonButton
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
              >
                Back
              </NeonButton>
            )}
            {currentStep < steps.length ? (
              <NeonButton
                variant="cyan"
                onClick={() => setCurrentStep(s => s + 1)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next
              </NeonButton>
            ) : (
              <NeonButton
                variant="green"
                onClick={onClose}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Got it!
              </NeonButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
