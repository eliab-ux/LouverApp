import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { IonToast } from '@ionic/react'

import type { InlineToastColor, InlineToastOptions } from './inlineToastTypes'
import { InlineToastContext } from './inlineToastContext'

type InlineToastState = {
  isOpen: boolean
  message: string
  duration: number
  color: InlineToastColor
}

export function InlineToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InlineToastState>({
    isOpen: false,
    message: '',
    duration: 4500,
    color: 'medium',
  })

  const showToast = useCallback((opts: InlineToastOptions) => {
    setState({
      isOpen: true,
      message: opts.message,
      duration: opts.duration ?? 4500,
      color: opts.color ?? 'medium',
    })
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <InlineToastContext.Provider value={value}>
      {children}
      <IonToast
        isOpen={state.isOpen}
        message={state.message}
        duration={state.duration}
        color={state.color}
        position="top"
        onDidDismiss={() => setState((prev) => ({ ...prev, isOpen: false }))}
      />
    </InlineToastContext.Provider>
  )
}
