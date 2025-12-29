import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { IonAlert } from '@ionic/react'
import { IonButton, IonIcon } from '@ionic/react'
import { createOutline, trashOutline } from 'ionicons/icons'
import { supabase } from '../../lib/supabase'
import type { AppUser } from '../../types'

export type Membro = {
  id: string
  nome: string | null
  email: string
  telefone: string | null
  papel: 'admin' | 'lider' | 'membro'
  funcoes?: string[] | null
}

interface MembrosPanelProps {
  user: AppUser
}

export function MembrosPanel({ user }: MembrosPanelProps) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [membrosLoading, setMembrosLoading] = useState(false)
  const [membrosError, setMembrosError] = useState<string | null>(null)
  const [novoMembroEmail, setNovoMembroEmail] = useState('')
  const [novoMembroNome, setNovoMembroNome] = useState('')
  const [novoMembroPapel, setNovoMembroPapel] = useState<'membro' | 'lider' | 'admin'>('membro')
  const [savingMembro, setSavingMembro] = useState(false)
  const [novoMembroFuncoes, setNovoMembroFuncoes] = useState<string[]>([])
  const [novoMembroTelefone, setNovoMembroTelefone] = useState('')

  const itensPorPagina = 5
  const [paginaMembro, setPaginaMembro] = useState(1)
  const [filtroPapel, setFiltroPapel] = useState<'todos' | 'admin' | 'lider' | 'membro'>('todos')

  const [editandoMembroId, setEditandoMembroId] = useState<string | null>(null)
  const [editandoMembro, setEditandoMembro] = useState<Membro | null>(null)
  const [editandoMembroPapel, setEditandoMembroPapel] = useState<'admin' | 'lider' | 'membro'>('membro')
  const [editandoMembroFuncoes, setEditandoMembroFuncoes] = useState<string[]>([])

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('')
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('')
  const [confirmDialogOnConfirm, setConfirmDialogOnConfirm] = useState<null | (() => Promise<void>)>(null)

  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)

  const lastTouchActionAtRef = useRef(0)
  const blockClicksUntilRef = useRef(0)

  const shouldIgnoreClickBecauseTouch = () => Date.now() - lastTouchActionAtRef.current < 700

  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'louvorapp-modal-root'
    let el = document.getElementById(id) as HTMLElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = id
      document.body.appendChild(el)
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el)
    }
    el.style.position = 'relative'
    el.style.zIndex = '2147483647'
    setModalRoot(el)
  }, [])

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

  const carregarMembros = useCallback(async () => {
    if (user.papel !== 'admin') return

    try {
      setMembrosLoading(true)
      setMembrosError(null)
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, telefone, papel, funcoes')
        .eq('igreja_id', user.igrejaId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar membros:', error)
        setMembrosError('Erro ao carregar membros da igreja.')
        return
      }

      // Mapeia os dados, usando id como email placeholder se não houver email
      setMembros(
        (data ?? []).map((m) => ({
          id: String(m.id),
          nome: m.nome ?? null,
          email: m.email || `ID: ${String(m.id).substring(0, 8)}...`,
          telefone: m.telefone ?? null,
          papel: m.papel as 'admin' | 'lider' | 'membro',
          funcoes: Array.isArray(m.funcoes) ? m.funcoes.map((f) => String(f)) : null,
        })),
      )
    } catch (e) {
      console.error(e)
      setMembrosError('Erro ao carregar membros da igreja.')
    } finally {
      setMembrosLoading(false)
    }
  }, [user.igrejaId, user.papel])

  // Carrega membros ao montar o componente
  useEffect(() => {
    void carregarMembros()
  }, [carregarMembros])

  const handleInviteMembro = async (event: FormEvent) => {
    event.preventDefault()
    if (!novoMembroEmail.trim()) {
      setMembrosError('Informe um email para o novo membro.')
      return
    }

    try {
      setSavingMembro(true)
      setMembrosError(null)

      const { data, error } = await supabase.functions.invoke('invite_user_admin', {
        body: {
          email: novoMembroEmail.trim(),
          nome: novoMembroNome.trim() || null,
          papel: novoMembroPapel,
          funcoes: novoMembroFuncoes,
          telefone: novoMembroTelefone.trim() || null,
          igreja_id: user.igrejaId,
        },
      })

      if (error) {
        console.error('Erro na função invite_user_admin:', error)
        setMembrosError('Erro ao enviar convite. Verifique a configuração da Edge Function.')
        return
      }

      const responseData: unknown = data
      if (responseData && typeof responseData === 'object' && 'error' in responseData) {
        const maybeError = (responseData as { error?: unknown }).error
        if (typeof maybeError === 'string' && maybeError.trim()) {
          setMembrosError(maybeError)
          return
        }
      }

      setNovoMembroEmail('')
      setNovoMembroNome('')
      setNovoMembroPapel('membro')
      setNovoMembroFuncoes([])
      setNovoMembroTelefone('')
      await carregarMembros()
    } catch (e) {
      console.error(e)
      setMembrosError('Erro ao enviar convite para o membro.')
    } finally {
      setSavingMembro(false)
    }
  }

  // Iniciar edição de membro
  const iniciarEdicaoMembro = (membro: Membro) => {
    setEditandoMembroId(membro.id)
    setEditandoMembro(membro)
    setEditandoMembroPapel(membro.papel)
    setEditandoMembroFuncoes(membro.funcoes ?? [])
  }

  // Cancelar edição de membro
  const cancelarEdicaoMembro = () => {
    setEditandoMembroId(null)
    setEditandoMembro(null)
    setEditandoMembroPapel('membro')
    setEditandoMembroFuncoes([])
  }

  // Remover membro da igreja
  const removerMembro = async (membroId: string) => {
    // Não permite remover a si mesmo
    if (membroId === user.id) {
      setMembrosError('Você não pode remover a si mesmo.')
      return
    }

    try {
      setSavingMembro(true)
      setMembrosError(null)

      // Remove o membro definindo igreja_id como null
      const { error } = await supabase.from('usuarios').update({ igreja_id: null }).eq('id', membroId)

      if (error) {
        setMembrosError(`Erro ao remover membro: ${error.message}`)
        return
      }

      await carregarMembros()
    } catch (e) {
      console.error(e)
      setMembrosError('Erro ao remover membro.')
    } finally {
      setSavingMembro(false)
    }
  }

  if (user.papel !== 'admin') {
    return (
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <p className="text-sm text-slate-300">Apenas administradores podem gerenciar membros.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Membros</h2>
            <p className="text-[11px] text-slate-400">Gerencie os membros e seus perfis</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400" htmlFor="filtroPapel">
              Filtrar:
            </label>
            <select
              id="filtroPapel"
              value={filtroPapel}
              onChange={(e) => {
                setFiltroPapel(e.target.value as 'todos' | 'admin' | 'lider' | 'membro')
                setPaginaMembro(1)
              }}
              className="rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="admin">Admin</option>
              <option value="lider">Líder</option>
              <option value="membro">Membro</option>
            </select>
          </div>
        </div>

        {membrosError && (
          <p className="mb-3 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
            {membrosError}
          </p>
        )}

        {membrosLoading ? (
          <p className="text-sm text-slate-300">Carregando membros...</p>
        ) : membros.length === 0 ? (
          <p className="text-sm text-slate-300">Nenhum membro cadastrado ainda.</p>
        ) : (
          <>
            {(() => {
              const membrosFiltrados = membros.filter((m) => filtroPapel === 'todos' || m.papel === filtroPapel)
              const totalPaginasMembro = Math.max(1, Math.ceil(membrosFiltrados.length / itensPorPagina))
              const membrosPaginados = membrosFiltrados.slice(
                (paginaMembro - 1) * itensPorPagina,
                paginaMembro * itensPorPagina,
              )

              return (
                <>
                  <p className="text-[10px] text-slate-400 mb-2">
                    {filtroPapel === 'todos'
                      ? `${membros.length} membro(s) cadastrado(s)`
                      : `${membros.filter((m) => m.papel === filtroPapel).length} de ${membros.length} membro(s)`}
                  </p>
                  <div className="space-y-2 max-h-[520px] overflow-y-auto">
                    {membrosPaginados.map((membro) => (
                      <div
                        key={membro.id}
                        className={`rounded-2xl bg-slate-950/30 px-4 py-3 text-xs shadow-sm transition-colors ring-1 ${
                          editandoMembroId === membro.id
                            ? 'ring-emerald-500/50'
                            : 'ring-slate-800/60 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-100 truncate">
                              {membro.nome || 'Sem nome'}
                              {membro.id === user.id && (
                                <span className="ml-1 text-[10px] text-emerald-400">(você)</span>
                              )}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="truncate">📧 {membro.email || '-'}</span>
                              {membro.telefone && <span className="truncate">📱 {membro.telefone}</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  membro.papel === 'admin'
                                    ? 'bg-red-500/20 text-red-300'
                                    : membro.papel === 'lider'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-slate-500/20 text-slate-300'
                                }`}
                              >
                                {membro.papel === 'admin' ? 'Admin' : membro.papel === 'lider' ? 'Líder' : 'Membro'}
                              </span>
                              {membro.funcoes && membro.funcoes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {membro.funcoes.map((f) => (
                                    <span
                                      key={f}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-200 text-[10px]"
                                    >
                                      {f === 'voz' ? '🎤' : f === 'musico' ? '🎸' : '•'}
                                      <span>{f === 'voz' ? 'Voz' : f === 'musico' ? 'Músico' : f}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <IonButton
                              type="button"
                              fill="clear"
                              size="small"
                              onPointerDown={(e) => {
                                deferTouchAction(e, () => iniciarEdicaoMembro(membro))
                              }}
                              onClick={(e) => {
                                if (e.detail !== 0) return
                                if (shouldIgnoreClickBecauseTouch()) return
                                iniciarEdicaoMembro(membro)
                              }}
                              aria-label="Editar membro"
                              title="Editar membro"
                              className="m-0 h-7"
                            >
                              <IonIcon slot="icon-only" icon={createOutline} />
                            </IonButton>
                            {membro.id !== user.id && (
                              <IonButton
                                type="button"
                                fill="clear"
                                size="small"
                                color="danger"
                                onPointerDown={(e) => {
                                  deferTouchAction(e, () =>
                                    abrirConfirmacao({
                                      title: 'Remover membro',
                                      message: `Tem certeza que deseja remover ${membro.nome || membro.email || 'este membro'} da igreja? Esta ação não pode ser desfeita.`,
                                      actionLabel: 'Remover',
                                      onConfirm: async () => {
                                        await removerMembro(membro.id)
                                      },
                                    }),
                                  )
                                }}
                                onClick={(e) => {
                                  if (e.detail !== 0) return
                                  if (shouldIgnoreClickBecauseTouch()) return
                                  abrirConfirmacao({
                                    title: 'Remover membro',
                                    message: `Tem certeza que deseja remover ${membro.nome || membro.email || 'este membro'} da igreja? Esta ação não pode ser desfeita.`,
                                    actionLabel: 'Remover',
                                    onConfirm: async () => {
                                      await removerMembro(membro.id)
                                    },
                                  })
                                }}
                                aria-label="Remover da igreja"
                                title="Remover da igreja"
                                className="m-0 h-7"
                              >
                                <IonIcon slot="icon-only" icon={trashOutline} />
                              </IonButton>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPaginasMembro > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setPaginaMembro((p) => Math.max(1, p - 1))}
                        disabled={paginaMembro === 1}
                        className="px-2 py-1 rounded border border-slate-600 text-[10px] hover:bg-slate-800 disabled:opacity-40"
                      >
                        ← Anterior
                      </button>
                      <span className="px-2 py-1 text-[10px] text-slate-400">
                        {paginaMembro} / {totalPaginasMembro}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaginaMembro((p) => Math.min(totalPaginasMembro, p + 1))}
                        disabled={paginaMembro === totalPaginasMembro}
                        className="px-2 py-1 rounded border border-slate-600 text-[10px] hover:bg-slate-800 disabled:opacity-40"
                      >
                        Próxima →
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}
      </section>

      <div className="border-t border-slate-800/70" />

      <section className="rounded-2xl bg-slate-900/60 p-4 text-sm shadow-sm">
        <h2 className="text-sm font-semibold mb-2 text-slate-100">Convidar novo membro</h2>
        <p className="text-[11px] text-slate-400 mb-4">
          Envie um convite por email. O membro receberá um link para criar a senha e ativar a conta.
        </p>
        <form onSubmit={handleInviteMembro} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="novoEmail">
              Email do membro *
            </label>
            <input
              id="novoEmail"
              type="email"
              value={novoMembroEmail}
              onChange={(e) => setNovoMembroEmail(e.target.value)}
              placeholder="exemplo@igreja.com"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="novoNome">
              Nome do membro (opcional)
            </label>
            <input
              id="novoNome"
              type="text"
              value={novoMembroNome}
              onChange={(e) => setNovoMembroNome(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="novoTelefone">
              Telefone (opcional)
            </label>
            <input
              id="novoTelefone"
              type="tel"
              value={novoMembroTelefone}
              onChange={(e) => setNovoMembroTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="novoPapel">
              Papel na equipe
            </label>
            <select
              id="novoPapel"
              value={novoMembroPapel}
              onChange={(e) => setNovoMembroPapel(e.target.value as 'membro' | 'lider' | 'admin')}
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-sm text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="membro">Membro</option>
              <option value="lider">Líder</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <p className="block text-[11px] font-medium text-slate-300 mb-1">Perfil (ministério)</p>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={novoMembroFuncoes.includes('voz')}
                  onChange={(e) => {
                    const marcado = e.target.checked
                    setNovoMembroFuncoes((prev) => {
                      if (marcado) {
                        return prev.includes('voz') ? prev : [...prev, 'voz']
                      }
                      return prev.filter((f) => f !== 'voz')
                    })
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>🎤 Voz</span>
              </label>

              <label className="inline-flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={novoMembroFuncoes.includes('musico')}
                  onChange={(e) => {
                    const marcado = e.target.checked
                    setNovoMembroFuncoes((prev) => {
                      if (marcado) {
                        return prev.includes('musico') ? prev : [...prev, 'musico']
                      }
                      return prev.filter((f) => f !== 'musico')
                    })
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>🎸 Músico</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingMembro}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-50 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingMembro ? 'Enviando convite...' : 'Enviar convite'}
          </button>
        </form>
      </section>

      {editandoMembroId && (() => {
        const membro = editandoMembro ?? membros.find((m) => m.id === editandoMembroId)
        if (!membro) return null

        return createPortal(
          <div
            data-admin-modal="edit-membro"
            className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-white px-4"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 text-xs shadow-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Editar membro</p>
                  <p className="text-[11px] text-slate-400">
                    {membro.nome || 'Sem nome'}
                    {' · '}
                    {membro.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelarEdicaoMembro}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1" htmlFor="editarMembroPapel">Papel</label>
                  <select
                    id="editarMembroPapel"
                    value={editandoMembroPapel}
                    onChange={(e) => setEditandoMembroPapel(e.target.value as 'admin' | 'lider' | 'membro')}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="membro">Membro</option>
                    <option value="lider">Líder</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Funções</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editandoMembroFuncoes.includes('voz')}
                        onChange={(e) => {
                          const marcado = e.target.checked
                          setEditandoMembroFuncoes((prev) => {
                            if (marcado) {
                              return prev.includes('voz') ? prev : [...prev, 'voz']
                            }
                            return prev.filter((f) => f !== 'voz')
                          })
                        }}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>🎤 Voz</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editandoMembroFuncoes.includes('musico')}
                        onChange={(e) => {
                          const marcado = e.target.checked
                          setEditandoMembroFuncoes((prev) => {
                            if (marcado) {
                              return prev.includes('musico') ? prev : [...prev, 'musico']
                            }
                            return prev.filter((f) => f !== 'musico')
                          })
                        }}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>🎸 Músico</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelarEdicaoMembro}
                  className="px-3 py-2 rounded-xl border border-slate-700/70 text-slate-200 hover:bg-slate-800"
                  disabled={savingMembro}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editandoMembroId) return
                    try {
                      setSavingMembro(true)
                      setMembrosError(null)
                      const funcoesToSave = editandoMembroFuncoes.length > 0
                        ? Array.from(new Set(editandoMembroFuncoes)).sort()
                        : null
                      const { data, error } = await supabase
                        .from('usuarios')
                        .update({
                          papel: editandoMembroPapel,
                          funcoes: funcoesToSave,
                        })
                        .eq('id', editandoMembroId)
                        .select('id, papel, funcoes')
                        .maybeSingle()
                      if (error) {
                        setMembrosError(`Erro ao atualizar membro: ${error.message}`)
                        return
                      }

                      if (!data) {
                        setMembrosError('Sem permissão para atualizar este membro.')
                        await carregarMembros()
                        return
                      }

                      const responseRow: unknown = data
                      const maybeFuncoes =
                        responseRow && typeof responseRow === 'object' && 'funcoes' in responseRow
                          ? (responseRow as { funcoes?: unknown }).funcoes
                          : null
                      const savedFuncoes = Array.isArray(maybeFuncoes)
                        ? maybeFuncoes.map((f) => String(f)).sort()
                        : null
                      const expectedFuncoes = funcoesToSave

                      const savedFuncoesKey = savedFuncoes ? savedFuncoes.join('|') : ''
                      const expectedFuncoesKey = expectedFuncoes ? expectedFuncoes.join('|') : ''

                      if (savedFuncoesKey !== expectedFuncoesKey) {
                        setMembrosError(
                          'Não foi possível salvar as funções selecionadas (o servidor retornou valores diferentes).',
                        )
                        await carregarMembros()
                        return
                      }

                      cancelarEdicaoMembro()
                      await carregarMembros()
                    } catch (e) {
                      console.error(e)
                      setMembrosError('Erro ao atualizar membro.')
                    } finally {
                      setSavingMembro(false)
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-[11px] font-semibold text-slate-900 hover:bg-emerald-400"
                  disabled={savingMembro}
                >
                  {savingMembro ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>,
          modalRoot ?? document.body,
        )
      })()}

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
