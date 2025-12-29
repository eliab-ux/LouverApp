import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { IonAlert, IonButton, IonIcon } from '@ionic/react'
import { createOutline, trashOutline } from 'ionicons/icons'
import { supabase } from '../../lib/supabase'
import type { AppUser, Categoria } from '../../types'

interface CategoriasPanelProps {
  user: AppUser
  categorias: Categoria[]
  onCategoriasChange: () => void
}

export function CategoriasPanel({ user, categorias, onCategoriasChange }: CategoriasPanelProps) {
  const [novaCategoria, setNovaCategoria] = useState('')
  const [savingCategoria, setSavingCategoria] = useState(false)
  const [categoriaError, setCategoriaError] = useState<string | null>(null)
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null)
  const [categoriaEditandoNome, setCategoriaEditandoNome] = useState('')
  const itensPorPagina = 7
  const [paginaCategoria, setPaginaCategoria] = useState(1)

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

  const handleCreateCategoria = async (event: FormEvent) => {
    event.preventDefault()
    if (!novaCategoria.trim()) return

    setSavingCategoria(true)
    setCategoriaError(null)

    try {
      const { error } = await supabase.from('categorias').insert({
        nome: novaCategoria.trim(),
        igreja_id: user.igrejaId,
      })

      if (error) {
        setCategoriaError(error.message)
        return
      }

      setNovaCategoria('')
      onCategoriasChange()
    } catch (e) {
      console.error(e)
      setCategoriaError('Erro ao salvar categoria.')
    } finally {
      setSavingCategoria(false)
    }
  }

  const iniciarEdicaoCategoria = (categoria: Categoria) => {
    setCategoriaError(null)
    setCategoriaEditandoId(categoria.id)
    setCategoriaEditandoNome(categoria.nome)
  }

  const cancelarEdicaoCategoria = () => {
    setCategoriaEditandoId(null)
    setCategoriaEditandoNome('')
  }

  const salvarEdicaoCategoria = async (event: FormEvent) => {
    event.preventDefault()
    if (!categoriaEditandoId || !categoriaEditandoNome.trim()) return

    setSavingCategoria(true)
    setCategoriaError(null)

    try {
      const { error } = await supabase
        .from('categorias')
        .update({ nome: categoriaEditandoNome.trim() })
        .eq('id', categoriaEditandoId)

      if (error) {
        setCategoriaError(error.message)
        return
      }

      setCategoriaEditandoId(null)
      setCategoriaEditandoNome('')
      onCategoriasChange()
    } catch (e) {
      console.error(e)
      setCategoriaError('Erro ao atualizar categoria.')
    } finally {
      setSavingCategoria(false)
    }
  }

  const excluirCategoria = async (id: string) => {
    setSavingCategoria(true)
    setCategoriaError(null)

    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id)

      if (error) {
        setCategoriaError(`Erro ao excluir categoria: ${error.message}`)
        return
      }

      if (categoriaEditandoId === id) {
        setCategoriaEditandoId(null)
        setCategoriaEditandoNome('')
      }

      onCategoriasChange()
    } catch (e) {
      console.error(e)
      setCategoriaError('Erro ao excluir categoria.')
    } finally {
      setSavingCategoria(false)
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <h2 className="text-sm font-semibold mb-3 text-slate-100">Categorias</h2>
        {categoriaError && (
          <p className="mb-3 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {categoriaError}
          </p>
        )}
        {categorias.length === 0 ? (
          <p className="text-sm text-slate-300">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          <>
            <div className="text-[11px] text-slate-400 mb-3">
              Total: {categorias.length} | Página {paginaCategoria} de {Math.ceil(categorias.length / itensPorPagina)}
            </div>
            <ul className="space-y-2 list-none text-sm text-slate-200">
              {categorias
                .slice((paginaCategoria - 1) * itensPorPagina, paginaCategoria * itensPorPagina)
                .map((cat) => {
                  const emEdicao = categoriaEditandoId === cat.id

                  return (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 px-4 py-3 shadow-sm"
                    >
                      {emEdicao ? (
                        <form onSubmit={salvarEdicaoCategoria} className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={categoriaEditandoNome}
                            onChange={(e) => setCategoriaEditandoNome(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={savingCategoria}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-[11px] font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicaoCategoria}
                            className="px-3 py-2 rounded-xl border border-slate-700/70 text-[11px] text-slate-200 hover:bg-slate-800"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <span className="flex-1 truncate text-[15px] font-medium text-slate-100">{cat.nome}</span>
                      )}

                      {!emEdicao && (user.papel === 'admin' || user.papel === 'lider') && (
                        <div className="flex items-center gap-2">
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onPointerDown={(e) => {
                              deferTouchAction(e, () => iniciarEdicaoCategoria(cat))
                            }}
                            onClick={(e) => {
                              if (e.detail !== 0) return
                              if (shouldIgnoreClickBecauseTouch()) return
                              iniciarEdicaoCategoria(cat)
                            }}
                            aria-label="Editar categoria"
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
                                    title: 'Excluir categoria',
                                    message: `Tem certeza que deseja excluir "${cat.nome}"? Esta ação não pode ser desfeita.`,
                                    actionLabel: 'Excluir',
                                    onConfirm: async () => {
                                      await excluirCategoria(cat.id)
                                    },
                                  }),
                                )
                              }}
                              onClick={(e) => {
                                if (e.detail !== 0) return
                                if (shouldIgnoreClickBecauseTouch()) return
                                abrirConfirmacao({
                                  title: 'Excluir categoria',
                                  message: `Tem certeza que deseja excluir "${cat.nome}"? Esta ação não pode ser desfeita.`,
                                  actionLabel: 'Excluir',
                                  onConfirm: async () => {
                                    await excluirCategoria(cat.id)
                                  },
                                })
                              }}
                              aria-label="Excluir categoria"
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

            {Math.ceil(categorias.length / itensPorPagina) > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setPaginaCategoria((p) => Math.max(1, p - 1))}
                  disabled={paginaCategoria === 1}
                  className="px-2 py-1 rounded border border-slate-600 text-[10px] hover:bg-slate-800 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="px-2 py-1 text-[10px] text-slate-400">
                  {paginaCategoria} / {Math.ceil(categorias.length / itensPorPagina)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPaginaCategoria((p) =>
                      Math.min(Math.ceil(categorias.length / itensPorPagina), p + 1),
                    )
                  }
                  disabled={paginaCategoria >= Math.ceil(categorias.length / itensPorPagina)}
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
        <h2 className="text-sm font-semibold mb-3 text-slate-100">Nova categoria</h2>
        <form onSubmit={handleCreateCategoria} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300" htmlFor="novaCategoria">
              Nome da categoria
            </label>
            <input
              id="novaCategoria"
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Ex: Louvor, Adoração..."
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={savingCategoria}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingCategoria ? 'Salvando...' : 'Adicionar categoria'}
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
