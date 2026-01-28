import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonReorderGroup,
  IonReorder,
} from '@ionic/react'
import {
  addOutline,
  trashOutline,
  downloadOutline,
  createOutline,
  closeOutline,
  globeOutline,
  star,
  starOutline,
  chevronBackOutline,
  chevronForwardOutline,
  musicalNote,
} from 'ionicons/icons'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  AppUser,
  Evento,
  Escala as EscalaType,
  Escalado,
  EscalaMusica,
  Indisponibilidade,
  Musica,
  TipoEvento,
  Usuario,
} from '../../../types'
import {
  LABEL_CLASSES,
  INPUT_STYLES,
  BUTTON_STYLES,
  TEXT_CLASSES,
} from '../../../styles/form-styles'
import { MedleyPickerModal } from './MedleyPickerModal'
import { MemberPickerModal } from './MemberPickerModal'

export default function AgendaSection(props: {
  user: AppUser

  mesExportacao: string
  setMesExportacao: (v: string) => void
  handleImprimirEscalaMensal: () => void

  filtroStatusEvento: 'todos' | 'publicados' | 'publicados_em_edicao' | 'nao_publicados'
  setFiltroStatusEvento: (v: 'todos' | 'publicados' | 'publicados_em_edicao' | 'nao_publicados') => void
  setPaginaEventos: (v: number) => void

  eventosFiltradosPorStatus: Evento[]

  eventoError: string | null
  escalaError: string | null

  tiposEvento: TipoEvento[]
  novoEventoTipoEventoId: string
  setNovoEventoTipoEventoId: (v: string) => void
  novoEventoData: string
  setNovoEventoData: (v: string) => void
  novoEventoHora: string
  setNovoEventoHora: (v: string) => void
  criarEvento: (event: FormEvent) => void

  EVENTOS_POR_PAGINA: number
  eventos: Evento[]
  eventosPaginaAtual: Evento[]
  paginaEventos: number
  totalPaginasEventos: number

  escalas: EscalaType[]
  escalados: Escalado[]
  escalaMusicas: EscalaMusica[]

  eventosPublicadosEmEdicao: Set<string>

  eventoSelecionadoId: string | null
  setEventoSelecionadoId: (v: string | null | ((prev: string | null) => string | null)) => void

  membros: Usuario[]
  todasIndisponibilidades: Indisponibilidade[]

  novoEscaladoUsuarioId: string
  setNovoEscaladoUsuarioId: (v: string) => void
  novoEscaladoFuncao: string
  setNovoEscaladoFuncao: (v: string) => void
  adicionarEscalado: () => void

  musicas: Musica[]
  novaMusicaId: string
  setNovaMusicaId: (v: string) => void
  novaMusicaTom: string
  setNovaMusicaTom: (v: string) => void

  tipoItemRepertorio: 'song' | 'medley'
  setTipoItemRepertorio: (v: 'song' | 'medley') => void
  medleySongIds: string[]
  setMedleySongIds: (v: string[]) => void
  medleyModalOpen: boolean
  setMedleyModalOpen: (v: boolean) => void

  adicionarMusicaEscala: (eventoId: string) => void
  reordenarMusicasEscala: (eventoId: string, musicasOrdenadas: EscalaMusica[]) => void

  removerMusicaEscala: (id: string) => void
  alternarMinistrante: (id: string, next: boolean) => void
  removerEscalado: (id: string) => void

  publicarEscala: (eventoId: string) => void
  excluirEvento: (eventoId: string) => void
}) {
  // Ref para controlar o modal de data (fecha automaticamente ao selecionar)
  const modalDataRef = useRef<HTMLIonModalElement>(null)

  // Estado para controlar o modal de seleção de membro
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)

  const {
    user,
    mesExportacao,
    setMesExportacao,
    handleImprimirEscalaMensal,
    filtroStatusEvento,
    setFiltroStatusEvento,
    setPaginaEventos,
    eventosFiltradosPorStatus,
    eventoError,
    escalaError,
    tiposEvento,
    novoEventoTipoEventoId,
    setNovoEventoTipoEventoId,
    novoEventoData,
    setNovoEventoData,
    novoEventoHora,
    setNovoEventoHora,
    criarEvento,
    EVENTOS_POR_PAGINA,
    eventos,
    eventosPaginaAtual,
    paginaEventos,
    totalPaginasEventos,
    escalas,
    escalados,
    escalaMusicas,
    eventosPublicadosEmEdicao,
    eventoSelecionadoId,
    setEventoSelecionadoId,
    membros,
    todasIndisponibilidades,
    novoEscaladoUsuarioId,
    setNovoEscaladoUsuarioId,
    novoEscaladoFuncao,
    setNovoEscaladoFuncao,
    adicionarEscalado,
    musicas,
    novaMusicaId,
    setNovaMusicaId,
    novaMusicaTom,
    setNovaMusicaTom,
    tipoItemRepertorio,
    setTipoItemRepertorio,
    medleySongIds,
    setMedleySongIds,
    medleyModalOpen,
    setMedleyModalOpen,
    adicionarMusicaEscala,
    reordenarMusicasEscala,
    removerMusicaEscala,
    alternarMinistrante,
    removerEscalado,
    publicarEscala,
    excluirEvento,
  } = props

  // Estilos removidos - usando constantes globais de form-styles.ts

  const normalizeDateOnly = (value: string) => {
    const v = String(value)
    if (!v) return ''
    return v.includes('T') ? v.split('T')[0] : v
  }

  const formatDatePtBr = (value: string) => {
    if (!value) return ''
    const d = value.includes('T') ? new Date(value) : new Date(value + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-BR')
  }

  const normalizeTimeHHMM = (value: string) => {
    const v = String(value)
    if (!v) return ''
    if (v.includes('T')) return v.split('T')[1]?.slice(0, 5) ?? ''
    return v.slice(0, 5)
  }

  const timeValueForDatetime = (hhmm: string) => (hhmm ? `1970-01-01T${hhmm}:00` : '')

  const nomeTipoEvento = (evento: Evento) => evento.tipo_evento?.nome ?? 'Tipo'

  return (
    <div className="space-y-3">
      <IonCard className="p-3 shadow-sm">
        {(user.papel === 'admin' || user.papel === 'lider') && (
          <div className="mb-3 flex items-end justify-between gap-2 flex-wrap">
            <div>
              <label className={LABEL_CLASSES.small + ' block mb-1'} htmlFor="mesExportacao">
                Mês para exportação
              </label>
              <input
                id="mesExportacao"
                type="month"
                value={mesExportacao}
                onChange={(e) => setMesExportacao(e.target.value)}
                className="rounded-xl bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <IonButton
              type="button"
              fill="clear"
              size="small"
              onClick={handleImprimirEscalaMensal}
              aria-label="Baixar PNG da escala mensal"
              className="m-0 h-7"
              style={BUTTON_STYLES.icon}
            >
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="min-w-0">
            <IonSelect
              label="Status"
              labelPlacement="stacked"
              value={filtroStatusEvento}
              interface="popover"
              placeholder="Todos"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onIonChange={(e) => {
                setFiltroStatusEvento(
                  String(e.detail.value ?? 'todos') as
                    | 'todos'
                    | 'publicados'
                    | 'publicados_em_edicao'
                    | 'nao_publicados',
                )
                setPaginaEventos(1)
              }}
              style={INPUT_STYLES.selectSmall}
              interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
            >
              <IonSelectOption value="todos">Todos</IonSelectOption>
              <IonSelectOption value="publicados">Publicados</IonSelectOption>
              <IonSelectOption value="publicados_em_edicao">Publicado (Em edição)</IonSelectOption>
              <IonSelectOption value="nao_publicados">Não publicados</IonSelectOption>
            </IonSelect>
          </div>

          <p className={`${LABEL_CLASSES.small} text-right`}>
            {eventosFiltradosPorStatus.length} evento{eventosFiltradosPorStatus.length !== 1 ? 's' : ''}
          </p>
        </div>
      </IonCard>

      {(user.papel === 'admin' || user.papel === 'lider') && (
        <div className="rounded-xl bg-white dark:bg-neutral-800 overflow-hidden">
          <IonAccordionGroup>
            <IonAccordion value="criar-evento">
              <IonItem slot="header" className="px-4 py-2">
                <IonLabel>
                  <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100">Criar Evento</h2>
                </IonLabel>
              </IonItem>

              <div slot="content" className="p-4 space-y-4">
                {(eventoError || escalaError) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-900/20">
                    <span className="text-error-600 dark:text-error-400 text-sm">⚠️</span>
                    <p className="text-xs md:text-sm text-error-700 dark:text-error-300">
                      {eventoError || escalaError}
                    </p>
                  </div>
                )}

                <form onSubmit={criarEvento} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <IonSelect
                        label="Tipo *"
                        labelPlacement="stacked"
                        value={novoEventoTipoEventoId}
                        interface="popover"
                        placeholder="Selecione"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onIonChange={(e) => setNovoEventoTipoEventoId(String(e.detail.value ?? ''))}
                        style={{ width: '100%', ...INPUT_STYLES.selectSmall }}
                      >
                        {(tiposEvento.length > 0
                          ? tiposEvento
                          : ([
                              { id: '11111111-1111-1111-1111-111111111111', nome: 'Culto', ordem: 1 },
                              { id: '22222222-2222-2222-2222-222222222222', nome: 'Ensaio', ordem: 2 },
                            ] as TipoEvento[])
                        ).map((t) => (
                          <IonSelectOption key={t.id} value={t.id}>
                            {t.nome}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="dataEvento">
                        Data *
                      </label>
                      <div
                        className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-3 py-2"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-900 dark:text-neutral-100">
                            {novoEventoData ? formatDatePtBr(novoEventoData) || 'Selecionar data' : 'Selecionar data'}
                          </span>
                          <IonDatetimeButton datetime="dataEvento" className="datetime-button-small" />
                        </div>

                        <IonModal ref={modalDataRef} keepContentsMounted>
                          <IonDatetime
                            id="dataEvento"
                            presentation="date"
                            locale="pt-BR"
                            formatOptions={{ date: { day: '2-digit', month: '2-digit', year: 'numeric' } }}
                            value={novoEventoData ? normalizeDateOnly(novoEventoData) : undefined}
                            min={new Date().toISOString().split('T')[0]}
                            onIonChange={(e) => {
                              const next = String(e.detail.value ?? '')
                              setNovoEventoData(normalizeDateOnly(next))
                              modalDataRef.current?.dismiss()
                            }}
                          />
                        </IonModal>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="horaEvento">
                        Hora *
                      </label>
                      <div
                        className="rounded-lg bg-neutral-50 dark:bg-neutral-700 px-3 py-2"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-900 dark:text-neutral-100">{novoEventoHora || 'Selecionar hora'}</span>
                          <IonDatetimeButton datetime="horaEvento" className="datetime-button-small" />
                        </div>

                        <IonModal keepContentsMounted>
                          <IonDatetime
                            id="horaEvento"
                            presentation="time"
                            value={novoEventoHora ? timeValueForDatetime(novoEventoHora) : undefined}
                            onIonChange={(e) => {
                              const next = String(e.detail.value ?? '')
                              setNovoEventoHora(normalizeTimeHHMM(next))
                            }}
                          />
                        </IonModal>
                      </div>
                    </div>
                  </div>

                  <IonButton
                    type="submit"
                    expand="block"
                    size="small"
                    style={BUTTON_STYLES.primary}
                    className="mt-4"
                  >
                    Criar Evento
                  </IonButton>
                </form>
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        </div>
      )}

      {eventos.length === 0 ? (
        <IonCard className="p-3 shadow-sm">
          <div className="bg-slate-900/60 rounded-2xl p-5 text-center text-sm text-slate-400">
            Nenhum evento cadastrado ainda.
            {(user.papel === 'admin' || user.papel === 'lider') && (
              <p className="mt-2 text-xs text-emerald-400">Em breve você poderá criar eventos e montar escalas!</p>
            )}
          </div>
        </IonCard>
      ) : (
        <div className="space-y-3">
          {eventosPaginaAtual.map((evento) => {
              const escalaDoEvento = escalas.find((e) => e.evento_id === evento.id)
              const escaladosDoEvento = escalaDoEvento ? escalados.filter((e) => e.escala_id === escalaDoEvento.id) : []

              const escalaPublicada = escalaDoEvento?.publicada ?? false
              const escalaPublicadaEmEdicao = eventosPublicadosEmEdicao.has(evento.id)
              const musicasDoEvento = escalaDoEvento ? escalaMusicas.filter((em) => em.escala_id === escalaDoEvento.id) : []

              const isMinistranteDoEvento =
                !!escalaDoEvento && escaladosDoEvento.some((e) => e.usuario_id === user.id && e.is_ministrante)

              const podeEditarEscalados = user.papel === 'admin' || user.papel === 'lider'
              const podeEditarMusicas =
                user.papel === 'admin' || user.papel === 'lider' || (escalaPublicada && isMinistranteDoEvento)

              const podeAbrirEditor = podeEditarEscalados || podeEditarMusicas

              return (
                <IonCard key={evento.id} className="p-3 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className={`${LABEL_CLASSES.item} truncate`}>
                        {nomeTipoEvento(evento)} {new Date(evento.data + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
                        {evento.hora}
                      </h3>
                    </div>

                    <div className="flex items-start gap-2 flex-wrap justify-end">
                      {escalaPublicadaEmEdicao ? (
                        <span className={`${TEXT_CLASSES.badge} bg-amber-400 text-slate-900 whitespace-nowrap`}>
                          🟡 Publicado (Em edição)
                        </span>
                      ) : escalaPublicada ? (
                        <span className={`${TEXT_CLASSES.badge} bg-emerald-500 text-slate-900 whitespace-nowrap`}>
                          🟢 Escala publicada
                        </span>
                      ) : (
                        <span className={`${TEXT_CLASSES.badge} bg-red-500/10 text-red-200 whitespace-nowrap`}>
                          🔴 Escala não publicada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className={`${LABEL_CLASSES.field} text-slate-400`}>🎵 Músicas</p>

                    {musicasDoEvento.length > 0 ? (
                      <div className="space-y-2">
                        <IonReorderGroup
                          disabled={!podeEditarMusicas}
                          onIonItemReorder={(event) => {
                            const from = event.detail.from
                            const to = event.detail.to
                            const reordered = [...musicasDoEvento]
                            const [movedItem] = reordered.splice(from, 1)
                            reordered.splice(to, 0, movedItem)

                            // Atualizar a ordem no array
                            const musicasComNovaOrdem = reordered.map((m, idx) => ({
                              ...m,
                              ordem: idx + 1
                            }))

                            reordenarMusicasEscala(evento.id, musicasComNovaOrdem)
                            event.detail.complete()
                          }}
                        >
                          {musicasDoEvento.map((em) => {
                            const nomesMusicas = em.musicas && em.musicas.length > 0
                              ? em.musicas.map((m) => m.nome).join(' / ')
                              : 'Músicas'

                            return (
                              <IonItem key={em.id} lines="none" className="rounded-xl bg-slate-900/40 mb-2">
                                <IonLabel className="py-2">
                                  <span className={LABEL_CLASSES.field}>
                                    {nomesMusicas}
                                    {em.tom_escolhido ? ` | Tom: ${em.tom_escolhido}` : ''}
                                  </span>
                                </IonLabel>

                                {podeEditarMusicas && (
                                  <>
                                    <IonButton
                                      slot="end"
                                      type="button"
                                      fill="clear"
                                      size="small"
                                      color="danger"
                                      onClick={() => removerMusicaEscala(em.id)}
                                      aria-label="Remover música"
                                      className="m-0"
                                    >
                                      <IonIcon slot="icon-only" icon={trashOutline} />
                                    </IonButton>

                                    <IonReorder slot="end">
                                      <IonIcon icon={musicalNote} className="text-slate-400" />
                                    </IonReorder>
                                  </>
                                )}
                              </IonItem>
                            )
                          })}
                        </IonReorderGroup>
                      </div>
                    ) : (
                      <p className={`${LABEL_CLASSES.field} text-slate-400`}>Nenhuma música adicionada para este evento.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className={`${LABEL_CLASSES.field} text-slate-400`}>👤 Membros escalados</p>

                    {escaladosDoEvento.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {escaladosDoEvento.map((esc) => (
                          <div
                            key={esc.id}
                            className={`flex items-center justify-between gap-2 ${LABEL_CLASSES.field} text-slate-200`}
                          >
                            <div className="min-w-0 flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{esc.usuario?.nome ?? 'Membro'}</span>
                              {esc.is_ministrante && <span className="text-[12px] text-amber-400">⭐</span>}
                              <span className="text-slate-400">- {esc.funcao}</span>
                            </div>
                            {podeEditarEscalados && (
                              <div className="shrink-0 flex items-center gap-1">
                                <IonButton
                                  type="button"
                                  fill="clear"
                                  size="small"
                                  color="warning"
                                  onClick={() => alternarMinistrante(esc.id, !esc.is_ministrante)}
                                  aria-label={esc.is_ministrante ? 'Remover ministrante' : 'Definir como ministrante'}
                                  className="m-0 h-7"
                                >
                                  <IonIcon slot="icon-only" icon={esc.is_ministrante ? star : starOutline} />
                                </IonButton>
                                <IonButton
                                  type="button"
                                  fill="clear"
                                  size="small"
                                  color="danger"
                                  onClick={() => removerEscalado(esc.id)}
                                  aria-label="Remover membro"
                                  className="m-0 h-7"
                                >
                                  <IonIcon slot="icon-only" icon={trashOutline} />
                                </IonButton>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`${LABEL_CLASSES.field} text-slate-400`}>Nenhum membro escalado ainda para este evento.</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end pt-1">
                    {podeAbrirEditor && (
                      <IonButton
                        type="button"
                        fill="clear"
                        size="small"
                        onClick={() => setEventoSelecionadoId((prev) => (prev === evento.id ? null : evento.id))}
                        aria-label={eventoSelecionadoId === evento.id ? 'Fechar editor' : 'Abrir editor'}
                        className="m-0 h-7"
                      >
                        <IonIcon slot="icon-only" icon={eventoSelecionadoId === evento.id ? closeOutline : createOutline} />
                      </IonButton>
                    )}
                    {(user.papel === 'admin' || user.papel === 'lider') && !escalaPublicada && (
                      <IonButton
                        type="button"
                        fill="clear"
                        size="small"
                        onClick={() => publicarEscala(evento.id)}
                        aria-label="Publicar escala"
                        className="m-0 h-7"
                      >
                        <IonIcon slot="icon-only" icon={globeOutline} />
                      </IonButton>
                    )}
                    {user.papel === 'admin' && (
                      <IonButton
                        type="button"
                        fill="clear"
                        size="small"
                        color="danger"
                        onClick={() => excluirEvento(evento.id)}
                        aria-label="Excluir evento"
                        className="m-0 h-7"
                      >
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonButton>
                    )}
                  </div>

                  {eventoSelecionadoId === evento.id && podeAbrirEditor && (
                    <div className="mt-2 bg-slate-950/50 rounded-xl p-4 space-y-3">
                      {podeEditarEscalados && (
                        <>
                          <IonList className="bg-transparent p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <IonItem
                                lines="none"
                                className="rounded-xl bg-slate-900/60 cursor-pointer"
                                button
                                onClick={() => setMemberPickerOpen(true)}
                              >
                                <div className="flex flex-col py-2 w-full">
                                  <label className={LABEL_CLASSES.field + ' text-slate-400'}>Membro</label>
                                  <div className={LABEL_CLASSES.field + ' mt-1'}>
                                    {novoEscaladoUsuarioId
                                      ? membros.find((m) => m.id === novoEscaladoUsuarioId)?.nome ?? 'Selecione um membro'
                                      : 'Selecione um membro'}
                                  </div>
                                </div>
                              </IonItem>

                              <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                <IonInput
                                  label="Função"
                                  labelPlacement="stacked"
                                  type="text"
                                  value={novoEscaladoFuncao}
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onIonInput={(e) => setNovoEscaladoFuncao(String(e.detail.value ?? ''))}
                                  placeholder="Ex: Voz, Teclado, Bateria..."
                                  style={INPUT_STYLES.default}
                                />
                              </IonItem>

                              <div className="flex items-end">
                                <IonButton
                                  type="button"
                                  fill="clear"
                                  size="small"
                                  onClick={adicionarEscalado}
                                  disabled={!podeEditarEscalados}
                                  aria-label="Adicionar membro"
                                  className="m-0 h-7"
                                >
                                  <IonIcon slot="icon-only" icon={addOutline} />
                                </IonButton>
                              </div>
                            </div>
                          </IonList>
                        </>
                      )}

                      {podeEditarMusicas && (
                        <>
                          {/* Seletor de tipo: Música ou Medley */}
                          <IonSegment
                            value={tipoItemRepertorio}
                            onIonChange={(e) => {
                              const val = e.detail.value as 'song' | 'medley'
                              setTipoItemRepertorio(val)
                              setNovaMusicaId('')
                              setNovaMusicaTom('')
                              setMedleySongIds([])
                            }}
                            className="mb-2"
                          >
                            <IonSegmentButton value="song">
                              <IonLabel className={LABEL_CLASSES.small}>Música</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="medley">
                              <IonLabel className={LABEL_CLASSES.small}>Medley</IonLabel>
                            </IonSegmentButton>
                          </IonSegment>

                          <IonList className="bg-transparent p-0">
                            {tipoItemRepertorio === 'song' ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                  <IonSelect
                                    label="Música"
                                    labelPlacement="stacked"
                                    value={novaMusicaId}
                                    interface="popover"
                                    placeholder="Selecione uma música"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onIonChange={(e) => {
                                      setNovaMusicaId(String(e.detail.value ?? ''))
                                      setNovaMusicaTom('')
                                    }}
                                    style={INPUT_STYLES.selectSmall}
                                  >
                                    <IonSelectOption value="">Selecione uma música</IonSelectOption>
                                    {musicas.map((m) => (
                                      <IonSelectOption key={m.id} value={m.id}>
                                        {m.nome}
                                      </IonSelectOption>
                                    ))}
                                  </IonSelect>
                                </IonItem>

                                <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                  {(() => {
                                    const musica = musicas.find((m) => m.id === novaMusicaId)
                                    const tonsDisponiveis = musica?.tons ?? []

                                    return (
                                      <IonSelect
                                        label="Tom"
                                        labelPlacement="stacked"
                                        value={novaMusicaTom}
                                        interface="popover"
                                        placeholder={tonsDisponiveis.length > 0 ? 'Selecione o tom' : 'Digite o tom'}
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onIonChange={(e) => setNovaMusicaTom(String(e.detail.value ?? ''))}
                                        style={INPUT_STYLES.selectSmall}
                                      >
                                        <IonSelectOption value="">Selecione o tom</IonSelectOption>
                                        {tonsDisponiveis.map((tom) => (
                                          <IonSelectOption key={tom} value={tom}>
                                            {tom}
                                          </IonSelectOption>
                                        ))}
                                      </IonSelect>
                                    )
                                  })()}
                                </IonItem>

                                <div className="flex items-end">
                                  <IonButton
                                    type="button"
                                    fill="clear"
                                    size="small"
                                    onClick={() => adicionarMusicaEscala(evento.id)}
                                    disabled={!podeEditarMusicas}
                                    aria-label="Adicionar música"
                                    className="m-0 h-7"
                                  >
                                    <IonIcon icon={addOutline} />
                                  </IonButton>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                  <IonButton
                                    expand="block"
                                    fill="clear"
                                    onClick={() => setMedleyModalOpen(true)}
                                    className="text-left"
                                    style={INPUT_STYLES.default}
                                  >
                                    {medleySongIds.length === 0
                                      ? 'Selecionar músicas'
                                      : `${medleySongIds.length} ${medleySongIds.length === 1 ? 'música selecionada' : 'músicas selecionadas'}`}
                                  </IonButton>
                                </IonItem>

                                <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                  <IonSelect
                                    label="Tom"
                                    labelPlacement="stacked"
                                    value={novaMusicaTom}
                                    interface="popover"
                                    placeholder="Selecione o tom"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onIonChange={(e) => setNovaMusicaTom(String(e.detail.value ?? ''))}
                                    style={INPUT_STYLES.selectSmall}
                                  >
                                    <IonSelectOption value="">Selecione o tom</IonSelectOption>
                                    {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'].map((tom) => (
                                      <IonSelectOption key={tom} value={tom}>
                                        {tom}
                                      </IonSelectOption>
                                    ))}
                                  </IonSelect>
                                </IonItem>

                                <div className="flex items-end">
                                  <IonButton
                                    type="button"
                                    fill="clear"
                                    size="small"
                                    onClick={() => adicionarMusicaEscala(evento.id)}
                                    disabled={!podeEditarMusicas || medleySongIds.length === 0}
                                    aria-label="Adicionar medley"
                                    className="m-0 h-7"
                                  >
                                    <IonIcon icon={addOutline} />
                                  </IonButton>
                                </div>
                              </div>
                            )}
                          </IonList>

                          <MedleyPickerModal
                            isOpen={medleyModalOpen}
                            onClose={() => setMedleyModalOpen(false)}
                            musicas={musicas}
                            value={medleySongIds}
                            onChange={setMedleySongIds}
                          />
                        </>
                      )}
                    </div>
                  )}
                </IonCard>
              )
            })}

            {eventos.length > EVENTOS_POR_PAGINA && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() => setPaginaEventos(Math.max(1, paginaEventos - 1))}
                  disabled={paginaEventos <= 1}
                  aria-label="Página anterior"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
                <p className={`${LABEL_CLASSES.field} text-slate-400`}>
                  Página {paginaEventos} de {totalPaginasEventos}
                </p>
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() => setPaginaEventos(Math.min(totalPaginasEventos, paginaEventos + 1))}
                  disabled={paginaEventos >= totalPaginasEventos}
                  aria-label="Próxima página"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                </IonButton>
              </div>
            )}

          <p className={`pt-1 ${LABEL_CLASSES.field} text-slate-500`}>Total: {eventos.length} eventos</p>
        </div>
      )}

      {/* Modal de seleção de membro */}
      {eventoSelecionadoId && (
        <MemberPickerModal
          isOpen={memberPickerOpen}
          onClose={() => setMemberPickerOpen(false)}
          membros={membros.filter((membro) => {
            const eventoAtual = eventos.find((e) => e.id === eventoSelecionadoId)
            if (!eventoAtual) return false

            const funcoes = membro.funcoes ?? []
            const temPerfil = funcoes.includes('voz') || funcoes.includes('musico')
            const isCurrentUser = membro.id === user.id

            if (!temPerfil && !isCurrentUser) return false

            const indispDoMembro = todasIndisponibilidades.filter((ind) => ind.usuario_id === membro.id)
            const estaIndisponivel = indispDoMembro.some((ind) => {
              const inicio = ind.data
              const fim = ind.data_fim ?? ind.data
              return eventoAtual.data >= inicio && eventoAtual.data <= fim
            })
            return !estaIndisponivel
          })}
          value={novoEscaladoUsuarioId}
          onChange={setNovoEscaladoUsuarioId}
        />
      )}
    </div>
  )
}
