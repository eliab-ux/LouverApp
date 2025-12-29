import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { IonAlert, IonButton, IonIcon } from '@ionic/react'
import { createOutline, trashOutline } from 'ionicons/icons'
import { supabase } from '../../lib/supabase'
import type { AppUser, Estilo } from '../../types'

interface EstilosPanelProps {
  user: AppUser
  estilos: Estilo[]
  onEstilosChange: () => void
}

export function EstilosPanel({ user, estilos, onEstilosChange }: EstilosPanelProps) {
  const [novoEstilo, setNovoEstilo] = useState('')
  const [savingEstilo, setSavingEstilo] = useState(false)
  const [estiloError, setEstiloError] = useState<string | null>(null)
  const [estiloEditandoId, setEstiloEditandoId] = useState<string | null>(null)
  const [estiloEditandoNome, setEstiloEditandoNome] = useState('')
  const itensPorPagina = 7
  const [paginaEstilo, setPaginaEstilo] = useState(1)

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

  const handleCreateEstilo = async (event: FormEvent) => {
    event.preventDefault()
    if (!novoEstilo.trim()) return

    setSavingEstilo(true)
    setEstiloError(null)

    try {
      const { error } = await supabase.from('estilos').insert({
        nome: novoEstilo.trim(),
        igreja_id: user.igrejaId,
      })

      if (error) {
        setEstiloError(error.message)
        return
      }

      setNovoEstilo('')
      onEstilosChange()
    } catch (e) {
      console.error(e)
      setEstiloError('Erro ao salvar estilo.')
    } finally {
      setSavingEstilo(false)
    }
  }

  const iniciarEdicaoEstilo = (estilo: Estilo) => {
    setEstiloError(null)
    setEstiloEditandoId(estilo.id)
    setEstiloEditandoNome(estilo.nome)
  }

  const cancelarEdicaoEstilo = () => {
    setEstiloEditandoId(null)
    setEstiloEditandoNome('')
  }

  const salvarEdicaoEstilo = async (event: FormEvent) => {
    event.preventDefault()
    if (!estiloEditandoId || !estiloEditandoNome.trim()) return

    setSavingEstilo(true)
    setEstiloError(null)

    try {
      const { error } = await supabase
        .from('estilos')
        .update({ nome: estiloEditandoNome.trim() })
        .eq('id', estiloEditandoId)

      if (error) {
        setEstiloError(error.message)
        return
      }

      setEstiloEditandoId(null)
      setEstiloEditandoNome('')
      onEstilosChange()
    } catch (e) {
      console.error(e)
      setEstiloError('Erro ao atualizar estilo.')
    } finally {
      setSavingEstilo(false)
    }
  }

  const excluirEstilo = async (id: string) => {
    setSavingEstilo(true)
    setEstiloError(null)

    try {
      const { error } = await supabase.from('estilos').delete().eq('id', id)

      if (error) {
        setEstiloError(`Erro ao excluir estilo: ${error.message}`)
        return
      }

      if (estiloEditandoId === id) {
        setEstiloEditandoId(null)
        setEstiloEditandoNome('')
      }

      onEstilosChange()
    } catch (e) {
      console.error(e)
      setEstiloError('Erro ao excluir estilo.')
    } finally {
      setSavingEstilo(false)
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3 text-slate-100">Estilos</h2>
        {estiloError && (
          <p className="mb-3 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {estiloError}
          </p>
        )}
        {estilos.length === 0 ? (
          <p className="text-sm text-slate-300">Nenhum estilo cadastrado ainda.</p>
        ) : (
          <>
            <div className="text-[11px] text-slate-400 mb-3">
              Total: {estilos.length} | Página {paginaEstilo} de {Math.ceil(estilos.length / itensPorPagina)}
            </div>
            <ul className="space-y-2 list-none text-sm text-slate-200">
              {estilos
                .slice((paginaEstilo - 1) * itensPorPagina, paginaEstilo * itensPorPagina)
                .map((est) => (
                  <li
                    key={est.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 px-4 py-3 shadow-sm"
                  >
                    {estiloEditandoId === est.id ? (
                      <form onSubmit={salvarEdicaoEstilo} className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={estiloEditandoNome}
                          onChange={(e) => setEstiloEditandoNome(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={cancelarEdicaoEstilo}
                          className="px-3 py-2 rounded-xl border border-slate-700/70 text-[11px] text-slate-200 hover:bg-slate-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingEstilo}
                          className="px-3 py-2 rounded-xl bg-emerald-500 text-[11px] font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {savingEstilo ? 'Salvando...' : 'Salvar'}
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-[15px] font-medium text-slate-100">{est.nome}</span>
                        <div className="flex items-center gap-2">
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onPointerDown={(e) => {
                              deferTouchAction(e, () => iniciarEdicaoEstilo(est))
                            }}
                            onClick={(e) => {
                              if (e.detail !== 0) return
                              if (shouldIgnoreClickBecauseTouch()) return
                              iniciarEdicaoEstilo(est)
                            }}
                            aria-label="Editar estilo"
                          >
                            <IonIcon slot="icon-only" icon={createOutline} />
                          </IonButton>
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            color="danger"
                            onPointerDown={(e) => {
                              deferTouchAction(e, () =>
                                abrirConfirmacao({
                                  title: 'Excluir estilo',
                                  message: `Tem certeza que deseja excluir "${est.nome}"? Esta ação não pode ser desfeita.`,
                                  actionLabel: 'Excluir',
                                  onConfirm: async () => {
                                    await excluirEstilo(est.id)
                                  },
                                }),
                              )
                            }}
                            onClick={(e) => {
                              if (e.detail !== 0) return
                              if (shouldIgnoreClickBecauseTouch()) return
                              abrirConfirmacao({
                                title: 'Excluir estilo',
                                message: `Tem certeza que deseja excluir "${est.nome}"? Esta ação não pode ser desfeita.`,
                                actionLabel: 'Excluir',
                                onConfirm: async () => {
                                  await excluirEstilo(est.id)
                                },
                              })
                            }}
                            aria-label="Excluir estilo"
                          >
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonButton>
                        </div>
                      </>
                    )}
                  </li>
                ))}
            </ul>

            {Math.ceil(estilos.length / itensPorPagina) > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setPaginaEstilo((p) => Math.max(1, p - 1))}
                  disabled={paginaEstilo === 1}
                  className="px-2 py-1 rounded border border-slate-600 text-[10px] hover:bg-slate-800 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="px-2 py-1 text-[10px] text-slate-400">
                  {paginaEstilo} / {Math.ceil(estilos.length / itensPorPagina)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPaginaEstilo((p) =>
                      Math.min(Math.ceil(estilos.length / itensPorPagina), p + 1),
                    )
                  }
                  disabled={paginaEstilo >= Math.ceil(estilos.length / itensPorPagina)}
                  className="px-2 py-1 rounded border border-slate-600 text-[10px] hover:bg-slate-800 disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="border-t border-slate-800/70" />

      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3 text-slate-100">Novo estilo</h2>
        <form onSubmit={handleCreateEstilo} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300" htmlFor="novoEstilo">
              Nome do estilo
            </label>
            <input
              id="novoEstilo"
              type="text"
              value={novoEstilo}
              onChange={(e) => setNovoEstilo(e.target.value)}
              placeholder="Ex: Contemplação, Proclamação..."
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingEstilo}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingEstilo ? 'Salvando...' : 'Adicionar estilo'}
          </button>
        </form>
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
