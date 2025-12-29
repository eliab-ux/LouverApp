import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase as defaultSupabase } from '../../../lib/supabase'
import type { InlineToastOptions } from '../../../lib/inlineToastTypes'
import type {
  AppUser,
  Evento,
  Escala as EscalaType,
  EscalaMusica,
  Escalado,
  Indisponibilidade,
  Musica,
  TipoEvento,
} from '../../../types'

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export default function useAgenda(opts: {
  user: AppUser
  supabase?: typeof defaultSupabase
  showToast: (opts: InlineToastOptions) => void
  setMensagemSucesso?: (v: string | null) => void
  abrirConfirmacao: (opts: {
    title: string
    message: string
    actionLabel?: string
    onConfirm: () => Promise<void>
  }) => void
}) {
  const { user, showToast, abrirConfirmacao, setMensagemSucesso } = opts
  const supabase = opts.supabase ?? defaultSupabase

  const [eventos, setEventos] = useState<Evento[]>([])
  const [escalas, setEscalas] = useState<EscalaType[]>([])
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([])
  const [escalados, setEscalados] = useState<Escalado[]>([])
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [escalaMusicas, setEscalaMusicas] = useState<EscalaMusica[]>([])

  const [eventoError, setEventoError] = useState<string | null>(null)
  const [escalaError, setEscalaError] = useState<string | null>(null)

  const [mesExportacao, setMesExportacao] = useState(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  })

  const EVENTOS_POR_PAGINA = 3
  const [paginaEventos, setPaginaEventos] = useState(1)

  const [filtroStatusEvento, setFiltroStatusEvento] = useState<
    'todos' | 'publicados' | 'publicados_em_edicao' | 'nao_publicados'
  >('todos')

  const [eventosPublicadosEmEdicao, setEventosPublicadosEmEdicao] = useState<Set<string>>(() => new Set())

  // Estados do formulário de eventos (líder/admin)
  const [novoEventoTipoEventoId, setNovoEventoTipoEventoId] = useState<string>('')
  const [novoEventoData, setNovoEventoData] = useState('')
  const [novoEventoHora, setNovoEventoHora] = useState('')

  // Estados para montagem de escala
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string | null>(null)
  const [novoEscaladoUsuarioId, setNovoEscaladoUsuarioId] = useState('')
  const [novoEscaladoFuncao, setNovoEscaladoFuncao] = useState('')

  // Estados para músicas da escala
  const [novaMusicaId, setNovaMusicaId] = useState('')
  const [novaMusicaTom, setNovaMusicaTom] = useState('')

  const carregarEventos = useCallback(async () => {
    try {
      setEventoError(null)
      const { data, error } = await supabase
        .from('eventos')
        .select('id, igreja_id, data, hora, created_at, tipo_evento_id, tipo_evento:tipos_evento ( id, nome, ordem )')
        .eq('igreja_id', user.igrejaId)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .order('hora', { ascending: true })

      if (error) {
        setEventoError(error.message)
        return
      }

      const rows = (Array.isArray(data) ? data : []) as Array<Record<string, unknown> & { tipo_evento?: unknown }>
      const eventosRaw = rows.map((ev) => {
        const tipo = ev.tipo_evento
        const tipoEvento = Array.isArray(tipo) ? (tipo[0] ?? null) : (tipo ?? null)
        return { ...ev, tipo_evento: tipoEvento }
      })
      setEventos(eventosRaw as unknown as Evento[])
    } catch (e) {
      console.error(e)
      setEventoError('Erro ao carregar eventos.')
    }
  }, [supabase, user.igrejaId])

  const carregarTiposEvento = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('tipos_evento').select('id, nome, ordem').order('ordem', { ascending: true })

      if (error) {
        setTiposEvento([])
        if (getErrorCode(error) === 'PGRST205') {
          setEventoError('Tabela tipos_evento ainda não foi criada no banco. Aplique a migration e recarregue.')
        }
        return
      }

      setTiposEvento((data as unknown as TipoEvento[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar tipos_evento:', e)
    }
  }, [supabase])

  const nomeTipoEvento = useCallback((evento: Evento) => {
    return evento.tipo_evento?.nome ?? 'Tipo'
  }, [])

  const carregarEscalas = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('escalas').select('*').eq('igreja_id', user.igrejaId)

      if (error) {
        console.error('Erro ao carregar escalas:', error)
        return
      }

      setEscalas((data as EscalaType[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar escalas:', e)
    }
  }, [supabase, user.igrejaId])

  const carregarEscalados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('escalados')
        .select(
          `
          *,
          usuario:usuarios(id, nome)
        `,
        )
        .in(
          'escala_id',
          escalas.map((e) => e.id),
        )

      if (error) {
        console.error('Erro ao carregar escalados:', error)
        return
      }

      setEscalados((data as unknown as Escalado[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar escalados:', e)
    }
  }, [supabase, escalas])

  const carregarMusicas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('musicas')
        .select('id, nome, tons')
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar músicas:', error)
        return
      }

      setMusicas((data as Musica[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar músicas:', e)
    }
  }, [supabase, user.igrejaId])

  const carregarEscalaMusicas = useCallback(async () => {
    if (escalas.length === 0) return

    try {
      const { data, error } = await supabase
        .from('escala_musicas')
        .select(
          `
          id,
          escala_id,
          musica_id,
          tom_escolhido,
          ordem,
          created_at,
          musica:musicas(id, nome, tons)
        `,
        )
        .in(
          'escala_id',
          escalas.map((e) => e.id),
        )
        .order('ordem', { ascending: true })

      if (error) {
        console.error('Erro ao carregar músicas da escala:', error)
        return
      }

      setEscalaMusicas((data as unknown as EscalaMusica[]) ?? [])
    } catch (e) {
      console.error('Erro ao carregar músicas da escala:', e)
    }
  }, [supabase, escalas])

  useEffect(() => {
    queueMicrotask(() => {
      void carregarEventos()
      void carregarTiposEvento()
      void carregarEscalas()
      void carregarMusicas()
    })
  }, [carregarEventos, carregarMusicas, carregarEscalas, carregarTiposEvento])

  useEffect(() => {
    if (escalas.length > 0) {
      queueMicrotask(() => {
        void carregarEscalados()
        void carregarEscalaMusicas()
      })
    }
  }, [carregarEscalaMusicas, carregarEscalados, escalas.length])

  const eventosFiltradosPorStatus = useMemo(() => {
    const publishedEventoIds = new Set(escalas.filter((e) => e.publicada).map((e) => e.evento_id))

    if (filtroStatusEvento === 'publicados') {
      return eventos.filter((e) => publishedEventoIds.has(e.id) && !eventosPublicadosEmEdicao.has(e.id))
    }

    if (filtroStatusEvento === 'publicados_em_edicao') {
      return eventos.filter((e) => eventosPublicadosEmEdicao.has(e.id))
    }

    if (filtroStatusEvento === 'nao_publicados') {
      return eventos.filter((e) => !publishedEventoIds.has(e.id) && !eventosPublicadosEmEdicao.has(e.id))
    }

    return eventos
  }, [escalas, eventos, eventosPublicadosEmEdicao, filtroStatusEvento])

  const totalPaginasEventos = Math.max(1, Math.ceil(eventosFiltradosPorStatus.length / EVENTOS_POR_PAGINA))
  const paginaEventosClamped = Math.min(Math.max(1, paginaEventos), totalPaginasEventos)
  const indexInicioEventos = (paginaEventosClamped - 1) * EVENTOS_POR_PAGINA
  const indexFimEventos = indexInicioEventos + EVENTOS_POR_PAGINA
  const eventosPaginaAtual = eventosFiltradosPorStatus.slice(indexInicioEventos, indexFimEventos)

  const criarEvento = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      if (!novoEventoTipoEventoId || !novoEventoData || !novoEventoHora) {
        setEventoError('Data e hora são obrigatórias.')
        return
      }

      const hoje = new Date().toISOString().split('T')[0]
      if (novoEventoData < hoje) {
        setEventoError('Só é possível criar eventos para datas futuras.')
        return
      }

      try {
        setEventoError(null)
        const { error } = await supabase.from('eventos').insert({
          igreja_id: user.igrejaId,
          tipo_evento_id: novoEventoTipoEventoId,
          data: novoEventoData,
          hora: novoEventoHora,
        })

        if (error) {
          if (getErrorCode(error) === '23505') {
            setEventoError('Já existe um evento deste tipo nesta data e horário.')
          } else {
            setEventoError(error.message)
          }
          return
        }

        setNovoEventoData('')
        setNovoEventoHora('')
        setNovoEventoTipoEventoId('')
        await carregarEventos()
      } catch (e) {
        console.error(e)
        setEventoError('Erro ao criar evento.')
      }
    },
    [
      carregarEventos,
      novoEventoData,
      novoEventoHora,
      novoEventoTipoEventoId,
      supabase,
      user.igrejaId,
    ],
  )

  const excluirEvento = useCallback(
    async (id: string) => {
      abrirConfirmacao({
        title: 'Excluir evento',
        message: 'Tem certeza que deseja excluir este evento?',
        actionLabel: 'Excluir',
        onConfirm: async () => {
          try {
            setEventoError(null)
            const { error } = await supabase.from('eventos').delete().eq('id', id)

            if (error) {
              setEventoError(error.message)
              return
            }

            await carregarEventos()
          } catch (e) {
            console.error(e)
            setEventoError('Erro ao excluir evento.')
          }
        },
      })
    },
    [abrirConfirmacao, carregarEventos, supabase],
  )

  const obterOuCriarEscala = useCallback(
    async (eventoId: string): Promise<EscalaType | null> => {
      const existente = escalas.find((e) => e.evento_id === eventoId)
      if (existente) return existente

      try {
        const { data, error } = await supabase
          .from('escalas')
          .insert({
            evento_id: eventoId,
            igreja_id: user.igrejaId,
            publicada: false,
            observacoes: null,
            criado_por: user.id,
          })
          .select('*')
          .single()

        if (error) {
          console.error('Erro ao criar escala:', error)
          setEscalaError('Erro ao criar escala para este evento.')
          return null
        }

        const novaEscala = data as EscalaType
        setEscalas((prev) => [...prev, novaEscala])
        return novaEscala
      } catch (e) {
        console.error('Erro ao criar escala:', e)
        setEscalaError('Erro ao criar escala para este evento.')
        return null
      }
    },
    [escalas, supabase, user.id, user.igrejaId],
  )

  const marcarEscalaComoEmEdicao = useCallback(
    async (eventoId: string) => {
      try {
        const escala = escalas.find((e) => e.evento_id === eventoId)
        if (!escala) return

        if (!escala.publicada) return

        const { error } = await supabase.from('escalas').update({ publicada: false }).eq('id', escala.id)
        if (error) {
          console.error('Erro ao marcar escala como em edição:', error)
          return
        }

        setEventosPublicadosEmEdicao((prev) => {
          const next = new Set(prev)
          next.add(eventoId)
          return next
        })

        await carregarEscalas()
      } catch (e) {
        console.error('Erro ao marcar escala como em edição:', e)
      }
    },
    [carregarEscalas, escalas, supabase],
  )

  const adicionarEscalado = useCallback(async () => {
    if (!eventoSelecionadoId) return
    if (!novoEscaladoUsuarioId || !novoEscaladoFuncao.trim()) {
      setEscalaError('Selecione um membro e informe a função.')
      return
    }

    try {
      setEscalaError(null)

      const evento = eventos.find((e) => e.id === eventoSelecionadoId)
      if (!evento) {
        setEscalaError('Evento não encontrado. Atualize a página e tente novamente.')
        return
      }

      const { data: indispsData, error: indispsError } = await supabase
        .from('indisponibilidades')
        .select('*')
        .eq('usuario_id', novoEscaladoUsuarioId)

      if (indispsError) {
        console.error('Erro ao verificar indisponibilidades:', indispsError)
      } else if (indispsData) {
        const conflitos = (indispsData as Indisponibilidade[]).filter((ind) => {
          const inicio = ind.data
          const fim = ind.data_fim ?? ind.data
          return evento.data >= inicio && evento.data <= fim
        })

        if (conflitos.length > 0) {
          const conflito = conflitos[0]
          const inicioFmt = new Date(conflito.data + 'T00:00:00').toLocaleDateString('pt-BR')
          const fimFmt = conflito.data_fim
            ? new Date(conflito.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')
            : null
          const periodoTexto = fimFmt && conflito.data_fim !== conflito.data ? `${inicioFmt} até ${fimFmt}` : inicioFmt

          setEscalaError(
            `Conflito de indisponibilidade: este membro marcou que não pode neste período (${periodoTexto}). Motivo: ${
              conflito.motivo ?? 'não informado'
            }.`,
          )
          return
        }
      }

      const escala = await obterOuCriarEscala(eventoSelecionadoId)
      if (!escala) return

      const { error } = await supabase.from('escalados').insert({
        escala_id: escala.id,
        usuario_id: novoEscaladoUsuarioId,
        funcao: novoEscaladoFuncao.trim(),
        is_ministrante: false,
      })

      if (error) {
        if (getErrorCode(error) === '23505') {
          setEscalaError('Este membro já está escalado com esta função neste evento.')
        } else {
          setEscalaError(error.message)
        }
        return
      }

      setNovoEscaladoUsuarioId('')
      setNovoEscaladoFuncao('')
      await carregarEscalados()

      if (eventoSelecionadoId) {
        await marcarEscalaComoEmEdicao(eventoSelecionadoId)
      }
    } catch (e) {
      console.error('Erro ao adicionar escalado:', e)
      setEscalaError('Erro ao adicionar membro à escala.')
    }
  }, [
    carregarEscalados,
    eventoSelecionadoId,
    eventos,
    novoEscaladoFuncao,
    novoEscaladoUsuarioId,
    obterOuCriarEscala,
    marcarEscalaComoEmEdicao,
    supabase,
  ])

  const alternarMinistrante = useCallback(
    async (id: string, next: boolean) => {
      try {
        setEscalaError(null)

        const { error } = await supabase.from('escalados').update({ is_ministrante: next }).eq('id', id)

        if (error) {
          setEscalaError(error.message)
          return
        }

        await carregarEscalados()
      } catch (e) {
        console.error('Erro ao alternar ministrante:', e)
        setEscalaError('Erro ao atualizar ministrante.')
      }
    },
    [carregarEscalados, supabase],
  )

  const removerEscalado = useCallback(
    async (id: string) => {
      abrirConfirmacao({
        title: 'Remover membro',
        message: 'Remover este membro da escala?',
        actionLabel: 'Remover',
        onConfirm: async () => {
          try {
            setEscalaError(null)
            const { error } = await supabase.from('escalados').delete().eq('id', id)

            if (error) {
              setEscalaError(error.message)
              return
            }

            await carregarEscalados()

            const eventoId = eventoSelecionadoId
            if (eventoId) {
              await marcarEscalaComoEmEdicao(eventoId)
            }
          } catch (e) {
            console.error('Erro ao remover escalado:', e)
            setEscalaError('Erro ao remover membro da escala.')
          }
        },
      })
    },
    [abrirConfirmacao, carregarEscalados, eventoSelecionadoId, marcarEscalaComoEmEdicao, supabase],
  )

  const adicionarMusicaEscala = useCallback(
    async (eventoId: string) => {
      if (!novaMusicaId) {
        setEscalaError('Selecione uma música.')
        return
      }

      try {
        setEscalaError(null)
        const escala = await obterOuCriarEscala(eventoId)
        if (!escala) return

        const musicasDoEvento = escalaMusicas.filter((em) => em.escala_id === escala.id)
        const proximaOrdem =
          musicasDoEvento.length > 0 ? Math.max(...musicasDoEvento.map((em) => em.ordem)) + 1 : 1

        const { error } = await supabase.from('escala_musicas').insert({
          escala_id: escala.id,
          musica_id: novaMusicaId,
          tom_escolhido: novaMusicaTom || null,
          ordem: proximaOrdem,
        })

        if (error) {
          if (getErrorCode(error) === '23505') {
            setEscalaError('Esta música já está na escala deste evento.')
          } else {
            setEscalaError(error.message)
          }
          return
        }

        setNovaMusicaId('')
        setNovaMusicaTom('')
        await carregarEscalaMusicas()

        await marcarEscalaComoEmEdicao(eventoId)
      } catch (e) {
        console.error('Erro ao adicionar música à escala:', e)
        setEscalaError('Erro ao adicionar música à escala.')
      }
    },
    [
      carregarEscalaMusicas,
      escalaMusicas,
      marcarEscalaComoEmEdicao,
      novaMusicaId,
      novaMusicaTom,
      obterOuCriarEscala,
      supabase,
    ],
  )

  const removerMusicaEscala = useCallback(
    async (id: string) => {
      abrirConfirmacao({
        title: 'Remover música',
        message: 'Remover esta música da escala?',
        actionLabel: 'Remover',
        onConfirm: async () => {
          try {
            setEscalaError(null)
            const { error } = await supabase.from('escala_musicas').delete().eq('id', id)

            if (error) {
              setEscalaError(error.message)
              return
            }

            await carregarEscalaMusicas()

            const eventoId = eventoSelecionadoId
            if (eventoId) {
              await marcarEscalaComoEmEdicao(eventoId)
            }
          } catch (e) {
            console.error('Erro ao remover música da escala:', e)
            setEscalaError('Erro ao remover música da escala.')
          }
        },
      })
    },
    [abrirConfirmacao, carregarEscalaMusicas, eventoSelecionadoId, marcarEscalaComoEmEdicao, supabase],
  )

  const publicarEscala = useCallback(
    async (eventoId: string) => {
      try {
        setEscalaError(null)

        const escala = await obterOuCriarEscala(eventoId)
        if (!escala) return

        const { data: ministrantesData, error: ministrantesErr } = await supabase
          .from('escalados')
          .select('id')
          .eq('escala_id', escala.id)
          .eq('is_ministrante', true)
          .limit(1)

        if (ministrantesErr) {
          setEscalaError(ministrantesErr.message)
          showToast({ message: ministrantesErr.message, color: 'danger' })
          return
        }

        if (!ministrantesData || ministrantesData.length === 0) {
          const msg = 'Defina pelo menos 1 ministrante antes de publicar a escala.'
          setEscalaError(msg)
          showToast({ message: msg, color: 'warning' })
          return
        }
      } catch (e) {
        console.error('Erro ao validar ministrantes:', e)
        setEscalaError('Erro ao validar ministrantes antes de publicar.')
        showToast({ message: 'Erro ao validar ministrantes antes de publicar.', color: 'danger' })
        return
      }

      abrirConfirmacao({
        title: 'Publicar escala',
        message:
          'Após publicada, os escalados não poderão ser alterados. Músicas poderão ser ajustadas por Admin/Líder e pelos ministrantes. Deseja continuar?',
        actionLabel: 'Publicar',
        onConfirm: async () => {
          try {
            setEscalaError(null)

            const escala = await obterOuCriarEscala(eventoId)
            if (!escala) return

            const { error } = await supabase.from('escalas').update({ publicada: true }).eq('id', escala.id)

            if (error) {
              setEscalaError(error.message)
              showToast({ message: error.message, color: 'danger' })
              return
            }

            await carregarEscalas()
            showToast({ message: 'Escala publicada com sucesso!', color: 'success' })
            setMensagemSucesso?.('✅ Escala publicada com sucesso!')
            setTimeout(() => setMensagemSucesso?.(null), 4000)

            setEventosPublicadosEmEdicao((prev) => {
              const next = new Set(prev)
              next.delete(eventoId)
              return next
            })
          } catch (e) {
            console.error('Erro ao publicar escala:', e)
            setEscalaError('Erro ao publicar escala.')
            showToast({ message: 'Erro ao publicar escala.', color: 'danger' })
          }
        },
      })
    },
    [abrirConfirmacao, carregarEscalas, obterOuCriarEscala, setMensagemSucesso, showToast, supabase],
  )

  const handleImprimirEscalaMensal = useCallback(() => {
    if (!mesExportacao) return

    try {
      const [yyyy, mm] = mesExportacao.split('-').map((x) => Number(x))
      if (!yyyy || !mm) return

      const inicio = new Date(yyyy, mm - 1, 1)
      const fim = new Date(yyyy, mm, 0)
      const inicioIso = inicio.toISOString().split('T')[0]
      const fimIso = fim.toISOString().split('T')[0]

      const eventosList = eventos
        .filter((e) => e.data >= inicioIso && e.data <= fimIso)
        .sort((a, b) => (a.data === b.data ? a.hora.localeCompare(b.hora) : a.data.localeCompare(b.data)))

      if (eventosList.length === 0) {
        setEventoError('Nenhum evento encontrado neste mês para exportação.')
        return
      }

      const escapeHtml = (input: string) =>
        input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')

      const escalaByEvento = new Map<string, string>()
      escalas.forEach((e) => {
        if (e.evento_id) escalaByEvento.set(e.evento_id, e.id)
      })

      const escaladosPorEscala = new Map<string, Escalado[]>()
      escalados.forEach((e) => {
        const arr = escaladosPorEscala.get(e.escala_id) ?? []
        arr.push(e)
        escaladosPorEscala.set(e.escala_id, arr)
      })

      const isVoz = (funcao: string) => {
        const f = funcao.toLowerCase()
        return f.includes('voz') || f.includes('vocal')
      }

      const diasSemana: Record<string, string> = {
        dom: 'DOM',
        seg: 'SEG',
        ter: 'TER',
        qua: 'QUA',
        qui: 'QUI',
        sex: 'SEX',
        sáb: 'SÁB',
        sab: 'SÁB',
      }

      const formatDiaSemana = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00')
        const w = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase()
        return diasSemana[w] ?? w.toUpperCase()
      }

      const tituloIgreja = (user.igrejaNome ?? 'Louvor').toUpperCase()
      const mesNome = inicio.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()

      const linhas = eventosList
        .map((ev) => {
          const escalaId = escalaByEvento.get(ev.id)
          const escaladosEvento = escalaId ? escaladosPorEscala.get(escalaId) ?? [] : []

          const vozes = escaladosEvento.filter((x) => isVoz(x.funcao))
          const musicos = escaladosEvento.filter((x) => !isVoz(x.funcao))

          const fmtNome = (x: (typeof escaladosEvento)[number]) => {
            const nome = (x.usuario?.nome ?? 'Membro').toUpperCase()
            return x.is_ministrante ? `*${nome}` : nome
          }

          const vozesTxt = vozes.length > 0 ? vozes.map(fmtNome).join(', ') : '-'
          const musicosTxt = musicos.length > 0 ? musicos.map(fmtNome).join(', ') : '-'

          const d = new Date(ev.data + 'T00:00:00')
          const dd = String(d.getDate()).padStart(2, '0')
          const mm2 = String(d.getMonth() + 1).padStart(2, '0')
          const diaSemana = formatDiaSemana(ev.data)

          return `
            <div class="row">
              <div class="cell cell-date">
                <div class="date">${dd}/${mm2}</div>
                <div class="dow">${diaSemana}</div>
              </div>
              <div class="cell cell-body">${escapeHtml(vozesTxt)}</div>
              <div class="cell cell-body">${escapeHtml(musicosTxt)}</div>
            </div>
          `
        })
        .join('')

      const html = `<!DOCTYPE html>
        <html>
          <head>
            <meta charSet="utf-8" />
            <title>${escapeHtml(tituloIgreja)} - Escala Mensal</title>
            <style>
              @page { margin: 18mm 14mm; }
              body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; color: #e2e8f0; background: #061c32; }
              .wrap { width: 100%; }
              .header { background: #062a4a; padding: 26px 24px 18px 24px; text-align: center; }
              .title { font-weight: 800; letter-spacing: 0.16em; font-size: 34px; margin: 0; color: #ffffff; }
              .subtitle { margin: 8px 0 0 0; font-size: 12px; letter-spacing: 0.18em; color: #cbd5e1; }
              .content { padding: 22px 10px 0 10px; }
              .table { width: 100%; }
              .thead { display: grid; grid-template-columns: 110px 1fr 1fr; gap: 12px; margin-bottom: 10px; }
              .th { background: #0b4f78; color: #ffffff; font-weight: 800; letter-spacing: 0.12em; text-align: center; padding: 14px 10px; }
              .row { display: grid; grid-template-columns: 110px 1fr 1fr; gap: 12px; margin-bottom: 12px; }
              .cell { background: #7b8ea2; color: #ffffff; padding: 14px 12px; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 700; letter-spacing: 0.05em; }
              .cell-date { background: #6f8398; flex-direction: column; gap: 6px; }
              .date { font-size: 18px; font-weight: 900; }
              .dow { font-size: 12px; font-weight: 900; opacity: 0.95; }
              .cell-body { font-size: 12px; line-height: 1.25; }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="header">
                <h1 class="title">${escapeHtml(tituloIgreja)}</h1>
                <p class="subtitle">ESCALA MENSAL — MÊS DE ${escapeHtml(mesNome)}</p>
              </div>
              <div class="content">
                <div class="table">
                  <div class="thead">
                    <div class="th">DATA</div>
                    <div class="th">VOZES</div>
                    <div class="th">MÚSICOS</div>
                  </div>
                  ${linhas}
                </div>
              </div>
            </div>
          </body>
        </html>`

      const janela = window.open('', '_blank')
      if (!janela) return
      janela.document.write(html)
      janela.document.close()
      janela.focus()
      janela.print()
    } catch (e) {
      console.error(e)
      setEventoError('Erro ao gerar PDF da escala mensal.')
    }
  }, [escalados, escalas, eventos, mesExportacao, user.igrejaNome])

  return {
    EVENTOS_POR_PAGINA,

    // agenda data
    eventos,
    escalas,
    escalados,
    escalaMusicas,
    tiposEvento,
    musicas,

    // agenda ui state
    mesExportacao,
    setMesExportacao,

    paginaEventos,
    setPaginaEventos,
    totalPaginasEventos,
    eventosPaginaAtual,
    eventosFiltradosPorStatus,

    filtroStatusEvento,
    setFiltroStatusEvento,

    eventosPublicadosEmEdicao,

    eventoError,
    escalaError,

    // create event
    novoEventoTipoEventoId,
    setNovoEventoTipoEventoId,
    novoEventoData,
    setNovoEventoData,
    novoEventoHora,
    setNovoEventoHora,

    // montagem de escala
    eventoSelecionadoId,
    setEventoSelecionadoId,
    novoEscaladoUsuarioId,
    setNovoEscaladoUsuarioId,
    novoEscaladoFuncao,
    setNovoEscaladoFuncao,

    // musicas da escala
    novaMusicaId,
    setNovaMusicaId,
    novaMusicaTom,
    setNovaMusicaTom,

    // actions
    nomeTipoEvento,
    criarEvento,
    excluirEvento,
    publicarEscala,
    adicionarEscalado,
    alternarMinistrante,
    removerEscalado,
    adicionarMusicaEscala,
    removerMusicaEscala,
    handleImprimirEscalaMensal,

    // exposed loaders (for other hooks)
    carregarEventos,
    carregarEscalas,
    carregarEscalados,
    carregarTiposEvento,
    carregarMusicas,
  }
}
