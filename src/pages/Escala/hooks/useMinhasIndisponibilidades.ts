import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase as defaultSupabase } from '../../../lib/supabase'
import type { InlineToastOptions } from '../../../lib/inlineToastTypes'
import type { AppUser, Evento, Escala as EscalaType, Escalado, Indisponibilidade } from '../../../types'

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export type IndisponibilidadeValidationContext = {
  eventos: Evento[]
  escalas: EscalaType[]
  escalados: Escalado[]
  nomeTipoEvento: (evento: Evento) => string
}

function assertPodeMarcarIndisp(opts: {
  userId: string
  dataInicio: string
  dataFim: string
  validationCtx: IndisponibilidadeValidationContext
}): { ok: true } | { ok: false; message: string } {
  const { userId, dataInicio, dataFim, validationCtx } = opts

  const eventosNasDatas = (validationCtx.eventos ?? []).filter((ev) => ev.data >= dataInicio && ev.data <= dataFim)

  for (const evento of eventosNasDatas) {
    const escala = (validationCtx.escalas ?? []).find((e) => e.evento_id === evento.id)
    if (!escala) continue

    const escalado = (validationCtx.escalados ?? []).find(
      (esc) => esc.escala_id === escala.id && esc.usuario_id === userId,
    )
    if (!escalado) continue

    const dataEvento = new Date(evento.data + 'T00:00:00').toLocaleDateString('pt-BR')
    return {
      ok: false,
      message: `Você está escalado para ${validationCtx.nomeTipoEvento(evento)} de ${dataEvento}. Não é possível marcar indisponibilidade.`,
    }
  }

  return { ok: true }
}

