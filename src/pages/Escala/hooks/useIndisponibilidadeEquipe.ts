import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase as defaultSupabase } from '../../../lib/supabase'
import type { InlineToastOptions } from '../../../lib/inlineToastTypes'
import type { Indisponibilidade } from '../../../types'

export type FiltrosEquipe = {
  membroId: string
  dataInicio: string
  dataFim: string
}

export default function useIndisponibilidadeEquipe(opts: {
  supabase?: typeof defaultSupabase
  igrejaId: string
  canViewEquipe: boolean
  showToast: (opts: InlineToastOptions) => void
}) {
  const supabase = opts.supabase ?? defaultSupabase
  const { igrejaId, canViewEquipe, showToast } = opts

  const [todasIndisponibilidades, setTodasIndisponibilidades] = useState<Indisponibilidade[]>([])
  const [loadingEquipe, setLoadingEquipe] = useState(false)
  const [equipeError, setEquipeError] = useState<string | null>(null)

  const [filtrosEquipe, setFiltrosEquipe] = useState<FiltrosEquipe>({
    membroId: 'todos',
    dataInicio: '',
    dataFim: '',
  })

  const carregarTodasIndisponibilidades = useCallback(async () => {
    if (!canViewEquipe) {
      setTodasIndisponibilidades([])
      setEquipeError(null)
      setLoadingEquipe(false)
      return
    }

    setLoadingEquipe(true)
    setEquipeError(null)

    try {
      const { data, error } = await supabase
        .from('indisponibilidades')
        .select('*')
        .eq('igreja_id', igrejaId)
        .gte('data', new Date().toISOString().split('T')[0])

      if (error) {
        setEquipeError(error.message)
        showToast({ message: error.message, color: 'danger' })
        setTodasIndisponibilidades([])
        return
      }

      setTodasIndisponibilidades((data as Indisponibilidade[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar indisponibilidades da equipe:', e)
      setEquipeError('Erro ao carregar indisponibilidades da equipe.')
      showToast({ message: 'Erro ao carregar indisponibilidades da equipe.', color: 'danger' })
      setTodasIndisponibilidades([])
    } finally {
      setLoadingEquipe(false)
    }
  }, [canViewEquipe, igrejaId, showToast, supabase])

  useEffect(() => {
    if (!canViewEquipe) {
      setTodasIndisponibilidades([])
      setEquipeError(null)
      setLoadingEquipe(false)
      return
    }

    void carregarTodasIndisponibilidades()
  }, [carregarTodasIndisponibilidades, canViewEquipe, igrejaId])

  const recarregar = carregarTodasIndisponibilidades

  const indisponibilidadesFiltradas = useMemo(() => {
    if (!canViewEquipe) return []

    return todasIndisponibilidades
      .filter((ind) => {
        if (filtrosEquipe.membroId !== 'todos' && ind.usuario_id !== filtrosEquipe.membroId) {
          return false
        }

        if (filtrosEquipe.dataInicio && ind.data < filtrosEquipe.dataInicio) {
          return false
        }

        if (filtrosEquipe.dataFim && ind.data > filtrosEquipe.dataFim) {
          return false
        }

        return true
      })
      .sort((a, b) => a.data.localeCompare(b.data))
  }, [filtrosEquipe.dataFim, filtrosEquipe.dataInicio, filtrosEquipe.membroId, canViewEquipe, todasIndisponibilidades])

  return {
    todasIndisponibilidades: canViewEquipe ? todasIndisponibilidades : [],
    indisponibilidadesFiltradas,

    loadingEquipe,
    equipeError,

    filtrosEquipe,
    setFiltrosEquipe,

    recarregar,
  }
}
