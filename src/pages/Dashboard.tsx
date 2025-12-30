import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IonAccordion,
  IonAccordionGroup,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonIcon,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react'
import {
  homeOutline,
  musicalNotesOutline,
  calendarOutline,
  logOutOutline,
  trendingUpOutline,
  calendarNumberOutline,
  linkOutline,
  star,
} from 'ionicons/icons'
import { Redirect, Route, Switch } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CSSProperties } from 'react'
import type {
  AppUser,
  Categoria,
  MomentoCulto,
  Estilo,
} from '../types'
import { Musicas } from './Musicas'
import { AdminPanel } from './AdminPanel'
import { Escala } from './Escala'
import { ThemeSelectRow } from '../components/ThemeSelectRow'
import { MeuPerfil } from './MeuPerfil'
import { DadosIgreja } from './DadosIgreja'

type EscalaMusica = {
  id: string
  tom_escolhido: string | null
  ordem: number
  musica: {
    id: string
    nome: string
    bpm: number | null
    links: string | null
  }
}

type MinhaEscala = {
  id: string
  funcao: string
  evento: {
    id: string
    tipo: string
    data: string
    hora: string | null
  }
  escala: {
    id: string
    publicada: boolean
  }
  musicas: EscalaMusica[]
  participantes: {
    voz: { nome: string; ministrante: boolean }[]
    musico: { nome: string; ministrante: boolean }[]
  }
}

type EstatisticasMusicas = {
  totalMusicas: number
  musicasMaisTocadas: { nome: string; vezes: number }[]
  categoriasMaisUsadas: { nome: string; quantidade: number }[]
}