export default function useMinhasIndisponibilidades(opts: {
  user: AppUser
  supabase?: typeof defaultSupabase
  showToast: (opts: InlineToastOptions) => void
  abrirConfirmacao: (opts: {
    title: string
    message: string
    actionLabel?: string
    onConfirm: () => Promise<void>
  }) => void
  validationCtx?: IndisponibilidadeValidationContext
}) {
  const { user, showToast, abrirConfirmacao } = opts
  const supabase = opts.supabase ?? defaultSupabase

  const validationCtx = useMemo<IndisponibilidadeValidationContext>(() => {
    return (
      opts.validationCtx ?? {
        eventos: [],
        escalas: [],
        escalados: [],
        nomeTipoEvento: () => 'Tipo',
      }
    )
  }, [opts.validationCtx])

  const [indisponibilidades, setIndisponibilidades] = useState<Indisponibilidade[]>([])
  const [indisponibilidadeError, setIndisponibilidadeError] = useState<string | null>(null)
  const [savingIndisponibilidade, setSavingIndisponibilidade] = useState(false)

  const [novaIndispData, setNovaIndispData] = useState('')
  const [novaIndispDataFim, setNovaIndispDataFim] = useState('')
  const [novaIndispMotivo, setNovaIndispMotivo] = useState('')
  const [marcarPeriodo, setMarcarPeriodo] = useState(false)

  const carregarIndisponibilidades = useCallback(async () => {
    try {
      setIndisponibilidadeError(null)
      const { data, error } = await supabase
        .from('indisponibilidades')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })

      if (error) {
        setIndisponibilidadeError(error.message)
        return
      }

      setIndisponibilidades((data as Indisponibilidade[]) ?? [])
    } catch (e) {
      console.error(e)
      setIndisponibilidadeError('Erro ao carregar indisponibilidades.')
    }
  }, [supabase, user.id])

  useEffect(() => {
    void carregarIndisponibilidades()
  }, [carregarIndisponibilidades])

  const criarIndisponibilidade = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      if (!novaIndispData) {
        setIndisponibilidadeError('Por favor, selecione uma data.')
        return
      }

      const hoje = new Date().toISOString().split('T')[0]
      if (novaIndispData < hoje) {
        setIndisponibilidadeError('Só é possível marcar indisponibilidades para datas futuras.')
        return
      }

      if (marcarPeriodo) {
        if (!novaIndispDataFim) {
          setIndisponibilidadeError('Por favor, selecione a data final do período.')
          return
        }
        if (novaIndispDataFim < novaIndispData) {
          setIndisponibilidadeError('A data final deve ser igual ou posterior à data inicial.')
          return
        }
        if (novaIndispDataFim < hoje) {
          setIndisponibilidadeError('A data final deve ser futura.')
          return
        }
      }

      const dataInicio = novaIndispData
      const dataFim = marcarPeriodo ? novaIndispDataFim : novaIndispData

      const validation = assertPodeMarcarIndisp({
        userId: user.id,
        dataInicio,
        dataFim,
        validationCtx,
      })

      if (!validation.ok) {
        setIndisponibilidadeError(validation.message)
        return
      }

      setSavingIndisponibilidade(true)
      setIndisponibilidadeError(null)

      try {
        const { error } = await supabase.from('indisponibilidades').insert({
          usuario_id: user.id,
          igreja_id: user.igrejaId,
          data: novaIndispData,
          data_fim: marcarPeriodo ? novaIndispDataFim : null,
          motivo: novaIndispMotivo.trim() || null,
        })

        if (error) {
          if (getErrorCode(error) === '23505') {
            setIndisponibilidadeError('Você já marcou indisponibilidade para esta data.')
          } else {
            setIndisponibilidadeError(error.message)
          }
          return
        }

        setNovaIndispData('')
        setNovaIndispDataFim('')
        setNovaIndispMotivo('')
        setMarcarPeriodo(false)

        await carregarIndisponibilidades()
        showToast({ message: 'Indisponibilidade marcada!', color: 'success' })
      } catch (e) {
        console.error(e)
        setIndisponibilidadeError('Erro ao marcar indisponibilidade.')
        showToast({ message: 'Erro ao marcar indisponibilidade.', color: 'danger' })
      } finally {
        setSavingIndisponibilidade(false)
      }
    },
    [
      carregarIndisponibilidades,
      marcarPeriodo,
      novaIndispData,
      novaIndispDataFim,
      novaIndispMotivo,
      showToast,
      supabase,
      user.id,
      user.igrejaId,
      validationCtx,
    ],
  )

  const excluirIndisponibilidade = useCallback(
    async (id: string) => {
      abrirConfirmacao({
        title: 'Remover indisponibilidade',
        message: 'Tem certeza que deseja remover esta indisponibilidade?',
        actionLabel: 'Remover',
        onConfirm: async () => {
          setSavingIndisponibilidade(true)
          setIndisponibilidadeError(null)

          try {
            const { error } = await supabase.from('indisponibilidades').delete().eq('id', id)

            if (error) {
              if (getErrorCode(error) === '42501') {
                setIndisponibilidadeError(
                  'Não é possível remover esta indisponibilidade. Já existe escala publicada para esta data.',
                )
              } else {
                setIndisponibilidadeError(error.message)
              }
              return
            }

            await carregarIndisponibilidades()
            showToast({ message: 'Indisponibilidade removida!', color: 'success' })
          } catch (e) {
            console.error(e)
            setIndisponibilidadeError('Erro ao remover indisponibilidade.')
            showToast({ message: 'Erro ao remover indisponibilidade.', color: 'danger' })
          } finally {
            setSavingIndisponibilidade(false)
          }
        },
      })
    },
    [abrirConfirmacao, carregarIndisponibilidades, showToast, supabase],
  )

  return {
    indisponibilidades,
    indisponibilidadeError,
    savingIndisponibilidade,

    marcarPeriodo,
    setMarcarPeriodo,

    novaIndispData,
    setNovaIndispData,

    novaIndispDataFim,
    setNovaIndispDataFim,

    novaIndispMotivo,
    setNovaIndispMotivo,

    criarIndisponibilidade,
    excluirIndisponibilidade,

    carregarIndisponibilidades,
  }
}
