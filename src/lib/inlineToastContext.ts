import { createContext, useContext } from 'react'
import type { InlineToastOptions } from './inlineToastTypes'

type InlineToastContextValue = {
  showToast: (opts: InlineToastOptions) => void
}

export const InlineToastContext = createContext<InlineToastContextValue | null>(null)

export function useInlineToast() {
  const ctx = useContext(InlineToastContext)
  if (!ctx) {
    throw new Error('useInlineToast must be used within an InlineToastProvider')
  }
  return ctx
}