function DashboardOverviewContent({
  mesesFiltro,
  setMesesFiltro,
  loadingEstatisticas,
  estatisticas,
  loadingEscalas,
  minhasEscalas,
}: {
  mesesFiltro: number
  setMesesFiltro: (v: number) => void
  loadingEstatisticas: boolean
  estatisticas: EstatisticasMusicas | null
  loadingEscalas: boolean
  minhasEscalas: MinhaEscala[]
}) {
  console.log('[Inicio] render DashboardOverviewContent', {
    mesesFiltro,
    loadingEstatisticas,
    estatisticasLoaded: !!estatisticas,
    musicasMaisTocadas: estatisticas?.musicasMaisTocadas.length ?? 0,
    loadingEscalas,
    minhasEscalas: minhasEscalas.length,
  })

  const compactIonItemStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '0',
    ['--inner-padding-end']: '0',
    ['--min-height']: '22px',
    ['--background']: 'transparent',
  }

  return (
    <main className="space-y-3">
      <IonAccordionGroup
        value={['minhas-escalas']}
        multiple={true}
        style={{ marginLeft: '5px', marginRight: '5px' }}
      >
        <IonAccordion value="mais-tocadas">
          <IonItem slot="header" className="ion-no-padding">
            <IonIcon slot="start" icon={trendingUpOutline} className="text-slate-400" />
            <IonLabel>
              <h2 className="text-sm font-semibold text-gray-800">Mais Tocadas</h2>
              <p className="text-xs text-gray-500 leading-tight">Músicas mais tocadas no período</p>
            </IonLabel>
          </IonItem>
          <div slot="content" className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[0.7rem] text-gray-500">Período:</label>
              <select
                value={mesesFiltro}
                onChange={(e) => setMesesFiltro(Number(e.target.value))}
                className="rounded-full bg-slate-950/80 px-3 py-1 text-[0.7rem] text-slate-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? 'mês' : 'meses'}
                  </option>
                ))}
              </select>
            </div>

            <IonCard className="shadow-sm px-3 py-2">
              {loadingEstatisticas ? (
                <p className="text-xs text-gray-500">Carregando...</p>
              ) : estatisticas && estatisticas.musicasMaisTocadas.length > 0 ? (
                <IonList lines="none" className="p-0 m-0">
                  {estatisticas.musicasMaisTocadas.map((m, idx) => (
                    <IonItem
                      key={idx}
                      lines="none"
                      className="--compact-item"
                      style={compactIonItemStyle}
                    >
                      <IonLabel className="m-0">
                        <div className="text-[0.7rem] text-gray-700 leading-tight truncate">
                          {idx + 1}. {m.nome}
                        </div>
                      </IonLabel>
                      <div slot="end" className="text-[0.7rem] text-gray-400">
                        {m.vezes}x
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              ) : (
                <p className="text-xs text-gray-500">Sem dados disponíveis.</p>
              )}
            </IonCard>
          </div>
        </IonAccordion>

        <IonAccordion value="minhas-escalas">
          <IonItem slot="header" className="ion-no-padding">
            <IonIcon slot="start" icon={calendarNumberOutline} className="text-slate-400" />
            <IonLabel>
              <h2 className="text-sm font-semibold text-gray-800">Minhas Escalas</h2>
              <p className="text-xs text-gray-500 leading-tight">
                {minhasEscalas.length} {minhasEscalas.length === 1 ? 'evento' : 'eventos'}
              </p>
            </IonLabel>
          </IonItem>
          <div slot="content" className="p-3">
            {loadingEscalas ? (
              <p className="text-xs text-gray-500">Carregando...</p>
            ) : minhasEscalas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">Você não está escalado em nenhum evento próximo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {minhasEscalas.map((item) => {
                  const dataEvento = new Date(item.evento.data + 'T00:00:00')
                  const dataFormatada = dataEvento.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })

                  const horaFmt = item.evento.hora ? item.evento.hora.slice(0, 5) : null

                  return (
                    <IonCard key={item.id} className="shadow-sm">
                      <IonCardHeader className="px-3 pt-2 pb-1">
                        <div className="flex items-start justify-between gap-2">
                          <IonCardSubtitle className="text-[0.7rem] text-gray-500 leading-tight">
                            {dataFormatada}
                            {horaFmt && ` • ${horaFmt}`}
                            {' • '}
                            <span className="text-primary">{item.funcao}</span>
                          </IonCardSubtitle>

                          <div className="text-[0.7rem] font-semibold text-gray-700 text-right whitespace-nowrap">
                            {item.evento.tipo === 'culto' ? 'Culto' : 'Ensaio'}
                          </div>
                        </div>
                      </IonCardHeader>

                      <IonCardContent className="px-3 pt-1 pb-2">
                        {(item.participantes.voz.length > 0 || item.participantes.musico.length > 0) && (
                          <div className="mb-1">
                            {item.participantes.voz.length > 0 && (
                              <p className="text-[0.65rem] text-gray-500 leading-tight">
                                Voz:{' '}
                                {item.participantes.voz.map((p, i) => (
                                  <span key={`${p.nome}-${i}`}>
                                    {i > 0 ? ', ' : ''}
                                    {p.ministrante && (
                                      <span className="inline-flex items-center">
                                        <IonIcon icon={star} className="mr-1" style={{ color: '#fbbf24' }} />
                                      </span>
                                    )}
                                    {p.nome}
                                  </span>
                                ))}
                              </p>
                            )}
                            {item.participantes.musico.length > 0 && (
                              <p className="text-[0.65rem] text-gray-500 leading-tight">
                                Músicos:{' '}
                                {item.participantes.musico.map((p, i) => (
                                  <span key={`${p.nome}-${i}`}>
                                    {i > 0 ? ', ' : ''}
                                    {p.ministrante && (
                                      <span className="inline-flex items-center">
                                        <IonIcon icon={star} className="mr-1" style={{ color: '#fbbf24' }} />
                                      </span>
                                    )}
                                    {p.nome}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        )}

                        {item.musicas.length > 0 ? (
                          <>
                            <div className="mt-1" />
                            <div className="space-y-1">
                              {item.musicas.map((em, idx) => (
                                <div key={em.id} className="flex items-start justify-between gap-2 text-[0.65rem]">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-gray-500 mr-1">{idx + 1}.</span>
                                    <span className="truncate">{em.musica.nome}</span>
                                    {em.tom_escolhido && (
                                      <span className="text-[0.65rem] text-gray-500"> ({em.tom_escolhido})</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {em.musica.links && (
                                      <a
                                        href={em.musica.links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary inline-flex items-center justify-center h-5 w-5"
                                      >
                                        <IonIcon icon={linkOutline} className="text-sm" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Sem repertório definido.</p>
                        )}
                      </IonCardContent>
                    </IonCard>
                  )
                })}
              </div>
            )}
          </div>
        </IonAccordion>
      </IonAccordionGroup>
    </main>
  )
}

function DashboardTabPageFrame({
  user,
  handleSignOut,
  children,
}: {
  user: AppUser
  handleSignOut: () => void
  children: React.ReactNode
}) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <IonButtons slot="start">
              <IonMenuButton menu="admin-menu" />
            </IonButtons>

            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold tracking-tight text-emerald-400 truncate">
                {user.igrejaNome ?? 'Igreja sem nome'}
              </h1>
            </div>

            <IonButtons slot="end">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-slate-200 shadow-sm hover:bg-slate-800"
                aria-label="Sair"
              >
                <IonIcon icon={logOutOutline} />
              </button>
            </IonButtons>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="w-full min-h-[calc(100vh-2rem)] rounded-2xl bg-slate-50 text-slate-900 dark:bg-[#0B1220] dark:text-slate-100 px-4 py-4">
          {children}
        </div>
      </IonContent>
    </IonPage>
  )
}

// Wrapper components for routes to avoid render prop closure issues
function InicioPage({
  user,
  handleSignOut,
  mesesFiltro,
  setMesesFiltro,
}: {
  user: AppUser
  handleSignOut: () => void
  mesesFiltro: number
  setMesesFiltro: (v: number) => void
}) {
  const [estatisticas, setEstatisticas] = useState<EstatisticasMusicas | null>(null)
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(false)
  const [minhasEscalas, setMinhasEscalas] = useState<MinhaEscala[]>([])
  const [loadingEscalas, setLoadingEscalas] = useState(false)
  const mountedRef = useRef(false)

  const carregarEstatisticas = useCallback(
    async (meses: number) => {
      try {
        setLoadingEstatisticas(true)
        console.log('[Inicio] carregarEstatisticas - start', { meses, igrejaId: user.igrejaId })

        const dataLimite = new Date()
        dataLimite.setMonth(dataLimite.getMonth() - meses)
        const dataLimiteStr = dataLimite.toISOString().split('T')[0]

        const { count: totalMusicas } = await supabase
          .from('musicas')
          .select('*', { count: 'exact', head: true })
          .eq('igreja_id', user.igrejaId)
        console.log('[Inicio] carregarEstatisticas - totalMusicas', { totalMusicas })

        const { data: escalasData, error: escalasErr } = await supabase
          .from('escalas')
          .select(
            `
          id,
          evento:evento_id (
            id,
            data,
            igreja_id
          )
        `,
          )
          .gte('evento.data', dataLimiteStr)
          .eq('igreja_id', user.igrejaId)
          .eq('publicada', true)

        if (escalasErr) {
          console.error('[Inicio] carregarEstatisticas - erro ao carregar escalas', escalasErr)
        }

        const escalasDaIgreja = (escalasData ?? []).filter((row) => {
          if (!row || typeof row !== 'object') return false
          const evento = (row as { evento?: unknown }).evento
          if (!evento || typeof evento !== 'object') return false
          return (evento as { igreja_id?: unknown }).igreja_id === user.igrejaId
        })
        const escalaIds = escalasDaIgreja
          .map((row) => (row && typeof row === 'object' ? (row as { id?: unknown }).id : null))
          .filter((id): id is string => typeof id === 'string' && id.length > 0)

        console.log('[Inicio] carregarEstatisticas - escalas', {
          dataLimiteStr,
          escalasTotal: (escalasData ?? []).length,
          escalasDaIgreja: escalasDaIgreja.length,
          escalaIds: escalaIds.length,
        })

        const musicasContagem: Record<string, { nome: string; vezes: number }> = {}
        const categoriasContagem: Record<string, { nome: string; quantidade: number }> = {}

        if (escalaIds.length > 0) {
          const { data: escalaMusicasData, error: escalaMusicasErr } = await supabase
            .from('escala_musicas')
            .select(
              `
            musica:musica_id (
              id,
              nome,
              categoria_principal:categoria_principal_id (
                id,
                nome
              )
            )
          `,
            )
            .in('escala_id', escalaIds)

          if (escalaMusicasErr) {
            console.error('[Inicio] carregarEstatisticas - erro ao carregar escala_musicas', escalaMusicasErr)
          }

          ;(escalaMusicasData ?? []).forEach((em) => {
            if (!em || typeof em !== 'object') return
            const musica = (em as { musica?: unknown }).musica
            if (!musica || typeof musica !== 'object') return
            const musicaId = (musica as { id?: unknown }).id
            const musicaNome = (musica as { nome?: unknown }).nome
            if (typeof musicaId !== 'string' || typeof musicaNome !== 'string') return
            if (musicasContagem[musicaId]) musicasContagem[musicaId].vezes++
            else musicasContagem[musicaId] = { nome: musicaNome, vezes: 1 }

            const categoriaPrincipal = (musica as { categoria_principal?: unknown }).categoria_principal
            if (!categoriaPrincipal || typeof categoriaPrincipal !== 'object') return
            const catId = (categoriaPrincipal as { id?: unknown }).id
            const catNome = (categoriaPrincipal as { nome?: unknown }).nome
            if (typeof catId !== 'string' || typeof catNome !== 'string') return
            if (categoriasContagem[catId]) categoriasContagem[catId].quantidade++
            else categoriasContagem[catId] = { nome: catNome, quantidade: 1 }
          })
        }

        const musicasMaisTocadas = Object.values(musicasContagem)
          .sort((a, b) => b.vezes - a.vezes)
          .slice(0, 5)
        const categoriasMaisUsadas = Object.values(categoriasContagem)
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)

        setEstatisticas({
          totalMusicas: totalMusicas ?? 0,
          musicasMaisTocadas,
          categoriasMaisUsadas,
        })
        console.log('[Inicio] carregarEstatisticas - done', {
          totalMusicas: totalMusicas ?? 0,
          musicasMaisTocadas: musicasMaisTocadas.length,
          categoriasMaisUsadas: categoriasMaisUsadas.length,
        })
      } catch (e) {
        console.error('Erro ao carregar estatísticas:', e)
      } finally {
        setLoadingEstatisticas(false)
      }
    },
    [user.igrejaId],
  )

  const carregarMinhasEscalas = useCallback(async () => {
    try {
      setLoadingEscalas(true)
      console.log('[Inicio] carregarMinhasEscalas - start', { userId: user.id })

      const { data, error } = await supabase
        .from('escalados')
        .select(
          `
          id,
          funcao,
          escala:escala_id (
            id,
            publicada,
            evento:evento_id (
              id,
              tipo,
              data,
              hora
            )
          )
        `,
        )
        .eq('usuario_id', user.id)
        .order('id', { ascending: false })

      if (error) {
        console.error('Erro ao carregar minhas escalas:', error)
        return
      }

      console.log('[Inicio] carregarMinhasEscalas - escalados rows', { count: (data ?? []).length })

      const hoje = new Date().toISOString().split('T')[0]
      const escalasValidas = (data ?? []).filter((item) => {
        if (!item || typeof item !== 'object') return false
        const escala = (item as { escala?: unknown }).escala
        if (!escala || typeof escala !== 'object') return false
        const publicada = (escala as { publicada?: unknown }).publicada
        const evento = (escala as { evento?: unknown }).evento
        if (!evento || typeof evento !== 'object') return false
        const dataEvento = (evento as { data?: unknown }).data
        return publicada === true && typeof dataEvento === 'string' && dataEvento >= hoje
      })

      const escalaIds = escalasValidas
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const escala = (item as { escala?: unknown }).escala
          if (!escala || typeof escala !== 'object') return null
          const id = (escala as { id?: unknown }).id
          return typeof id === 'string' ? id : null
        })
        .filter((id): id is string => typeof id === 'string' && id.length > 0)

      console.log('[Inicio] carregarMinhasEscalas - escalasValidas', {
        validas: escalasValidas.length,
        escalaIds: escalaIds.length,
      })

      const musicasPorEscala: Record<string, EscalaMusica[]> = {}
      const participantesPorEscala: Record<
        string,
        {
          voz: { nome: string; ministrante: boolean }[]
          musico: { nome: string; ministrante: boolean }[]
        }
      > = {}

      if (escalaIds.length > 0) {
        const { data: musicasData, error: musicasErr } = await supabase
          .from('escala_musicas')
          .select(
            `
            id,
            tom_escolhido,
            ordem,
            escala_id,
            musica:musica_id (
              id,
              nome,
              bpm,
              links
            )
          `,
          )
          .in('escala_id', escalaIds)
          .order('ordem', { ascending: true })

        if (musicasErr) {
          console.error('[Inicio] carregarMinhasEscalas - erro ao carregar escala_musicas', musicasErr)
        }

        const { data: escaladosData, error: escaladosErr } = await supabase
          .from('escalados')
          .select(
            `
            escala_id,
            funcao,
            is_ministrante,
            usuario:usuarios(id, nome)
          `,
          )
          .in('escala_id', escalaIds)

        if (escaladosErr) {
          console.error('[Inicio] carregarMinhasEscalas - erro ao carregar escalados', escaladosErr)
        }

        ;(escaladosData ?? []).forEach((row) => {
          if (!row || typeof row !== 'object') return
          const escalaId = (row as { escala_id?: unknown }).escala_id
          const funcao = (row as { funcao?: unknown }).funcao
          const isMinistrante = (row as { is_ministrante?: unknown }).is_ministrante
          const usuario = (row as { usuario?: unknown }).usuario
          const nome = usuario && typeof usuario === 'object' ? (usuario as { nome?: unknown }).nome : null
          if (typeof escalaId !== 'string' || typeof funcao !== 'string' || typeof nome !== 'string') return

          if (!participantesPorEscala[escalaId]) {
            participantesPorEscala[escalaId] = { voz: [], musico: [] }
          }

          const f = funcao.toLowerCase()
          const isVoz =
            f.includes('voz') || f.includes('vocal') || f.includes('back') || f.includes('cant')

          const participante = {
            nome,
            ministrante: isMinistrante === true,
          }

          if (isVoz) participantesPorEscala[escalaId].voz.push(participante)
          else participantesPorEscala[escalaId].musico.push(participante)
        })

        ;(musicasData ?? []).forEach((m) => {
          if (!m || typeof m !== 'object') return
          const escalaId = (m as { escala_id?: unknown }).escala_id
          if (typeof escalaId !== 'string') return
          if (!musicasPorEscala[escalaId]) musicasPorEscala[escalaId] = []
          const rowId = (m as { id?: unknown }).id
          const tomEscolhido = (m as { tom_escolhido?: unknown }).tom_escolhido
          const ordem = (m as { ordem?: unknown }).ordem
          const musica = (m as { musica?: unknown }).musica
          if (typeof rowId !== 'string' || typeof ordem !== 'number' || !musica || typeof musica !== 'object') return
          const musicaId = (musica as { id?: unknown }).id
          const musicaNome = (musica as { nome?: unknown }).nome
          const musicaBpm = (musica as { bpm?: unknown }).bpm
          const musicaLinks = (musica as { links?: unknown }).links
          if (typeof musicaId !== 'string' || typeof musicaNome !== 'string') return
          musicasPorEscala[escalaId].push({
            id: rowId,
            tom_escolhido:
              typeof tomEscolhido === 'string' || tomEscolhido === null ? (tomEscolhido as string | null) : null,
            ordem,
            musica: {
              id: musicaId,
              nome: musicaNome,
              bpm: typeof musicaBpm === 'number' || musicaBpm === null ? (musicaBpm as number | null) : null,
              links: typeof musicaLinks === 'string' || musicaLinks === null ? (musicaLinks as string | null) : null,
            },
          })
        })
      }

      const escalasFormatadas = escalasValidas
        .map((item) => {
          const obj = item as { id?: unknown; funcao?: unknown; escala?: unknown }
          const escala = obj.escala as { id?: unknown; publicada?: unknown; evento?: unknown } | undefined
          const evento = escala?.evento as { id?: unknown; tipo?: unknown; data?: unknown; hora?: unknown } | undefined
          const escalaId = escala?.id
          if (typeof obj.id !== 'string' || typeof obj.funcao !== 'string') return null
          if (!escala || typeof escalaId !== 'string' || typeof escala.publicada !== 'boolean') return null
          if (!evento || typeof evento.id !== 'string' || typeof evento.tipo !== 'string' || typeof evento.data !== 'string') return null

          return {
            id: obj.id,
            funcao: obj.funcao,
            evento: {
              id: evento.id,
              tipo: evento.tipo,
              data: evento.data,
              hora: typeof evento.hora === 'string' || evento.hora === null ? (evento.hora as string | null) : null,
            },
            escala: {
              id: escalaId,
              publicada: escala.publicada,
            },
            musicas: musicasPorEscala[escalaId] || [],
            participantes: participantesPorEscala[escalaId] || { voz: [], musico: [] },
          }
        })
        .filter((e): e is MinhaEscala => e !== null)
        .sort((a: MinhaEscala, b: MinhaEscala) => a.evento.data.localeCompare(b.evento.data))

      setMinhasEscalas(escalasFormatadas)
      console.log('[Inicio] carregarMinhasEscalas - done', { minhasEscalas: escalasFormatadas.length })
    } catch (e) {
      console.error('Erro ao carregar minhas escalas:', e)
    } finally {
      setLoadingEscalas(false)
    }
  }, [user.id])

  useIonViewWillEnter(() => {
    if (!mountedRef.current) mountedRef.current = true
    void carregarMinhasEscalas()
    void carregarEstatisticas(mesesFiltro)
  })

  useEffect(() => {
    if (!mountedRef.current) return
    void carregarEstatisticas(mesesFiltro)
  }, [carregarEstatisticas, mesesFiltro])

  return (
    <DashboardTabPageFrame user={user} handleSignOut={handleSignOut}>
      <DashboardOverviewContent
        mesesFiltro={mesesFiltro}
        setMesesFiltro={setMesesFiltro}
        loadingEstatisticas={loadingEstatisticas}
        estatisticas={estatisticas}
        loadingEscalas={loadingEscalas}
        minhasEscalas={minhasEscalas}
      />
    </DashboardTabPageFrame>
  )
}

function MusicasPage({
  user,
  handleSignOut,
  categorias,
  momentos,
  estilos,
}: {
  user: AppUser
  handleSignOut: () => void
  categorias: Categoria[]
  momentos: MomentoCulto[]
  estilos: Estilo[]
}) {
  return (
    <DashboardTabPageFrame user={user} handleSignOut={handleSignOut}>
      <Musicas user={user} categorias={categorias} momentos={momentos} estilos={estilos} />
    </DashboardTabPageFrame>
  )
}

function EscalaPage({ user, handleSignOut }: { user: AppUser; handleSignOut: () => void }) {
  return (
    <DashboardTabPageFrame user={user} handleSignOut={handleSignOut}>
      <Escala user={user} />
    </DashboardTabPageFrame>
  )
}

export function Dashboard({ user }: { user: AppUser }) {
  const [adminInitialSection, setAdminInitialSection] = useState<
    'categorias' | 'momentos' | 'estilos' | 'membros' | 'importar' | 'notificacoes'
  >('categorias')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [momentos, setMomentos] = useState<MomentoCulto[]>([])
  const [estilos, setEstilos] = useState<Estilo[]>([])
  const [mesesFiltro, setMesesFiltro] = useState(6)

  const carregarCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar categorias:', error)
        return
      }

      setCategorias(data ?? [])
    } catch (e) {
      console.error('Erro ao carregar categorias:', e)
    }
  }, [user.igrejaId])

  const carregarMomentos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('momentos_culto')
        .select('id, nome')
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar momentos:', error)
        return
      }

      setMomentos(data ?? [])
    } catch (e) {
      console.error('Erro ao carregar momentos:', e)
    }
  }, [user.igrejaId])

  const carregarEstilos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('estilos')
        .select('id, nome')
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar estilos:', error)
        return
      }

      setEstilos(data ?? [])
    } catch (e) {
      console.error('Erro ao carregar estilos:', e)
    }
  }, [user.igrejaId])

  useEffect(() => {
    queueMicrotask(() => {
      void carregarCategorias()
      void carregarMomentos()
      void carregarEstilos()
    })
  }, [carregarCategorias, carregarMomentos, carregarEstilos])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }


  return (
    <>
      <IonMenu menuId="admin-menu" contentId="app-content" side="start">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <ThemeSelectRow />

            <IonMenuToggle autoHide={false}>
              <IonItem button detail={false} routerLink="/app/meu-perfil">
                <IonLabel>Meu Perfil</IonLabel>
              </IonItem>
            </IonMenuToggle>

            {user.papel === 'admin' && (
              <IonMenuToggle autoHide={false}>
                <IonItem button detail={false} routerLink="/app/dados-igreja">
                  <IonLabel>Dados da Igreja</IonLabel>
                </IonItem>
              </IonMenuToggle>
            )}

            {(user.papel === 'admin' || user.papel === 'lider') && (
              <>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=categorias"
                    onClick={() => setAdminInitialSection('categorias')}
                  >
                    <IonLabel>Categorias</IonLabel>
                  </IonItem>
                </IonMenuToggle>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=momentos"
                    onClick={() => setAdminInitialSection('momentos')}
                  >
                    <IonLabel>Momentos de culto</IonLabel>
                  </IonItem>
                </IonMenuToggle>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=estilos"
                    onClick={() => setAdminInitialSection('estilos')}
                  >
                    <IonLabel>Estilos</IonLabel>
                  </IonItem>
                </IonMenuToggle>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=membros"
                    onClick={() => setAdminInitialSection('membros')}
                  >
                    <IonLabel>Membros</IonLabel>
                  </IonItem>
                </IonMenuToggle>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=importar"
                    onClick={() => setAdminInitialSection('importar')}
                  >
                    <IonLabel>Importar CSV</IonLabel>
                  </IonItem>
                </IonMenuToggle>
                <IonMenuToggle autoHide={false}>
                  <IonItem
                    button
                    detail={false}
                    routerLink="/app/admin?section=notificacoes"
                    onClick={() => setAdminInitialSection('notificacoes')}
                  >
                    <IonLabel>Notificações</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              </>
            )}
          </IonList>
        </IonContent>
      </IonMenu>

      <IonTabs>
      <IonRouterOutlet id="app-content" ionPage>
        <Switch>
          <Route
            exact
            path="/app/inicio"
            render={() => (
              <InicioPage
                user={user}
                handleSignOut={() => void handleSignOut()}
                mesesFiltro={mesesFiltro}
                setMesesFiltro={setMesesFiltro}
              />
            )}
          />
          <Route
            exact
            path="/app/musicas"
            render={() => (
              <MusicasPage
                user={user}
                handleSignOut={() => void handleSignOut()}
                categorias={categorias}
                momentos={momentos}
                estilos={estilos}
              />
            )}
          />
          <Route
            exact
            path="/app/escala"
            render={() => (
              <EscalaPage
                user={user}
                handleSignOut={() => void handleSignOut()}
              />
            )}
          />
          <Route
            path="/app/admin"
            render={() => (
              user.papel === 'admin' || user.papel === 'lider' ? (
              <DashboardTabPageFrame
                user={user}
                handleSignOut={() => void handleSignOut()}
              >
                <AdminPanel
                  user={user}
                  categorias={categorias}
                  momentos={momentos}
                  estilos={estilos}
                  initialSection={adminInitialSection}
                  onCategoriasChange={carregarCategorias}
                  onMomentosChange={carregarMomentos}
                  onEstilosChange={carregarEstilos}
                />
              </DashboardTabPageFrame>
              ) : (
                <Redirect to="/app/inicio" />
              )
            )}
          />
          <Route
            exact
            path="/app/meu-perfil"
            render={() => (
              <DashboardTabPageFrame user={user} handleSignOut={() => void handleSignOut()}>
                <MeuPerfil user={user} />
              </DashboardTabPageFrame>
            )}
          />
          <Route
            exact
            path="/app/dados-igreja"
            render={() => (
              user.papel === 'admin' ? (
                <DashboardTabPageFrame user={user} handleSignOut={() => void handleSignOut()}>
                  <DadosIgreja user={user} />
                </DashboardTabPageFrame>
              ) : (
                <Redirect to="/app/inicio" />
              )
            )}
          />
          <Redirect exact from="/app" to="/app/inicio" />
        </Switch>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="inicio" href="/app/inicio">
          <IonIcon icon={homeOutline} />
          <IonLabel>Início</IonLabel>
        </IonTabButton>
        <IonTabButton tab="musicas" href="/app/musicas">
          <IonIcon icon={musicalNotesOutline} />
          <IonLabel>Músicas</IonLabel>
        </IonTabButton>
        <IonTabButton tab="escala" href="/app/escala">
          <IonIcon icon={calendarOutline} />
          <IonLabel>Escala</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
    </>
  )
}
