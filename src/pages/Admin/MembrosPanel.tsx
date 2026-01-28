import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import {
  IonAccordion,
  IonAccordionGroup,
  IonAlert,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  useIonRouter,
} from '@ionic/react'
import { checkmarkOutline, chevronBackOutline, chevronForwardOutline, closeOutline, createOutline, paperPlaneOutline, trashOutline } from 'ionicons/icons'
import { supabase } from '../../lib/supabase'
import type { AppUser } from '../../types'
import { maskPhoneBR, unmask } from '../../utils/phoneMask'
import {
  LABEL_CLASSES,
  INPUT_STYLES,
  TEXT_CLASSES,
} from '../../styles/form-styles'

export type Membro = {
  id: string
  nome: string | null
  email: string
  telefone: string | null
  papel: 'admin' | 'lider' | 'membro'
  funcoes?: string[] | null
  last_sign_in_at?: string | null
  confirmed_at?: string | null
  status?: 'aguardando_verificacao' | 'ativo' | 'inativo' | null
}

interface MembrosPanelProps {
  user: AppUser
}

export function MembrosPanel({ user }: MembrosPanelProps) {
  const router = useIonRouter()
  const [membros, setMembros] = useState<Membro[]>([])
  const [membrosLoading, setMembrosLoading] = useState(false)
  const [membrosError, setMembrosError] = useState<string | null>(null)
  const [novoMembroEmail, setNovoMembroEmail] = useState('')
  const [novoMembroNome, setNovoMembroNome] = useState('')
  const [novoMembroPapel, setNovoMembroPapel] = useState<'membro' | 'lider' | 'admin'>('membro')
  const [savingMembro, setSavingMembro] = useState(false)
  const [novoMembroFuncoes, setNovoMembroFuncoes] = useState<string[]>([])
  const [novoMembroTelefoneMasked, setNovoMembroTelefoneMasked] = useState('')
  const [novoMembroTelefoneDigits, setNovoMembroTelefoneDigits] = useState('')

  const itensPorPagina = 5
  const [paginaMembro, setPaginaMembro] = useState(1)
  const [filtroPapel, setFiltroPapel] = useState<'todos' | 'admin' | 'lider' | 'membro'>('todos')

  const [editandoMembroId, setEditandoMembroId] = useState<string | null>(null)
  const [editandoMembroNome, setEditandoMembroNome] = useState('')
  const [editandoMembroEmail, setEditandoMembroEmail] = useState('')
  const [editandoMembroTelefoneMasked, setEditandoMembroTelefoneMasked] = useState('')
  const [editandoMembroTelefoneDigits, setEditandoMembroTelefoneDigits] = useState('')
  const [editandoMembroPapel, setEditandoMembroPapel] = useState<'admin' | 'lider' | 'membro'>('membro')
  const [editandoMembroFuncoes, setEditandoMembroFuncoes] = useState<string[]>([])

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

  const extrairErroDaFuncao = async (err: unknown) => {
    if (!err || typeof err !== 'object') return null
    const maybeContext = (err as { context?: Response }).context
    if (maybeContext && typeof maybeContext.json === 'function') {
      const payload = await maybeContext.json().catch(() => null)
      if (payload && typeof payload === 'object') {
        const maybeMessage = [
          (payload as { error?: unknown }).error,
          (payload as { details?: unknown }).details,
          (payload as { message?: unknown }).message,
        ].find((value) => typeof value === 'string' && value.trim())
        if (typeof maybeMessage === 'string') {
          return maybeMessage
        }
      }
    }
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message?: string }).message ?? null
    }
    return null
  }

  const tratarErroMembro = (message: string, fallback?: string) => {
    if (message.includes('LIMIT_REACHED_USUARIOS')) {
      setMembrosError('Limite de usuarios do plano Free atingido. Assine o Pro para liberar mais membros.')
      window.setTimeout(() => router.push('/app/assinatura', 'forward', 'push'), 600)
      return
    }
    if (message.includes('IGREJA_SUSPENSA')) {
      setMembrosError('Igreja suspensa. Cadastro de membros bloqueado.')
      return
    }
    setMembrosError(fallback ?? message)
  }

  const carregarMembros = useCallback(async () => {
    if (user.papel !== 'admin') return

    try {
      setMembrosLoading(true)
      setMembrosError(null)
      const { data, error } = await supabase.functions.invoke('list_membros_admin', {
        body: { igreja_id: user.igrejaId },
      })

      if (error) {
        console.error('Erro ao carregar membros via Edge Function:', error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('usuarios')
          .select('id, nome, email, telefone, papel, funcoes, status')
          .eq('igreja_id', user.igrejaId)
          .order('nome', { ascending: true })

        if (fallbackError) {
          console.error('Erro ao carregar membros:', fallbackError)
          setMembrosError('Erro ao carregar membros da igreja.')
          return
        }

        setMembros(
          (fallbackData ?? []).map((m) => ({
            id: String(m.id),
            nome: m.nome ?? null,
            email: m.email || `ID: ${String(m.id).substring(0, 8)}...`,
            telefone: m.telefone ?? null,
            papel: m.papel as 'admin' | 'lider' | 'membro',
            funcoes: Array.isArray(m.funcoes) ? m.funcoes.map((f) => String(f)) : null,
            status: (m as { status?: Membro['status'] }).status ?? null,
          })),
        )
        return
      }

      const response = data as { membros?: Array<Record<string, unknown>> } | null
      const membrosApi = Array.isArray(response?.membros) ? response?.membros : []

      setMembros(
        membrosApi.map((m) => ({
          id: String(m.id ?? ''),
          nome: (m.nome as string | null) ?? null,
          email: (m.email as string | null) || `ID: ${String(m.id ?? '').substring(0, 8)}...`,
          telefone: (m.telefone as string | null) ?? null,
          papel: m.papel as 'admin' | 'lider' | 'membro',
          funcoes: Array.isArray(m.funcoes) ? m.funcoes.map((f) => String(f)) : null,
          last_sign_in_at: (m.last_sign_in_at as string | null) ?? null,
          confirmed_at: (m.confirmed_at as string | null) ?? null,
          status: (m.status as Membro['status']) ?? null,
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

    if (!novoMembroNome.trim()) {
      setMembrosError('Informe o nome do novo membro.')
      return
    }

    try {
      setSavingMembro(true)
      setMembrosError(null)

      const { data, error } = await supabase.functions.invoke('invite_user_admin', {
        body: {
          email: novoMembroEmail.trim(),
          nome: novoMembroNome.trim(),
          papel: novoMembroPapel,
          funcoes: novoMembroFuncoes,
          telefone: novoMembroTelefoneDigits.trim() || null,
          igreja_id: user.igrejaId,
        },
      })

      if (error) {
        console.error('Erro na função invite_user_admin:', error)
        const errorMessage = await extrairErroDaFuncao(error)
        if (errorMessage) {
          tratarErroMembro(errorMessage, 'Erro ao enviar convite. Verifique a configuracao da Edge Function.')
          return
        }
        setMembrosError('Erro ao enviar convite. Verifique a configuracao da Edge Function.')
        return
      }

      const responseData: unknown = data
      if (responseData && typeof responseData === 'object') {
        const response = responseData as { error?: unknown; warning?: unknown; details?: unknown }
        const maybeError = [response.error, response.details, response.warning].find(
          (value) => typeof value === 'string' && value.trim(),
        )
        if (typeof maybeError === 'string') {
          tratarErroMembro(maybeError)
          return
        }
      }

      setNovoMembroEmail('')
      setNovoMembroNome('')
      setNovoMembroPapel('membro')
      setNovoMembroFuncoes([])
      setNovoMembroTelefoneMasked('')
      setNovoMembroTelefoneDigits('')
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
    setEditandoMembroPapel(membro.papel)
    setEditandoMembroFuncoes(membro.funcoes ?? [])
    setEditandoMembroNome(membro.nome ?? '')
    setEditandoMembroEmail(membro.email ?? '')
    const masked = maskPhoneBR(String(membro.telefone ?? ''))
    setEditandoMembroTelefoneMasked(masked)
    setEditandoMembroTelefoneDigits(unmask(masked))
  }

  // Cancelar edição de membro
  const cancelarEdicaoMembro = () => {
    setEditandoMembroId(null)
    setEditandoMembroPapel('membro')
    setEditandoMembroFuncoes([])
    setEditandoMembroNome('')
    setEditandoMembroEmail('')
    setEditandoMembroTelefoneMasked('')
    setEditandoMembroTelefoneDigits('')
  }

  const salvarEdicaoMembro = async (event: FormEvent) => {
    event.preventDefault()
    if (!editandoMembroId) return
    if (!editandoMembroEmail.trim()) {
      setMembrosError('Informe um email válido para o membro.')
      return
    }

    try {
      setSavingMembro(true)
      setMembrosError(null)

      const funcoesToSave = editandoMembroFuncoes.length > 0
        ? Array.from(new Set(editandoMembroFuncoes)).sort()
        : null

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nome: editandoMembroNome.trim() || null,
          email: editandoMembroEmail.trim(),
          telefone: editandoMembroTelefoneDigits.trim() || null,
          papel: editandoMembroPapel,
          funcoes: funcoesToSave,
        })
        .eq('id', editandoMembroId)
        .select('id, nome, email, telefone, papel, funcoes')
        .maybeSingle()

      if (error) {
        tratarErroMembro(error.message, `Erro ao atualizar membro: ${error.message}`)
        return
      }

      if (!data) {
        setMembrosError('Sem permissão para atualizar este membro.')
        await carregarMembros()
        return
      }

      cancelarEdicaoMembro()
      await carregarMembros()
    } catch (e) {
      console.error(e)
      tratarErroMembro('Erro ao atualizar membro.')
    } finally {
      setSavingMembro(false)
    }
  }

  const reenviarConviteWhatsApp = async (membro: Membro) => {
    if (!membro.telefone) {
      setMembrosError('Telefone nao informado para reenviar convite.')
      return
    }

    try {
      setSavingMembro(true)
      setMembrosError(null)

      const { data, error } = await supabase.functions.invoke('invite_user_admin', {
        body: {
          email: membro.email,
          nome: membro.nome,
          papel: membro.papel,
          funcoes: membro.funcoes ?? [],
          telefone: membro.telefone,
          igreja_id: user.igrejaId,
        },
      })

      if (error) {
        console.error('Erro ao reenviar convite:', error)
        const errorMessage = await extrairErroDaFuncao(error)
        if (errorMessage) {
          tratarErroMembro(errorMessage, 'Erro ao reenviar convite por WhatsApp.')
          return
        }
        setMembrosError('Erro ao reenviar convite por WhatsApp.')
        return
      }

      const responseData: unknown = data
      if (responseData && typeof responseData === 'object') {
        const response = responseData as { error?: unknown; warning?: unknown; details?: unknown }
        const maybeError = [response.error, response.details, response.warning].find(
          (value) => typeof value === 'string' && value.trim(),
        )
        if (typeof maybeError === 'string') {
          tratarErroMembro(maybeError)
          return
        }
      }
    } catch (e) {
      console.error(e)
      setMembrosError('Erro ao reenviar convite por WhatsApp.')
    } finally {
      setSavingMembro(false)
    }
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

      // 🔍 DEBUG: Logar contexto antes do UPDATE
      console.group('🔍 DEBUG: Tentando remover membro')
      console.log('Meu ID:', user.id)
      console.log('Meu papel:', user.papel)
      console.log('Minha igreja_id:', user.igrejaId)
      console.log('ID do membro a remover:', membroId)

      // Verificar sessão atual do Supabase
      const { data: session } = await supabase.auth.getSession()
      console.log('📝 Sessão atual:', {
        user_id: session?.session?.user?.id,
        email: session?.session?.user?.email,
        role: session?.session?.user?.role,
        token_expira_em: session?.session?.expires_at,
      })

      // Buscar dados do membro antes de remover
      const { data: membroAntes, error: errorBusca } = await supabase
        .from('usuarios')
        .select('id, nome, email, papel, igreja_id')
        .eq('id', membroId)
        .single()

      if (errorBusca) {
        console.error('❌ Erro ao buscar dados do membro:', errorBusca)
      } else {
        console.log('Dados do membro antes:', membroAntes)
      }

      // Remove o membro usando RPC (contorna problema de RLS)
      console.log('📤 Chamando RPC admin_remover_membro para usuário', membroId)
      const { data, error, status, statusText } = await supabase.rpc('admin_remover_membro', {
        p_membro_id: membroId,
      })

      console.log('📥 Resposta do Supabase:')
      console.log('  - Status:', status, statusText)
      console.log('  - Data:', data)
      console.log('  - Error:', error)

      if (error) {
        console.error('❌ ERRO COMPLETO:', JSON.stringify(error, null, 2))
        console.groupEnd()
        tratarErroMembro(error.message, `Erro ao remover membro: ${error.message}`)
        return
      }

      // Verificar resultado da RPC
      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success === false) {
          console.error('❌ RPC retornou erro:', data)
          console.groupEnd()
          const apiError = (data as { error?: string }).error || 'Erro desconhecido'
          tratarErroMembro(apiError, `Erro: ${apiError}`)
          return
        }
        console.log('✅ Resultado da RPC:', data)
      }

      console.log('✅ Membro removido com sucesso!')
      console.groupEnd()

      await carregarMembros()
    } catch (e) {
      console.error('❌ EXCEPTION:', e)
      console.groupEnd()
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
            <h2 className={LABEL_CLASSES.section}>Membros</h2>
            <p className={`${LABEL_CLASSES.field} text-slate-400`}>Gerencie os membros e seus perfis</p>
          </div>
          <div className="flex items-center gap-2">
            <IonItem lines="none" className="rounded-xl" style={{ '--background': 'transparent' } as unknown as Record<string, string>}>
              <IonLabel className={LABEL_CLASSES.small}>Filtrar</IonLabel>
              <IonSelect
                interface="popover"
                value={filtroPapel}
                onIonChange={(e) => {
                  const next = String(e.detail.value ?? 'todos') as 'todos' | 'admin' | 'lider' | 'membro'
                  setFiltroPapel(next)
                  setPaginaMembro(1)
                }}
              >
                <IonSelectOption value="todos">Todos</IonSelectOption>
                <IonSelectOption value="admin">Admin</IonSelectOption>
                <IonSelectOption value="lider">Líder</IonSelectOption>
                <IonSelectOption value="membro">Membro</IonSelectOption>
              </IonSelect>
            </IonItem>
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
                  <p className={`${LABEL_CLASSES.small} mb-2`}>
                    {filtroPapel === 'todos'
                      ? `${membros.length} membro(s) cadastrado(s)`
                      : `${membros.filter((m) => m.papel === filtroPapel).length} de ${membros.length} membro(s)`}
                  </p>
                  <div className="space-y-2 max-h-[520px] overflow-y-auto">
                    {membrosPaginados.map((membro) => (
                      <IonCard
                        key={membro.id}
                        className={`m-0 rounded-2xl bg-slate-950/30 text-xs shadow-sm transition-colors ring-1 ${
                          editandoMembroId === membro.id
                            ? 'ring-emerald-500/50'
                            : 'ring-slate-800/60 hover:bg-slate-900/40'
                        }`}
                      >
                        {editandoMembroId === membro.id ? (
                          <IonCardContent className="p-3">
                            <form onSubmit={salvarEdicaoMembro} className="space-y-2 text-xs">
                              <div>
                                <IonInput
                                  value={editandoMembroNome}
                                  onIonInput={(e) => setEditandoMembroNome(String(e.detail.value ?? ''))}
                                  placeholder="Nome"
                                  style={INPUT_STYLES.default}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className={`${LABEL_CLASSES.field} block mb-1`}>Email</span>
                                  <IonInput
                                    value={editandoMembroEmail}
                                    type="email"
                                    inputMode="email"
                                    autocomplete="email"
                                    onIonInput={(e) => setEditandoMembroEmail(String(e.detail.value ?? ''))}
                                    style={INPUT_STYLES.default}
                                  />
                                </div>
                                <div>
                                  <span className={`${LABEL_CLASSES.field} block mb-1`}>Telefone</span>
                                  <IonInput
                                    value={editandoMembroTelefoneMasked}
                                    type="tel"
                                    inputMode="tel"
                                    autocomplete="tel"
                                    onIonInput={(e) => {
                                      const raw = String(e.detail.value ?? '')
                                      const digitsOnly = raw.replace(/\D/g, '')
                                      const masked = maskPhoneBR(digitsOnly)
                                      setEditandoMembroTelefoneMasked(masked)
                                      setEditandoMembroTelefoneDigits(unmask(masked))
                                    }}
                                    style={INPUT_STYLES.default}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className={`${LABEL_CLASSES.field} block mb-1`}>Papel</span>
                                  <IonSelect
                                    interface="popover"
                                    value={editandoMembroPapel}
                                    onIonChange={(e) => {
                                      setEditandoMembroPapel(String(e.detail.value ?? 'membro') as 'admin' | 'lider' | 'membro')
                                    }}
                                    style={INPUT_STYLES.default}
                                  >
                                    <IonSelectOption value="membro">Membro</IonSelectOption>
                                    <IonSelectOption value="lider">Líder</IonSelectOption>
                                    <IonSelectOption value="admin">Admin</IonSelectOption>
                                  </IonSelect>
                                </div>
                                <div>
                                  <span className={`${LABEL_CLASSES.field} block mb-1`}>Funções</span>
                                  <IonSelect
                                    multiple
                                    interface="alert"
                                    interfaceOptions={{
                                      header: 'Funções',
                                      subHeader: 'Selecione uma ou mais funções',
                                    }}
                                    value={editandoMembroFuncoes}
                                    onIonChange={(e) => setEditandoMembroFuncoes((e.detail.value as string[]) ?? [])}
                                    style={INPUT_STYLES.default}
                                  >
                                    <IonSelectOption value="voz">Voz</IonSelectOption>
                                    <IonSelectOption value="musico">Músico</IonSelectOption>
                                  </IonSelect>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-1">
                                <IonButton
                                  type="button"
                                  fill="clear"
                                  size="small"
                                  onClick={cancelarEdicaoMembro}
                                  disabled={savingMembro}
                                  aria-label="Cancelar edição"
                                  className="m-0 h-7"
                                >
                                  <IonIcon slot="icon-only" icon={closeOutline} />
                                </IonButton>
                                <IonButton
                                  type="submit"
                                  fill="clear"
                                  size="small"
                                  disabled={savingMembro}
                                  aria-label="Salvar edição"
                                  className="m-0 h-7"
                                >
                                  <IonIcon slot="icon-only" icon={checkmarkOutline} />
                                </IonButton>
                              </div>
                            </form>
                          </IonCardContent>
                        ) : (
                          <>
                            <IonCardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={`${LABEL_CLASSES.item} truncate`}>
                                    {membro.nome || 'Sem nome'}
                                    {membro.id === user.id && (
                                      <span className={`ml-1 ${LABEL_CLASSES.small} text-emerald-400`}>(você)</span>
                                    )}
                                  </p>
                                  <IonCardSubtitle className="mt-1">
                                    <div className={`flex flex-wrap items-center gap-2 ${LABEL_CLASSES.field} text-slate-400`}>
                                      <span className="truncate">📧 {membro.email || '-'}</span>
                                      {membro.telefone && <span className="truncate">📱 {maskPhoneBR(membro.telefone)}</span>}
                                    </div>
                                  </IonCardSubtitle>
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
                                  {membro.status === 'aguardando_verificacao' && membro.telefone && (
                                    <IonButton
                                      type="button"
                                      fill="clear"
                                      size="small"
                                      onPointerDown={(e) => {
                                        deferTouchAction(e, () => reenviarConviteWhatsApp(membro))
                                      }}
                                      onClick={(e) => {
                                        if (e.detail !== 0) return
                                        if (shouldIgnoreClickBecauseTouch()) return
                                        reenviarConviteWhatsApp(membro)
                                      }}
                                      aria-label="Reenviar convite por WhatsApp"
                                      title="Reenviar convite por WhatsApp"
                                      className="m-0 h-7"
                                    >
                                      <IonIcon slot="icon-only" icon={paperPlaneOutline} />
                                    </IonButton>
                                  )}
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
                            </IonCardHeader>

                            <IonCardContent className="pt-0">
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span
                                  className={`${TEXT_CLASSES.badge} ${
                                    membro.papel === 'admin'
                                      ? 'bg-red-500/20 text-red-300'
                                      : membro.papel === 'lider'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-slate-500/20 text-slate-300'
                                  }`}
                                >
                                  {membro.papel === 'admin' ? 'Admin' : membro.papel === 'lider' ? 'Líder' : 'Membro'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {membro.status === 'ativo' && 'Ativo'}
                                  {membro.status === 'aguardando_verificacao' && 'Aguardando verificacao'}
                                  {membro.status === 'inativo' && 'Inativo'}
                                </span>
                              </div>
                              {membro.funcoes && membro.funcoes.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {membro.funcoes.map((f) => (
                                    <span
                                      key={f}
                                      className={`${TEXT_CLASSES.badge} inline-flex items-center bg-slate-800/70 text-slate-200`}
                                    >
                                      <span>{f === 'voz' ? 'Voz' : f === 'musico' ? 'Músico' : f}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </IonCardContent>
                          </>
                        )}
                      </IonCard>
                    ))}
                  </div>

                  {totalPaginasMembro > 1 && (
                    <div className="flex items-center justify-between gap-2 pt-2 mt-2">
                      <IonButton
                        type="button"
                        fill="clear"
                        size="small"
                        onClick={() => setPaginaMembro(Math.max(1, paginaMembro - 1))}
                        disabled={paginaMembro <= 1}
                        aria-label="Página anterior"
                        className="m-0 h-7"
                      >
                        <IonIcon slot="icon-only" icon={chevronBackOutline} />
                      </IonButton>
                      <p className={`${LABEL_CLASSES.field} text-slate-400 self-center`}>
                        Página {paginaMembro} de {totalPaginasMembro}
                      </p>
                      <IonButton
                        type="button"
                        fill="clear"
                        size="small"
                        onClick={() => setPaginaMembro(Math.min(totalPaginasMembro, paginaMembro + 1))}
                        disabled={paginaMembro >= totalPaginasMembro}
                        aria-label="Próxima página"
                        className="m-0 h-7"
                      >
                        <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                      </IonButton>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}
      </section>

      <div className="border-t border-slate-800/70" />

      <section className="rounded-2xl bg-slate-900/60 p-2 text-sm shadow-sm">
        <IonAccordionGroup>
          <IonAccordion value="invite">
            <IonItem slot="header" lines="none">
              <IonLabel>Convidar novo membro</IonLabel>
            </IonItem>
            <div slot="content" className="p-4">
              <p className={`${LABEL_CLASSES.field} text-slate-400 mb-4`}>
                Envie um convite por email. O membro receberá um link para criar a senha e ativar a conta.
              </p>

              <form onSubmit={handleInviteMembro} className="space-y-3">
                <IonItem lines="none" className="rounded-xl">
                  <IonLabel position="stacked" className={LABEL_CLASSES.field}>
                    Email do membro *
                  </IonLabel>
                  <IonInput
                    value={novoMembroEmail}
                    type="email"
                    inputMode="email"
                    autocomplete="email"
                    placeholder="exemplo@igreja.com"
                    onIonChange={(e) => setNovoMembroEmail(String(e.detail.value ?? ''))}
                    required
                    style={INPUT_STYLES.default}
                  />
                </IonItem>

                <IonItem lines="none" className="rounded-xl">
                  <IonLabel position="stacked" className={LABEL_CLASSES.field}>
                    Nome do membro
                  </IonLabel>
                  <IonInput
                    value={novoMembroNome}
                    type="text"
                    placeholder="Nome completo"
                    onIonChange={(e) => setNovoMembroNome(String(e.detail.value ?? ''))}
                    style={INPUT_STYLES.default}
                    required
                  />
                </IonItem>

                <IonItem lines="none" className="rounded-xl">
                  <IonLabel position="stacked" className={LABEL_CLASSES.field}>
                    Telefone
                  </IonLabel>
                  <IonInput
                    value={novoMembroTelefoneMasked}
                    type="tel"
                    inputMode="tel"
                    autocomplete="tel"
                    placeholder="(11) 99999-9999"
                    onIonInput={(e) => {
                      const raw = String(e.detail.value ?? '')
                      const digitsOnly = raw.replace(/\D/g, '')
                      const masked = maskPhoneBR(digitsOnly)
                      setNovoMembroTelefoneMasked(masked)
                      setNovoMembroTelefoneDigits(unmask(masked))
                    }}
                    style={INPUT_STYLES.default}
                  />
                </IonItem>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <IonItem lines="none" className="rounded-xl">
                      <IonLabel position="stacked" className={LABEL_CLASSES.field}>
                        Papel na equipe
                      </IonLabel>
                      <IonSelect
                        interface="popover"
                        value={novoMembroPapel}
                        onIonChange={(e) => {
                          setNovoMembroPapel(String(e.detail.value ?? 'membro') as 'membro' | 'lider' | 'admin')
                        }}
                        style={INPUT_STYLES.default}
                      >
                        <IonSelectOption value="membro">Membro</IonSelectOption>
                        <IonSelectOption value="lider">Líder</IonSelectOption>
                        <IonSelectOption value="admin">Admin</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </div>

                  <div>
                    <IonItem lines="none" className="rounded-xl">
                      <IonLabel position="stacked" className={LABEL_CLASSES.field}>
                        Funções
                      </IonLabel>
                      <IonSelect
                        multiple
                        interface="alert"
                        interfaceOptions={{
                          header: 'Funções',
                          subHeader: 'Selecione uma ou mais funções',
                        }}
                        value={novoMembroFuncoes}
                        onIonChange={(e) => setNovoMembroFuncoes((e.detail.value as string[]) ?? [])}
                        style={INPUT_STYLES.default}
                      >
                        <IonSelectOption value="voz">Voz</IonSelectOption>
                        <IonSelectOption value="musico">Músico</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </div>
                </div>

                <IonButton type="submit" expand="block" disabled={savingMembro}>
                  {savingMembro ? 'Enviando convite...' : 'Enviar convite'}
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
