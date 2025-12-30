import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
import {
  IonAccordion,
  IonAccordionGroup,
  IonAlert,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
} from '@ionic/react'
import {
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons'
import { supabase } from '../../lib/supabase'
import type { AppUser, MomentoCulto } from '../../types'

interface MomentosPanelProps {
  user: AppUser
  momentos: MomentoCulto[]
  onMomentosChange: () => void
}

export function MomentosPanel({ user, momentos, onMomentosChange }: MomentosPanelProps) {
  const [novoMomento, setNovoMomento] = useState('')
  const [savingMomento, setSavingMomento] = useState(false)
  const [momentoError, setMomentoError] = useState<string | null>(null)
  const [momentoEditandoId, setMomentoEditandoId] = useState<string | null>(null)
  const [momentoEditandoNome, setMomentoEditandoNome] = useState('')
  const itensPorPagina = 7
  const [paginaMomento, setPaginaMomento] = useState(1)

  const addButtonPaddingStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '14px',
    ['--padding-end']: '14px',
  }

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('')
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('')
  const [confirmDialogOnConfirm, setConfirmDialogOnConfirm] = useState<null | (() => Promise<void>)>(null)

  const lastTouchActionAtRef = useRef(0)
  const blockClicksUntilRef = useRef(0)

  const shouldIgnoreClickBecauseTouch = () => Date.now() - lastTouchActionAtRef.current < 700

  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (Date.now() < blockClicksUntilRef.current) {
        ev.preventDefault()
        ev.stopPropagation()
        const maybeStopImmediatePropagation = (ev as MouseEvent & {
          stopImmediatePropagation?: () => void
        }).stopImmediatePropagation
        maybeStopImmediatePropagation?.()
      }
    }

    document.addEventListener('click', handler, true)
    return () => {
      document.removeEventListener('click', handler, true)
    }
  }, [])

  const deferTouchAction = (e: PointerEvent, action: () => void) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      lastTouchActionAtRef.current = Date.now()
      blockClicksUntilRef.current = Date.now() + 800
      e.preventDefault()
      e.stopPropagation()
      window.setTimeout(() => {
        action()
      }, 0)
      return
    }

    action()
  }

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

  const handleCreateMomento = async (event: FormEvent) => {
    event.preventDefault()
    if (!novoMomento.trim()) return

    setSavingMomento(true)
    setMomentoError(null)

    try {
      const { error } = await supabase.from('momentos_culto').insert({
        nome: novoMomento.trim(),
        igreja_id: user.igrejaId,
      })

      if (error) {
        setMomentoError(error.message)
        return
      }

      setNovoMomento('')
      onMomentosChange()
    } catch (e) {
      console.error(e)
      setMomentoError('Erro ao salvar momento de culto.')
    } finally {
      setSavingMomento(false)
    }
  }

  const iniciarEdicaoMomento = (momento: MomentoCulto) => {
    setMomentoError(null)
    setMomentoEditandoId(momento.id)
    setMomentoEditandoNome(momento.nome)
  }

  const cancelarEdicaoMomento = () => {
    setMomentoEditandoId(null)
    setMomentoEditandoNome('')
  }

  const salvarEdicaoMomento = async (event: FormEvent) => {
    event.preventDefault()
    if (!momentoEditandoId || !momentoEditandoNome.trim()) return

    setSavingMomento(true)
    setMomentoError(null)

    try {
      const { error } = await supabase
        .from('momentos_culto')
        .update({ nome: momentoEditandoNome.trim() })
        .eq('id', momentoEditandoId)

      if (error) {
        setMomentoError(error.message)
        return
      }

      setMomentoEditandoId(null)
      setMomentoEditandoNome('')
      onMomentosChange()
    } catch (e) {
      console.error(e)
      setMomentoError('Erro ao atualizar momento de culto.')
    } finally {
      setSavingMomento(false)
    }
  }

  const excluirMomento = async (id: string) => {
    setSavingMomento(true)
    setMomentoError(null)

    try {
      const { error } = await supabase.from('momentos_culto').delete().eq('id', id)

      if (error) {
        setMomentoError(`Erro ao excluir momento: ${error.message}`)
        return
      }

      if (momentoEditandoId === id) {
        setMomentoEditandoId(null)
        setMomentoEditandoNome('')
      }

      onMomentosChange()
    } catch (e) {
      console.error(e)
      setMomentoError('Erro ao excluir momento.')
    } finally {
      setSavingMomento(false)
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3 text-slate-100">Momentos de culto</h2>
        {momentoError && (
          <p className="mb-3 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {momentoError}
          </p>
        )}
        {momentos.length === 0 ? (
          <p className="text-sm text-slate-300">Nenhum momento de culto cadastrado ainda.</p>
        ) : (
          <>
            <div className="text-[11px] text-slate-400 mb-3">
              Total: {momentos.length} | Página {paginaMomento} de {Math.ceil(momentos.length / itensPorPagina)}
            </div>
            <ul className="space-y-2 list-none text-sm text-slate-200">
              {momentos
                .slice((paginaMomento - 1) * itensPorPagina, paginaMomento * itensPorPagina)
                .map((m) => {
                  const emEdicao = momentoEditandoId === m.id

                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 px-4 py-3 shadow-sm"
                    >
                      {emEdicao ? (
                        <form onSubmit={salvarEdicaoMomento} className="flex-1 flex items-center gap-2">
                          <IonInput
                            value={momentoEditandoNome}
                            onIonInput={(e) => setMomentoEditandoNome(String(e.detail.value ?? ''))}
                            className="flex-1"
                            style={{ fontSize: '10.5px' }}
                          />
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onClick={cancelarEdicaoMomento}
                            disabled={savingMomento}
                            aria-label="Cancelar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={closeOutline} />
                          </IonButton>
                          <IonButton
                            type="submit"
                            fill="clear"
                            size="small"
                            disabled={savingMomento}
                            aria-label="Salvar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={checkmarkOutline} />
                          </IonButton>
                        </form>
                      ) : (
                        <span className="flex-1 truncate text-[15px] font-medium text-slate-100">{m.nome}</span>
                      )}

                      {!emEdicao && (user.papel === 'admin' || user.papel === 'lider') && (
                        <div className="flex items-center gap-2">
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onPointerDown={(e) => {
                              deferTouchAction(e, () => iniciarEdicaoMomento(m))
                            }}
                            onClick={(e) => {
                              if (e.detail !== 0) return
                              if (shouldIgnoreClickBecauseTouch()) return
                              iniciarEdicaoMomento(m)
                            }}
                            aria-label="Editar momento"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={createOutline} />
                          </IonButton>
                          {user.papel === 'admin' && (
                            <IonButton
                              type="button"
                              fill="clear"
                              size="small"
                              color="danger"
                              onPointerDown={(e) => {
                                deferTouchAction(e, () =>
                                  abrirConfirmacao({
                                    title: 'Excluir momento',
                                    message: `Tem certeza que deseja excluir "${m.nome}"? Esta ação não pode ser desfeita.`,
                                    actionLabel: 'Excluir',
                                    onConfirm: async () => {
                                      await excluirMomento(m.id)
                                    },
                                  }),
                                )
                              }}
                              onClick={(e) => {
                                if (e.detail !== 0) return
                                if (shouldIgnoreClickBecauseTouch()) return
                                abrirConfirmacao({
                                  title: 'Excluir momento',
                                  message: `Tem certeza que deseja excluir "${m.nome}"? Esta ação não pode ser desfeita.`,
                                  actionLabel: 'Excluir',
                                  onConfirm: async () => {
                                    await excluirMomento(m.id)
                                  },
                                })
                              }}
                              aria-label="Excluir momento"
                              className="m-0 h-7"
                            >
                              <IonIcon slot="icon-only" icon={trashOutline} />
                            </IonButton>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
            </ul>
            {Math.ceil(momentos.length / itensPorPagina) > 1 && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() => setPaginaMomento(Math.max(1, paginaMomento - 1))}
                  disabled={paginaMomento <= 1}
                  aria-label="Página anterior"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
                <p className="text-[11px] text-slate-400">
                  Página {paginaMomento} de {Math.ceil(momentos.length / itensPorPagina)}
                </p>
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() =>
                    setPaginaMomento(
                      Math.min(Math.ceil(momentos.length / itensPorPagina), paginaMomento + 1),
                    )
                  }
                  disabled={paginaMomento >= Math.ceil(momentos.length / itensPorPagina)}
                  aria-label="Próxima página"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                </IonButton>
              </div>
            )}
          </>
        )}
      </section>

      <div className="border-t border-slate-800/70" />

      <section className="rounded-2xl bg-slate-900/60 p-2 shadow-sm">
        <IonAccordionGroup>
          <IonAccordion value="novo">
            <IonItem slot="header" lines="none">
              <IonLabel>Novo momento de culto</IonLabel>
            </IonItem>
            <div slot="content" className="p-4">
              <form onSubmit={handleCreateMomento} className="space-y-3">
                <IonItem lines="none" className="rounded-xl">
                  <IonLabel position="stacked" className="text-[11px] font-semibold" style={{ fontWeight: 700 }}>
                    Nome do momento
                  </IonLabel>
                  <IonInput
                    value={novoMomento}
                    onIonInput={(e) => setNovoMomento(String(e.detail.value ?? ''))}
                    placeholder="Ex: Abertura, Palavra, Oferta"
                    style={{ fontSize: '10.5px' }}
                  />
                </IonItem>

                <IonButton
                  type="submit"
                  expand="block"
                  disabled={savingMomento}
                  size="small"
                  style={addButtonPaddingStyle}
                >
                  {savingMomento ? 'Salvando...' : 'Adicionar momento'}
                </IonButton>
              </form>
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      </section>

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
    </section>
  )
}
