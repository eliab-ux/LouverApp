import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Entitlement = {
  igreja_id: string
  plano: 'free' | 'pro'
  limite_usuarios_ativos: number | null
  limite_musicas: number | null
  is_blocked: boolean
  updated_at: string
}

export function useEntitlement(igrejaId?: string | null) {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!igrejaId) {
      setEntitlement(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('igreja_entitlement')
        .select('igreja_id, plano, limite_usuarios_ativos, limite_musicas, is_blocked, updated_at')
        .eq('igreja_id', igrejaId)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      if (data) {
        setEntitlement(data as Entitlement)
        return
      }

      const { data: recalc, error: recalcError } = await supabase.rpc('entitlement_recalculate', {
        p_igreja_id: igrejaId,
      })

      if (recalcError) {
        setError(recalcError.message)
        return
      }

      setEntitlement(recalc as Entitlement)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [igrejaId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    entitlement,
    loading,
    error,
    refresh,
  }
}
