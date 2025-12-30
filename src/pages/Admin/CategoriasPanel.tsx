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
                          <IonInput
                            value={categoriaEditandoNome}
                            onIonInput={(e) => setCategoriaEditandoNome(String(e.detail.value ?? ''))}
                            className="flex-1"
                            style={{ fontSize: '10.5px' }}
                          />
                          <IonButton
                            type="button"
                            fill="clear"
                            size="small"
                            onClick={cancelarEdicaoCategoria}
                            disabled={savingCategoria}
                            aria-label="Cancelar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={closeOutline} />
                          </IonButton>
                          <IonButton
                            type="submit"
                            fill="clear"
                            size="small"
                            disabled={savingCategoria}
                            aria-label="Salvar edição"
                            className="m-0 h-7"
                          >
                            <IonIcon slot="icon-only" icon={checkmarkOutline} />
                          </IonButton>
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
              <div className="flex items-center justify-between gap-2 pt-2">
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() => setPaginaCategoria(Math.max(1, paginaCategoria - 1))}
                  disabled={paginaCategoria <= 1}
                  aria-label="Página anterior"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
                <p className="text-[11px] text-slate-400">
                  Página {paginaCategoria} de {Math.ceil(categorias.length / itensPorPagina)}
                </p>
                <IonButton
                  type="button"
                  fill="clear"
                  size="small"
                  onClick={() =>
                    setPaginaCategoria(
                      Math.min(Math.ceil(categorias.length / itensPorPagina), paginaCategoria + 1),
                    )
                  }
                  disabled={paginaCategoria >= Math.ceil(categorias.length / itensPorPagina)}
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
              <IonLabel>Nova categoria</IonLabel>
            </IonItem>
            <div slot="content" className="p-4">
              <form onSubmit={handleCreateCategoria} className="space-y-3">
                <IonItem lines="none" className="rounded-xl">
                  <IonLabel position="stacked" className="text-[11px] font-semibold" style={{ fontWeight: 700 }}>
                    Nome da categoria
                  </IonLabel>
                  <IonInput
                    value={novaCategoria}
                    onIonInput={(e) => setNovaCategoria(String(e.detail.value ?? ''))}
                    placeholder="Ex: Louvor, Adoração..."
                    style={{ fontSize: '10.5px' }}
                  />
                </IonItem>

                <IonButton
                  type="submit"
                  expand="block"
                  disabled={savingCategoria}
                  size="small"
                  style={addButtonPaddingStyle}
                >
                  {savingCategoria ? 'Salvando...' : 'Adicionar categoria'}
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
