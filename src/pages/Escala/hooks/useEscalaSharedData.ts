import { useCallback, useEffect, useState } from 'react'
import { supabase as defaultSupabase } from '../../../lib/supabase'
import type { InlineToastOptions } from '../../../lib/inlineToastTypes'
import type { Usuario } from '../../../types'

export default function useEscalaSharedData(opts: {
  supabase?: typeof defaultSupabase
  igrejaId: string
  showToast: (opts: InlineToastOptions) => void
}) {
  const supabase = opts.supabase ?? defaultSupabase
  const { igrejaId, showToast } = opts

  const [membros, setMembros] = useState<Usuario[]>([])
  const [loadingShared, setLoadingShared] = useState(false)
  const [sharedError, setSharedError] = useState<string | null>(null)

  const carregarMembros = useCallback(async () => {
    setLoadingShared(true)
    setSharedError(null)

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, papel, funcoes')
        .eq('igreja_id', igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        setSharedError(error.message)
        showToast({ message: error.message, color: 'danger' })
        setMembros([])
        return
      }

      setMembros((data as Usuario[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar membros:', e)
      setSharedError('Erro ao carregar membros.')
      showToast({ message: 'Erro ao carregar membros.', color: 'danger' })
      setMembros([])
    } finally {
      setLoadingShared(false)
    }
  }, [igrejaId, showToast, supabase])

  useEffect(() => {
    void carregarMembros()
  }, [carregarMembros])

  return {
    membros,
    loadingShared,
    sharedError,
    recarregarMembros: carregarMembros,
  }
}
