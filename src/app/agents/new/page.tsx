'use client'

import { Suspense } from 'react'
import NewAgentPageContent from './NewAgentPageContent'

export default function NewAgentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    }>
      <NewAgentPageContent />
    </Suspense>
  )
}