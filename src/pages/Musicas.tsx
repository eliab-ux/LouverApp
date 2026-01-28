import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { CSSProperties } from 'react'
import {
  IonAlert,
  IonButton,
  IonCard,
  IonChip,
  IonGrid,
  IonIcon,
  IonInput,
  IonCol,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonAccordion,
  IonAccordionGroup,
  useIonRouter,
} from '@ionic/react'
import {
  createOutline,
  trashOutline,
  musicalNotesOutline,
  speedometerOutline,
  linkOutline,
  closeOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
  swapVerticalOutline,
} from 'ionicons/icons'
import { supabase } from '../lib/supabase'
import type { AppUser, Musica, Categoria, MomentoCulto, Estilo } from '../types'
import {
  LABEL_CLASSES,
  INPUT_STYLES,
  BUTTON_STYLES,
  ACCORDION_CLASSES,
} from '../styles/form-styles'

interface MusicasProps {
  user: AppUser
  categorias: Categoria[]
  momentos: MomentoCulto[]
  estilos: Estilo[]
}

export function Musicas({
  user,
  categorias,
  momentos,
  estilos,
}: MusicasProps) {
  const router = useIonRouter()
  // Estados de músicas
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [novaMusicaNome, setNovaMusicaNome] = useState('')
  const [novaMusicaBpm, setNovaMusicaBpm] = useState('')
  const [novaMusicaPossuiVs, setNovaMusicaPossuiVs] = useState(false)
  const [novaMusicaTons, setNovaMusicaTons] = useState<string[]>([])
  const [novaMusicaLink, setNovaMusicaLink] = useState('')
  const [novaMusicaCategoriaId, setNovaMusicaCategoriaId] = useState('')
  const [novaMusicaMomentoId, setNovaMusicaMomentoId] = useState('')
  const [novaMusicaEstiloId, setNovaMusicaEstiloId] = useState('')
  const [savingMusica, setSavingMusica] = useState(false)
  const [musicaError, setMusicaError] = useState<string | null>(null)

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('')
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('')
  const [confirmDialogOnConfirm, setConfirmDialogOnConfirm] = useState<null | (() => Promise<void>)>(
    null,
  )

  const iconOnlyButtonStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '6px',
    ['--padding-end']: '6px',
    ['--color']: '#94a3b8',
  }

  const ionSelectSmallStyle: CSSProperties & Record<string, string> = {
    fontSize: '11px',
    ['--placeholder-color']: '#94a3b8',
    ['--color']: '#94a3b8',
  }

  const ionInputItemCompactStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '0px',
    ['--inner-padding-end']: '0px',
    ['--min-height']: '26px',
    ['--background']: 'transparent',
  }

  const ionToggleCompactStyle: CSSProperties & Record<string, string> = {
    transform: 'scale(0.72)',
    ['--track-background']: '#1e3a8a',
    ['--track-background-checked']: '#2563eb',
    ['--handle-background']: '#93c5fd',
    ['--handle-background-checked']: '#1d4ed8',
  }

  const chipOutlineStyleDark: CSSProperties & Record<string, string> = {
    ['--background']: 'transparent',
    ['--border-color']: '#7dd3fc',
    ['--color']: '#e2e8f0',
  }

  const chipOutlineStyleLightText: CSSProperties & Record<string, string> = {
    ['--background']: 'transparent',
    ['--border-color']: '#7dd3fc',
    ['--color']: '#000000',
  }

  // Estados de edição
  const [musicaEditandoId, setMusicaEditandoId] = useState<string | null>(null)
  const [musicaEditandoNome, setMusicaEditandoNome] = useState('')
  const [musicaEditandoBpm, setMusicaEditandoBpm] = useState('')
  const [musicaEditandoTons, setMusicaEditandoTons] = useState<string[]>([])
  const [musicaEditandoCategoriaId, setMusicaEditandoCategoriaId] = useState('')
  const [musicaEditandoMomentoId, setMusicaEditandoMomentoId] = useState('')
  const [musicaEditandoEstiloId, setMusicaEditandoEstiloId] = useState('')
  const [musicaEditandoPossuiVs, setMusicaEditandoPossuiVs] = useState(false)
  const [musicaEditandoLink, setMusicaEditandoLink] = useState('')
  
  // Estados de filtros, busca, ordenação e paginação
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('')
  const [filtroMomentoId, setFiltroMomentoId] = useState('')
  const [filtroEstiloId, setFiltroEstiloId] = useState('')
  const [buscaTexto, setBuscaTexto] = useState('')
  const [ordenacaoDir, setOrdenacaoDir] = useState<'asc' | 'desc'>('asc')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const musicasPorPagina = 5
  
  // CSV import será implementado no AdminPanel

  // Carregar músicas
  const carregarMusicas = useCallback(async () => {
    try {
      setMusicaError(null)
      const { data, error } = await supabase
        .from('musicas')
        .select(
          `id, nome, bpm, possui_vs, links, tons,
           categoria_principal:categoria_principal_id ( id, nome ),
           momento:momento_culto_id ( id, nome ),
           estilo:estilo_id ( id, nome )`,
        )
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        tratarErroMusica(error.message)
        return
      }

      setMusicas((data as unknown as Musica[]) ?? [])
    } catch (e) {
      console.error(e)
      setMusicaError('Erro ao carregar músicas.')
    }
  }, [user.igrejaId])

  useEffect(() => {
    void carregarMusicas()
  }, [carregarMusicas])

  const abrirConfirmacao = (opts: {
    title: string
    message: string
    actionLabel?: string
    onConfirm: () => Promise<void>
  }) => {
    setConfirmDialogTitle(opts.title)
    setConfirmDialogMessage(opts.message)
    setConfirmDialogOnConfirm(() => opts.onConfirm)
    setConfirmDialogOpen(true)
  }

  const tratarErroMusica = (message: string) => {
    if (message.includes('LIMIT_REACHED_MUSICAS')) {
      setMusicaError('Limite de músicas do plano Free atingido. Assine o Pro para liberar mais músicas.')
      window.setTimeout(() => router.push('/app/assinatura', 'forward', 'push'), 600)
      return
    }
    if (message.includes('IGREJA_SUSPENSA')) {
      setMusicaError('Igreja suspensa. Cadastro de músicas bloqueado.')
      return
    }
    setMusicaError(message)
  }

  // CRUD de músicas
  const handleCreateMusica = async (event: FormEvent) => {
    event.preventDefault()
    if (!novaMusicaNome.trim()) return

    setSavingMusica(true)
    setMusicaError(null)

    try {
      const bpmValue = novaMusicaBpm.trim() ? Number(novaMusicaBpm.trim()) : null
      const tonsSelecionados = novaMusicaTons

      const { error } = await supabase.from('musicas').insert({
        nome: novaMusicaNome.trim(),
        igreja_id: user.igrejaId,
        bpm: Number.isNaN(bpmValue) ? null : bpmValue,
        possui_vs: novaMusicaPossuiVs,
        tons: tonsSelecionados.length > 0 ? tonsSelecionados : null,
        links: novaMusicaLink || null,
        categoria_principal_id: novaMusicaCategoriaId || null,
        momento_culto_id: novaMusicaMomentoId || null,
        estilo_id: novaMusicaEstiloId || null,
      })

      if (error) {
        tratarErroMusica(error.message)
        return
      }

      setNovaMusicaNome('')
      setNovaMusicaBpm('')
      setNovaMusicaPossuiVs(false)
      setNovaMusicaTons([])
      setNovaMusicaLink('')
      setNovaMusicaCategoriaId('')
      setNovaMusicaMomentoId('')
      setNovaMusicaEstiloId('')
      await carregarMusicas()
    } catch (e) {
      console.error(e)
      setMusicaError('Erro ao salvar música.')
    } finally {
      setSavingMusica(false)
    }
  }

  const iniciarEdicaoMusica = (musica: Musica) => {
    setMusicaError(null)
    setMusicaEditandoId(musica.id)
    setMusicaEditandoNome(musica.nome)
    setMusicaEditandoBpm(musica.bpm != null ? String(musica.bpm) : '')
    setMusicaEditandoTons(musica.tons ?? [])
    setMusicaEditandoCategoriaId(musica.categoria_principal?.id ?? '')
    setMusicaEditandoMomentoId(musica.momento?.id ?? '')
    setMusicaEditandoEstiloId(musica.estilo?.id ?? '')
    setMusicaEditandoPossuiVs(Boolean(musica.possui_vs))
    setMusicaEditandoLink(musica.links ?? '')
  }

  const cancelarEdicaoMusica = () => {
    setMusicaEditandoId(null)
    setMusicaEditandoNome('')
    setMusicaEditandoBpm('')
    setMusicaEditandoTons([])
    setMusicaEditandoCategoriaId('')
    setMusicaEditandoMomentoId('')
    setMusicaEditandoEstiloId('')
    setMusicaEditandoPossuiVs(false)
    setMusicaEditandoLink('')
  }

  const salvarEdicaoMusica = async (event: FormEvent) => {
    event.preventDefault()
    if (!musicaEditandoId || !musicaEditandoNome.trim()) return

    setSavingMusica(true)
    setMusicaError(null)

    try {
      const bpmValue = musicaEditandoBpm.trim() ? Number(musicaEditandoBpm.trim()) : null

      const { error } = await supabase
        .from('musicas')
        .update({
          nome: musicaEditandoNome.trim(),
          bpm: Number.isNaN(bpmValue) ? null : bpmValue,
          possui_vs: musicaEditandoPossuiVs,
          tons: musicaEditandoTons.length > 0 ? musicaEditandoTons : null,
          links: musicaEditandoLink || null,
          categoria_principal_id: musicaEditandoCategoriaId || null,
          momento_culto_id: musicaEditandoMomentoId || null,
          estilo_id: musicaEditandoEstiloId || null,
        })
        .eq('id', musicaEditandoId)

      if (error) {
        tratarErroMusica(error.message)
        return
      }

      cancelarEdicaoMusica()
      await carregarMusicas()
    } catch (e) {
      console.error(e)
      setMusicaError('Erro ao atualizar música.')
    } finally {
      setSavingMusica(false)
    }
  }

  const excluirMusica = (id: string) => {
    abrirConfirmacao({
      title: 'Excluir música',
      message: 'Tem certeza que deseja excluir esta música?',
      actionLabel: 'Excluir',
      onConfirm: async () => {
        setSavingMusica(true)
        setMusicaError(null)

        try {
          console.log('Excluindo música ID:', id)

          const { error, status } = await supabase.from('musicas').delete().eq('id', id)

          console.log('Resultado da exclusão - Status:', status, 'Error:', error)

          if (error) {
            console.error('Erro ao excluir música:', error)
            setMusicaError(`Erro ao excluir música: ${error.message}`)
            return
          }

          if (musicaEditandoId === id) {
            cancelarEdicaoMusica()
          }

          setMusicas((prev) => prev.filter((m) => m.id !== id))
          console.log('Música removida da lista, recarregando...')
          await carregarMusicas()
          console.log('Lista recarregada com sucesso')
        } catch (e) {
          console.error('Exceção ao excluir música:', e)
          setMusicaError('Erro ao excluir música.')
        } finally {
          setSavingMusica(false)
        }
      },
    })
  }

  // Filtros, busca e ordenação
  const musicasFiltradas = musicas
    .filter((m) => {
      // Busca por texto no nome
      if (buscaTexto.trim()) {
        const termoBusca = buscaTexto.toLowerCase().trim()
        if (!m.nome.toLowerCase().includes(termoBusca)) {
          return false
        }
      }

      if (filtroCategoriaId && m.categoria_principal?.id !== filtroCategoriaId) {
        return false
      }

      if (filtroMomentoId && m.momento?.id !== filtroMomentoId) {
        return false
      }

      if (filtroEstiloId && m.estilo?.id !== filtroEstiloId) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const comparacao = a.nome.localeCompare(b.nome, 'pt-BR')
      return ordenacaoDir === 'asc' ? comparacao : -comparacao
    })

  const totalPaginas = Math.ceil(musicasFiltradas.length / musicasPorPagina)
  const indiceInicio = (paginaAtual - 1) * musicasPorPagina
  const indiceFim = indiceInicio + musicasPorPagina
  const musicasPaginadas = musicasFiltradas.slice(indiceInicio, indiceFim)

  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroCategoriaId, filtroMomentoId, filtroEstiloId, buscaTexto, ordenacaoDir])

  return (
    <main className="space-y-4">
      <section className="w-full rounded-2xl bg-slate-900/50 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-xs">
              🎵
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Músicas</h2>
            </div>
          </div>
          {/* ... (rest of the code remains the same) */}
        </div>

        {/* Busca e Ordenação */}
        <IonGrid className="ion-no-padding">
          <IonRow>
            <IonCol size="12">
              <div className="w-full max-w-[340px]">
                <IonSearchbar
                  value={buscaTexto}
                  onIonInput={(e) => setBuscaTexto(String(e.detail.value ?? ''))}
                  placeholder="Buscar música"
                  className="compact-search"
                  style={{ fontSize: '14px', ...ionSelectSmallStyle }}
                />
              </div>
            </IonCol>
          </IonRow>

          {/* Filtros */}
          <IonRow>
            <IonCol size="6">
              <label className="block text-[11px] text-slate-900 mb-1" style={{ marginLeft: '5px' }}>
                Ordenação
              </label>
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => setOrdenacaoDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                style={{
                  marginLeft: '5px',
                  ...iconOnlyButtonStyle,
                }}
              >
                <IonIcon
                  slot="icon-only"
                  icon={swapVerticalOutline}
                  style={{ transform: ordenacaoDir === 'asc' ? 'none' : 'rotate(180deg)' }}
                />
              </IonButton>
            </IonCol>

            <IonCol size="6">
              <label className="block text-[11px] text-slate-900 mb-1" style={{ marginLeft: '5px' }}>
                Categoria
              </label>
              <IonSelect
                value={filtroCategoriaId}
                interface="popover"
                placeholder="Todas"
                onIonChange={(e) => setFiltroCategoriaId(String(e.detail.value ?? ''))}
                interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                style={{
                  marginLeft: '5px',
                  ...ionSelectSmallStyle,
                }}
              >
                <IonSelectOption value="">Todas</IonSelectOption>
                {categorias.map((cat) => (
                  <IonSelectOption key={cat.id} value={cat.id}>
                    {cat.nome}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonCol>

            <IonCol size="6">
              <label className="block text-[11px] text-slate-900 mb-1" style={{ marginLeft: '5px' }}>
                Momento
              </label>
              <IonSelect
                value={filtroMomentoId}
                interface="popover"
                placeholder="Todos"
                onIonChange={(e) => setFiltroMomentoId(String(e.detail.value ?? ''))}
                interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                style={{
                  marginLeft: '5px',
                  ...ionSelectSmallStyle,
                }}
              >
                <IonSelectOption value="">Todos</IonSelectOption>
                {momentos.map((m) => (
                  <IonSelectOption key={m.id} value={m.id}>
                    {m.nome}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonCol>

            <IonCol size="6">
              <label className="block text-[11px] text-slate-900 mb-1" style={{ marginLeft: '5px' }}>
                Estilo
              </label>
              <IonSelect
                value={filtroEstiloId}
                interface="popover"
                placeholder="Todos"
                onIonChange={(e) => setFiltroEstiloId(String(e.detail.value ?? ''))}
                interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                style={{
                  marginLeft: '5px',
                  ...ionSelectSmallStyle,
                }}
              >
                <IonSelectOption value="">Todos</IonSelectOption>
                {estilos.map((est) => (
                  <IonSelectOption key={est.id} value={est.id}>
                    {est.nome}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonCol>
          </IonRow>
        </IonGrid>

        {(filtroCategoriaId || filtroMomentoId || filtroEstiloId || buscaTexto) && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFiltroCategoriaId('')
                setFiltroMomentoId('')
                setFiltroEstiloId('')
                setBuscaTexto('')
              }}
              className="px-2 py-1 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {musicaError && (
          <p className="mb-2 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {musicaError}
          </p>
        )}
        {musicasFiltradas.length === 0 ? (
          <p className="text-sm text-slate-300">Nenhuma música encontrada com os filtros atuais.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-[10px] font-medium leading-tight text-slate-400 mb-2" style={{ paddingLeft: '5px', paddingRight: '5px' }}>
              <span className="text-[10px] font-medium leading-tight">
                {indiceInicio + 1} a {Math.min(indiceFim, musicasFiltradas.length)} de {musicasFiltradas.length} música{musicasFiltradas.length !== 1 ? 's' : ''}
              </span>
              {totalPaginas > 1 && (
                <div className="flex items-center gap-2" style={{ paddingRight: '5px' }}>
                  <button
                    type="button"
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-2 py-1 rounded border border-slate-600 text-[9px] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <IonIcon icon={chevronBackOutline} />
                  </button>
                  <span className="text-[10px] font-medium leading-tight">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-2 py-1 rounded border border-slate-600 text-[9px] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Próxima página"
                  >
                    <IonIcon icon={chevronForwardOutline} />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {musicasPaginadas.map((m) => {
                return (
                  <IonCard key={m.id} className="p-3 shadow-sm">
                    {musicaEditandoId === m.id ? (
                      <form onSubmit={salvarEdicaoMusica} className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <IonInput
                            value={musicaEditandoNome}
                            onIonInput={(e) => setMusicaEditandoNome(String(e.detail.value ?? ''))}
                            className="flex-1"
                            style={{ fontSize: '10.5px' }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>BPM</label>
                            <IonInput
                              type="number"
                              value={musicaEditandoBpm}
                              onIonInput={(e) => setMusicaEditandoBpm(String(e.detail.value ?? ''))}
                              style={{ fontSize: '10.5px' }}
                            />
                          </div>
                          <div>
                            <span className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>Tons</span>
                            <IonSelect
                              multiple
                              interface="alert"
                              interfaceOptions={{
                                header: 'Tons',
                                subHeader: 'Selecione um ou mais tons',
                                cssClass: 'musicas-select-alert-small',
                              }}
                              value={musicaEditandoTons}
                              onIonChange={(e) => setMusicaEditandoTons((e.detail.value as string[]) ?? [])}
                              style={{ fontSize: '10.5px' }}
                            >
                              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((tom) => (
                                <IonSelectOption key={tom} value={tom}>
                                  {tom}
                                </IonSelectOption>
                              ))}
                            </IonSelect>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>Categoria</label>
                            <IonSelect
                              value={musicaEditandoCategoriaId}
                              interface="popover"
                              onIonChange={(e) => setMusicaEditandoCategoriaId(String(e.detail.value ?? ''))}
                              interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                              style={{ fontSize: '10.5px' }}
                            >
                              <IonSelectOption value="">--</IonSelectOption>
                              {categorias.map((cat) => (
                                <IonSelectOption key={cat.id} value={cat.id}>
                                  {cat.nome}
                                </IonSelectOption>
                              ))}
                            </IonSelect>
                          </div>
                          <div>
                            <label className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>Momento</label>
                            <IonSelect
                              value={musicaEditandoMomentoId}
                              interface="popover"
                              onIonChange={(e) => setMusicaEditandoMomentoId(String(e.detail.value ?? ''))}
                              interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                              style={{ fontSize: '10.5px' }}
                            >
                              <IonSelectOption value="">--</IonSelectOption>
                              {momentos.map((mom) => (
                                <IonSelectOption key={mom.id} value={mom.id}>
                                  {mom.nome}
                                </IonSelectOption>
                              ))}
                            </IonSelect>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-end">
                          <div>
                            <label className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>Estilo</label>
                            <IonSelect
                              value={musicaEditandoEstiloId}
                              interface="popover"
                              onIonChange={(e) => setMusicaEditandoEstiloId(String(e.detail.value ?? ''))}
                              interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                              style={{ fontSize: '10.5px' }}
                            >
                              <IonSelectOption value="">--</IonSelectOption>
                              {estilos.map((est) => (
                                <IonSelectOption key={est.id} value={est.id}>
                                  {est.nome}
                                </IonSelectOption>
                              ))}
                            </IonSelect>
                          </div>

                          <div className="flex items-center justify-between gap-2 rounded-md bg-slate-900 px-2 py-1">
                            <span className="text-[11px] text-slate-200 font-semibold" style={{ fontWeight: 700 }}>Possui VS</span>
                            <IonToggle
                              color="primary"
                              checked={musicaEditandoPossuiVs}
                              onIonChange={(e) => setMusicaEditandoPossuiVs(Boolean(e.detail.checked))}
                              className="origin-right"
                              style={ionToggleCompactStyle}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] mb-1 font-semibold" style={{ fontWeight: 700 }}>Link da música</label>
                          <IonInput
                            type="url"
                            value={musicaEditandoLink}
                            onIonInput={(e) => setMusicaEditandoLink(String(e.detail.value ?? ''))}
                            placeholder="https://www.youtube.com/..."
                            style={{ fontSize: '10.5px' }}
                          />
                        </div>

                        <div className="flex justify-end gap-2 mt-1">
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onClick={cancelarEdicaoMusica}
                            disabled={savingMusica}
                            aria-label="Cancelar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={closeOutline} />
                          </IonButton>
                          <IonButton
                            type="submit"
                            fill="clear"
                            size="small"
                            disabled={savingMusica}
                            aria-label="Salvar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={checkmarkOutline} />
                          </IonButton>
                        </div>
                      </form>
                    ) : (
                      <IonList lines="none" className="p-0 m-0">
                        <IonItem
                          className="ion-no-padding"
                          style={ionInputItemCompactStyle}
                        >
                          <IonLabel>
                            <p className="text-[13px] font-bold text-slate-100 truncate">{m.nome}</p>
                            {(() => {
                              const info = [m.categoria_principal?.nome, m.momento?.nome, m.estilo?.nome].filter(Boolean)
                              if (info.length === 0) return null
                              return (
                                <p
                                  className="mt-1 text-[10px] text-slate-400 leading-none"
                                  style={{
                                    transform: 'scale(0.75)',
                                    transformOrigin: 'left top',
                                    display: 'block',
                                    width: '133.3333%',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: '1',
                                  }}
                                >
                                  {info.join(' • ')}
                                </p>
                              )
                            })()}

                            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
                              <div className="flex flex-wrap items-center gap-2">
                                {m.tons && m.tons.length > 0 && (
                                  <IonChip
                                    outline
                                    className="h-5 text-[10px]"
                                    style={chipOutlineStyleLightText}
                                  >
                                    <IonIcon icon={musicalNotesOutline} style={{ color: '#34d399' }} />
                                    <span>{m.tons.join(', ')}</span>
                                  </IonChip>
                                )}
                                {m.bpm != null && (
                                  <IonChip
                                    outline
                                    className="h-5 text-[10px]"
                                    style={chipOutlineStyleLightText}
                                  >
                                    <IonIcon icon={speedometerOutline} style={{ color: '#38bdf8' }} />
                                    <span>{m.bpm}</span>
                                  </IonChip>
                                )}
                                {m.links && (
                                  <IonChip
                                    outline
                                    className="h-5 text-[10px]"
                                    style={chipOutlineStyleDark}
                                    onClick={() => window.open(m.links as string, '_blank', 'noopener,noreferrer')}
                                  >
                                    <IonIcon icon={linkOutline} style={{ color: '#818cf8' }} />
                                  </IonChip>
                                )}
                                {m.possui_vs && (
                                  <IonChip
                                    outline
                                    className="h-5 text-[10px]"
                                    style={chipOutlineStyleDark}
                                  >
                                    <span>VS</span>
                                  </IonChip>
                                )}
                              </div>

                              <div className="ml-auto flex items-center gap-1">
                                {(user.papel === 'admin' || user.papel === 'lider') && (
                                  <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => iniciarEdicaoMusica(m)}
                                    className="m-0 h-6"
                                  >
                                    <IonIcon slot="icon-only" icon={createOutline} />
                                  </IonButton>
                                )}
                                {user.papel === 'admin' && (
                                  <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => excluirMusica(m.id)}
                                    disabled={savingMusica}
                                    className="m-0 h-6"
                                  >
                                    <IonIcon slot="icon-only" icon={trashOutline} />
                                  </IonButton>
                                )}
                              </div>
                            </div>
                          </IonLabel>
                        </IonItem>
                      </IonList>
                    )}
                  </IonCard>
                )
              })}
            </div>
          </>
        )}
      </section>

      {(user.papel === 'admin' || user.papel === 'lider') && (
        <IonAccordionGroup
          className="rounded-2xl bg-slate-900/80 p-2 text-sm shadow-sm mt-5"
          style={{ marginLeft: '5px', marginRight: '5px' }}
        >
          <IonAccordion value="nova-musica">
            <IonItem slot="header" lines="none" className="ion-no-padding">
              <IonIcon slot="start" icon={musicalNotesOutline} />
              <IonLabel>
                <h2 className={ACCORDION_CLASSES.header}>Nova música</h2>
              </IonLabel>
            </IonItem>

            <div slot="content" className="p-3">
              <form onSubmit={handleCreateMusica} className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <IonInput
                    value={novaMusicaNome}
                    onIonInput={(e) => setNovaMusicaNome(String(e.detail.value ?? ''))}
                    placeholder="Ex: Grande é o Senhor"
                    style={INPUT_STYLES.default}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASSES.field + ' block mb-1'}>
                      BPM
                    </label>
                    <IonInput
                      type="number"
                      value={novaMusicaBpm}
                      onIonInput={(e) => setNovaMusicaBpm(String(e.detail.value ?? ''))}
                      placeholder="Ex: 138"
                      style={INPUT_STYLES.default}
                    />
                  </div>
                  <div>
                    <span className={LABEL_CLASSES.field + ' block mb-1'}>
                      Tons
                    </span>
                    <IonSelect
                      multiple
                      interface="alert"
                      interfaceOptions={{
                        header: 'Tons',
                        subHeader: 'Selecione um ou mais tons',
                        cssClass: 'musicas-select-alert-small',
                      }}
                      value={novaMusicaTons}
                      onIonChange={(e) => setNovaMusicaTons((e.detail.value as string[]) ?? [])}
                      style={INPUT_STYLES.default}
                    >
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((tom) => (
                        <IonSelectOption key={tom} value={tom}>
                          {tom}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLASSES.field + ' block mb-1'}>
                      Categoria
                    </label>
                    <IonSelect
                      value={novaMusicaCategoriaId}
                      interface="popover"
                      placeholder="Selecione"
                      onIonChange={(e) => setNovaMusicaCategoriaId(String(e.detail.value ?? ''))}
                      interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                      style={INPUT_STYLES.default}
                    >
                      <IonSelectOption value="">Selecione</IonSelectOption>
                      {categorias.map((cat) => (
                        <IonSelectOption key={cat.id} value={cat.id}>
                          {cat.nome}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                  <div>
                    <label className={LABEL_CLASSES.field + ' block mb-1'}>
                      Momento
                    </label>
                    <IonSelect
                      value={novaMusicaMomentoId}
                      interface="popover"
                      placeholder="Selecione"
                      onIonChange={(e) => setNovaMusicaMomentoId(String(e.detail.value ?? ''))}
                      interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                      style={INPUT_STYLES.default}
                    >
                      <IonSelectOption value="">Selecione</IonSelectOption>
                      {momentos.map((mom) => (
                        <IonSelectOption key={mom.id} value={mom.id}>
                          {mom.nome}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className={LABEL_CLASSES.field + ' block mb-1'}>
                      Estilo
                    </label>
                    <IonSelect
                      value={novaMusicaEstiloId}
                      interface="popover"
                      placeholder="Selecione"
                      onIonChange={(e) => setNovaMusicaEstiloId(String(e.detail.value ?? ''))}
                      interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
                      style={INPUT_STYLES.default}
                    >
                      <IonSelectOption value="">Selecione</IonSelectOption>
                      {estilos.map((est) => (
                        <IonSelectOption key={est.id} value={est.id}>
                          {est.nome}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-md bg-slate-900 px-2 py-1">
                    <span className={LABEL_CLASSES.field + ' text-slate-200'}>
                      Possui VS
                    </span>
                    <IonToggle
                      color="primary"
                      checked={novaMusicaPossuiVs}
                      onIonChange={(e) => setNovaMusicaPossuiVs(Boolean(e.detail.checked))}
                      className="origin-right"
                      style={ionToggleCompactStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASSES.field + ' block mb-1'}>
                    Link da música
                  </label>
                  <IonInput
                    type="url"
                    value={novaMusicaLink}
                    onIonInput={(e) => setNovaMusicaLink(String(e.detail.value ?? ''))}
                    placeholder="https://www.youtube.com/..."
                    style={INPUT_STYLES.default}
                  />
                </div>

                <div className="pt-2">
                  <IonButton
                    type="submit"
                    expand="block"
                    disabled={savingMusica}
                    size="small"
                    style={BUTTON_STYLES.primary}
                  >
                    {savingMusica ? 'Salvando...' : 'Adicionar música'}
                  </IonButton>
                </div>
              </form>
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      )}

      <IonAlert
        isOpen={confirmDialogOpen}
        onDidDismiss={() => setConfirmDialogOpen(false)}
        header={confirmDialogTitle}
        message={confirmDialogMessage || 'Essa ação não pode ser desfeita.'}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Excluir',
            role: 'destructive',
            handler: () => {
              void (async () => {
                try {
                  await confirmDialogOnConfirm?.()
                } catch (e) {
                  console.error(e)
                } finally {
                  setConfirmDialogOpen(false)
                }
              })()
            },
          },
        ]}
      />
    </main>
  )
}
