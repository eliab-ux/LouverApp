import {
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
} from '@ionic/react'
import {
  addOutline,
  trashOutline,
  downloadOutline,
  createOutline,
  closeOutline,
  checkmarkOutline,
  star,
  starOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons'
import type { FormEvent } from 'react'
import type { CSSProperties } from 'react'
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
  adicionarMusicaEscala: (eventoId: string) => void

  removerMusicaEscala: (id: string) => void
  alternarMinistrante: (id: string, next: boolean) => void
  removerEscalado: (id: string) => void

  publicarEscala: (eventoId: string) => void
  excluirEvento: (eventoId: string) => void
}) {
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
    adicionarMusicaEscala,
    removerMusicaEscala,
    alternarMinistrante,
    removerEscalado,
    publicarEscala,
    excluirEvento,
  } = props

  const selectStyleSmall: CSSProperties & Record<string, string> = {
    fontSize: '11px',
    ['--placeholder-color']: '#94a3b8',
    ['--color']: '#e2e8f0',
  }

  const buttonPaddingStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '14px',
    ['--padding-end']: '14px',
  }

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
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="mesExportacao">
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
              aria-label="Baixar PDF da escala mensal"
              className="m-0 h-7"
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
              style={selectStyleSmall}
              interfaceOptions={{ cssClass: 'musicas-select-popover-small' }}
            >
              <IonSelectOption value="todos">Todos</IonSelectOption>
              <IonSelectOption value="publicados">Publicados</IonSelectOption>
              <IonSelectOption value="publicados_em_edicao">Publicado (Em edição)</IonSelectOption>
              <IonSelectOption value="nao_publicados">Não publicados</IonSelectOption>
            </IonSelect>
          </div>

          <p className="text-[10px] text-slate-400 text-right">
            {eventosFiltradosPorStatus.length} evento{eventosFiltradosPorStatus.length !== 1 ? 's' : ''}
          </p>
        </div>
      </IonCard>

      {(user.papel === 'admin' || user.papel === 'lider') && (
        <IonCard className="p-3 shadow-sm">
          {(eventoError || escalaError) && (
            <p className="mb-3 text-[11px] text-red-300 bg-red-950/40 rounded-xl px-3 py-2">
              {eventoError || escalaError}
            </p>
          )}

          <form onSubmit={criarEvento} className="rounded-2xl bg-slate-900/60 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1">
                <IonSelect
                  label="Tipo *"
                  labelPlacement="stacked"
                  value={novoEventoTipoEventoId}
                  interface="popover"
                  placeholder="Selecione"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onIonChange={(e) => setNovoEventoTipoEventoId(String(e.detail.value ?? ''))}
                  style={{ width: '100%', ...selectStyleSmall }}
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
                <label className="block text-[10px] text-slate-400 mb-1" htmlFor="dataEvento">
                  Data *
                </label>
                <div
                  className="rounded-xl bg-slate-900/60 p-3"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-200">
                      {novoEventoData ? formatDatePtBr(novoEventoData) || 'Selecionar data' : 'Selecionar data'}
                    </span>
                    <IonDatetimeButton datetime="dataEvento" className="datetime-button-small" />
                  </div>

                  <IonModal keepContentsMounted>
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
                      }}
                    />
                  </IonModal>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1" htmlFor="horaEvento">
                  Hora *
                </label>
                <div
                  className="rounded-xl bg-slate-900/60 p-3"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-200">{novoEventoHora || 'Selecionar hora'}</span>
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

              <div className="col-span-2 md:col-span-4">
                <IonButton type="submit" expand="block" size="small" style={buttonPaddingStyle}>
                  Criar Evento
                </IonButton>
              </div>
            </div>
          </form>
        </IonCard>
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
                      <h3 className="text-[13px] font-bold text-slate-100 truncate">
                        {nomeTipoEvento(evento)} {new Date(evento.data + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
                        {evento.hora}
                      </h3>
                    </div>

                    <div className="flex items-start gap-2 flex-wrap justify-end">
                      {escalaPublicadaEmEdicao ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 whitespace-nowrap font-semibold">
                          🟡 Publicado (Em edição)
                        </span>
                      ) : escalaPublicada ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-900 whitespace-nowrap font-semibold">
                          🟢 Escala publicada
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-200 whitespace-nowrap font-semibold">
                          🔴 Escala não publicada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-slate-400">🎵 Músicas</p>

                    {musicasDoEvento.length > 0 ? (
                      <ul className="text-[11px] pl-4 list-disc space-y-0.5 text-slate-200">
                        {musicasDoEvento.map((em) => (
                          <li key={em.id} className="flex items-start justify-between gap-2">
                            <span className="min-w-0">
                              {em.musica?.nome ?? 'Música'}{em.tom_escolhido ? ` | Tom: ${em.tom_escolhido}` : ''}
                            </span>
                            {podeEditarMusicas && (
                              <IonButton
                                type="button"
                                fill="clear"
                                size="small"
                                color="danger"
                                onClick={() => removerMusicaEscala(em.id)}
                                aria-label="Remover música"
                                className="m-0 h-7"
                              >
                                <IonIcon slot="icon-only" icon={trashOutline} />
                              </IonButton>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400">Nenhuma música adicionada para este evento.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400">👤 Membros escalados</p>

                    {escaladosDoEvento.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {escaladosDoEvento.map((esc) => (
                          <div
                            key={esc.id}
                            className="flex items-center justify-between gap-2 text-[11px] text-slate-200"
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
                      <p className="text-[11px] text-slate-400">Nenhum membro escalado ainda para este evento.</p>
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
                        <IonIcon slot="icon-only" icon={checkmarkOutline} />
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
                              <IonItem lines="none" className="rounded-xl bg-slate-900/60">
                                <IonSelect
                                  label="Membro"
                                  labelPlacement="stacked"
                                  value={novoEscaladoUsuarioId}
                                  interface="popover"
                                  placeholder="Selecione um membro"
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onIonChange={(e) => setNovoEscaladoUsuarioId(String(e.detail.value ?? ''))}
                                  style={selectStyleSmall}
                                >
                                  <IonSelectOption value="">Selecione um membro</IonSelectOption>
                                  {membros
                                    .filter((membro) => {
                                      const funcoes = membro.funcoes ?? []
                                      const temPerfil = funcoes.includes('voz') || funcoes.includes('musico')
                                      const isCurrentUser = membro.id === user.id

                                      if (!temPerfil && !isCurrentUser) return false

                                      const indispDoMembro = todasIndisponibilidades.filter((ind) => ind.usuario_id === membro.id)
                                      const estaIndisponivel = indispDoMembro.some((ind) => {
                                        const inicio = ind.data
                                        const fim = ind.data_fim ?? ind.data
                                        return evento.data >= inicio && evento.data <= fim
                                      })
                                      return !estaIndisponivel
                                    })
                                    .map((membro) => {
                                      const funcoesTexto = (membro.funcoes ?? [])
                                        .map((f) => (f === 'voz' ? 'Voz' : f === 'musico' ? 'Músico' : f))
                                        .join(', ')

                                      return (
                                        <IonSelectOption key={membro.id} value={membro.id}>
                                          {membro.nome ?? 'Sem nome'} ({membro.papel}
                                          {funcoesTexto ? ` • ${funcoesTexto}` : ''})
                                        </IonSelectOption>
                                      )
                                    })}
                                </IonSelect>
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
                          <IonList className="bg-transparent p-0">
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
                                  style={selectStyleSmall}
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
                                      style={selectStyleSmall}
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
                          </IonList>
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
                <p className="text-[11px] text-slate-400">
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

          <p className="pt-1 text-[11px] text-slate-500">Total: {eventos.length} eventos</p>
        </div>
      )}
    </div>
  )
}
