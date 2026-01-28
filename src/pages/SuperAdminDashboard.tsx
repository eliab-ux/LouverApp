import { IonButton, IonInput, IonSelect, IonSelectOption, IonToggle } from '@ionic/react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

type AppConfig = {
  id: number
  free_limite_usuarios_ativos: number
  free_limite_musicas: number
  pro_limite_usuarios_ativos: number | null
  pro_limite_musicas: number | null
  sku_android_mensal: string
  sku_android_anual: string | null
  sku_ios_mensal: string
  sku_ios_anual: string | null
  habilitar_anual: boolean
  default_whatsapp_instance_id?: string | null
  default_whatsapp_api_key?: string | null
  default_whatsapp_enabled?: boolean
  updated_at: string
}

type IgrejaRow = {
  id: string
  nome: string | null
  cnpj: string | null
  status: 'active' | 'suspended' | 'canceled'
  pro_gratuito: boolean
  dispensada_motivo: string | null
  dispensada_em: string | null
}

type AssinaturaRow = {
  id: string
  igreja_id: string
  plataforma: 'ios' | 'android'
  sku: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'suspended'
  current_period_end: string | null
  updated_at: string
  igreja?: { id: string; nome: string | null } | null
}

type AuditRow = {
  id: string
  super_admin_user_id: string
  action: string
  payload: Record<string, unknown>
  created_at: string
}

export function SuperAdminDashboard({ user }: { user: AppUser }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [configSaving, setConfigSaving] = useState(false)

  const [igrejas, setIgrejas] = useState<IgrejaRow[]>([])
  const [igrejasLoading, setIgrejasLoading] = useState(false)
  const [igrejasError, setIgrejasError] = useState<string | null>(null)
  const [igrejasBusca, setIgrejasBusca] = useState('')
  const [igrejasStatusFiltro, setIgrejasStatusFiltro] = useState<'todas' | IgrejaRow['status']>('todas')
  const [igrejasPagina, setIgrejasPagina] = useState(1)

  const [assinaturas, setAssinaturas] = useState<AssinaturaRow[]>([])
  const [assinaturasLoading, setAssinaturasLoading] = useState(false)
  const [assinaturasError, setAssinaturasError] = useState<string | null>(null)
  const [assinaturasFiltroStatus, setAssinaturasFiltroStatus] = useState<'todas' | AssinaturaRow['status']>('todas')
  const [assinaturasPagina, setAssinaturasPagina] = useState(1)

  const [auditoria, setAuditoria] = useState<AuditRow[]>([])
  const [auditoriaLoading, setAuditoriaLoading] = useState(false)
  const [auditoriaError, setAuditoriaError] = useState<string | null>(null)

  const logAudit = async (action: string, payload: Record<string, unknown>) => {
    await supabase.from('audit_super_admin').insert({
      super_admin_user_id: user.id,
      action,
      payload,
    })
  }

  const carregarConfig = async () => {
    try {
      setConfigLoading(true)
      setConfigError(null)
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle()
      if (error) {
        setConfigError(error.message)
        return
      }
      setConfig(data as AppConfig)
    } finally {
      setConfigLoading(false)
    }
  }

  const carregarIgrejas = async () => {
    try {
      setIgrejasLoading(true)
      setIgrejasError(null)
      const { data, error } = await supabase
        .from('igrejas')
        .select('id, nome, cnpj, status, pro_gratuito, dispensada_motivo, dispensada_em')
        .order('nome', { ascending: true })
      if (error) {
        setIgrejasError(error.message)
        return
      }
      setIgrejas((data as IgrejaRow[]) ?? [])
    } finally {
      setIgrejasLoading(false)
    }
  }

  const carregarAssinaturas = async () => {
    try {
      setAssinaturasLoading(true)
      setAssinaturasError(null)
      const { data, error } = await supabase
        .from('igreja_assinatura')
        .select('id, igreja_id, plataforma, sku, status, current_period_end, updated_at, igreja:igrejas(id, nome)')
        .order('updated_at', { ascending: false })
      if (error) {
        setAssinaturasError(error.message)
        return
      }
      const rows = (data ?? []).map((row) => {
        const rowAny = row as unknown as {
          igreja?: { id: string; nome: string | null }[] | { id: string; nome: string | null } | null
        }
        const igreja = Array.isArray(rowAny.igreja)
          ? rowAny.igreja[0] ?? null
          : rowAny.igreja ?? null
        return { ...row, igreja } as AssinaturaRow
      })
      setAssinaturas(rows)
    } finally {
      setAssinaturasLoading(false)
    }
  }

  const carregarAuditoria = async () => {
    try {
      setAuditoriaLoading(true)
      setAuditoriaError(null)
      const { data, error } = await supabase
        .from('audit_super_admin')
        .select('id, super_admin_user_id, action, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) {
        setAuditoriaError(error.message)
        return
      }
      setAuditoria((data as AuditRow[]) ?? [])
    } finally {
      setAuditoriaLoading(false)
    }
  }

  useEffect(() => {
    void carregarConfig()
    void carregarIgrejas()
    void carregarAssinaturas()
    void carregarAuditoria()
  }, [])

  const kpis = useMemo(() => {
    const total = igrejas.length
    const ativas = igrejas.filter((i) => i.status === 'active').length
    const suspensas = igrejas.filter((i) => i.status !== 'active').length
    const pro = assinaturas.filter((a) => a.status === 'active' || a.status === 'trialing').length
    return { total, ativas, suspensas, pro }
  }, [igrejas, assinaturas])

  const igrejasFiltradas = useMemo(() => {
    const term = igrejasBusca.trim().toLowerCase()
    return igrejas.filter((igreja) => {
      if (igrejasStatusFiltro !== 'todas' && igreja.status !== igrejasStatusFiltro) return false
      if (!term) return true
      const nome = (igreja.nome ?? '').toLowerCase()
      const cnpj = (igreja.cnpj ?? '').toLowerCase()
      return nome.includes(term) || cnpj.includes(term) || igreja.id.toLowerCase().includes(term)
    })
  }, [igrejas, igrejasBusca, igrejasStatusFiltro])

  const igrejasPorPagina = 8
  const totalPaginasIgrejas = Math.max(1, Math.ceil(igrejasFiltradas.length / igrejasPorPagina))
  const igrejasPaginaClamped = Math.min(igrejasPagina, totalPaginasIgrejas)
  const igrejasPaginadas = igrejasFiltradas.slice(
    (igrejasPaginaClamped - 1) * igrejasPorPagina,
    igrejasPaginaClamped * igrejasPorPagina,
  )

  const assinaturasFiltradas = useMemo(() => {
    if (assinaturasFiltroStatus === 'todas') return assinaturas
    return assinaturas.filter((a) => a.status === assinaturasFiltroStatus)
  }, [assinaturas, assinaturasFiltroStatus])

  const assinaturasPorPagina = 8
  const totalPaginasAssinaturas = Math.max(1, Math.ceil(assinaturasFiltradas.length / assinaturasPorPagina))
  const assinaturasPaginaClamped = Math.min(assinaturasPagina, totalPaginasAssinaturas)
  const assinaturasPaginadas = assinaturasFiltradas.slice(
    (assinaturasPaginaClamped - 1) * assinaturasPorPagina,
    assinaturasPaginaClamped * assinaturasPorPagina,
  )

  const salvarConfig = async () => {
    if (!config) return
    try {
      setConfigSaving(true)
      const payload = {
        free_limite_usuarios_ativos: Number(config.free_limite_usuarios_ativos),
        free_limite_musicas: Number(config.free_limite_musicas),
        pro_limite_usuarios_ativos: config.pro_limite_usuarios_ativos ?? null,
        pro_limite_musicas: config.pro_limite_musicas ?? null,
        sku_android_mensal: config.sku_android_mensal.trim(),
        sku_android_anual: config.sku_android_anual?.trim() || null,
        sku_ios_mensal: config.sku_ios_mensal.trim(),
        sku_ios_anual: config.sku_ios_anual?.trim() || null,
        habilitar_anual: config.habilitar_anual,
        default_whatsapp_enabled: Boolean(config.default_whatsapp_enabled),
        default_whatsapp_instance_id: config.default_whatsapp_instance_id?.trim() || null,
        default_whatsapp_api_key: config.default_whatsapp_api_key?.trim() || null,
      }
      const { error } = await supabase
        .from('app_config')
        .update(payload)
        .eq('id', 1)
      if (error) {
        setConfigError(error.message)
        return
      }
      await logAudit('update_app_config', payload)
      await carregarConfig()
    } finally {
      setConfigSaving(false)
    }
  }

  const atualizarStatusIgreja = async (igreja: IgrejaRow, nextStatus: IgrejaRow['status']) => {
    const confirmText =
      nextStatus === 'active'
        ? 'Reativar esta igreja?'
        : `Suspender a igreja ${igreja.nome ?? igreja.id}?`
    if (!window.confirm(confirmText)) return

    const motivo = nextStatus === 'active' ? null : prompt('Motivo da suspensao (opcional):') || null
    const now = nextStatus === 'active' ? null : new Date().toISOString()

    const { error } = await supabase
      .from('igrejas')
      .update({
        status: nextStatus,
        dispensada_motivo: motivo,
        dispensada_em: now,
      })
      .eq('id', igreja.id)

    if (error) {
      setIgrejasError(error.message)
      return
    }

    await logAudit('update_igreja_status', {
      igreja_id: igreja.id,
      status: nextStatus,
      motivo,
    })
    await supabase.rpc('entitlement_recalculate', { p_igreja_id: igreja.id })
    await carregarIgrejas()
    await carregarAuditoria()
  }

  const recalcularEntitlement = async (igrejaId: string) => {
    await supabase.rpc('entitlement_recalculate', { p_igreja_id: igrejaId })
    await logAudit('recalculate_entitlement', { igreja_id: igrejaId })
  }

  const atualizarProGratuito = async (igreja: IgrejaRow, nextValue: boolean) => {
    const { error } = await supabase
      .from('igrejas')
      .update({ pro_gratuito: nextValue })
      .eq('id', igreja.id)

    if (error) {
      setIgrejasError(error.message)
      return
    }

    await logAudit('update_pro_gratuito', {
      igreja_id: igreja.id,
      pro_gratuito: nextValue,
    })
    await supabase.rpc('entitlement_recalculate', { p_igreja_id: igreja.id })
    await carregarIgrejas()
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Portal Super Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">LouvorApp</h1>
        <p className="mt-1 text-sm text-slate-300">Logado como {user.nome ?? user.email}</p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">Total de igrejas</p>
              <p className="text-lg font-semibold">{kpis.total}</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">Assinaturas ativas</p>
              <p className="text-lg font-semibold">{kpis.pro}</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">Igrejas ativas</p>
              <p className="text-lg font-semibold">{kpis.ativas}</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">Igrejas suspensas</p>
              <p className="text-lg font-semibold">{kpis.suspensas}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Acoes rapidas</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <IonButton
              fill="solid"
              color="medium"
              className="text-xs"
              onClick={() => {
                void carregarConfig()
                void carregarIgrejas()
                void carregarAssinaturas()
                void carregarAuditoria()
              }}
            >
              Atualizar tudo
            </IonButton>
            <IonButton
              fill="outline"
              color="medium"
              className="text-xs"
              onClick={() => setIgrejasPagina(1)}
            >
              Primeira pagina (Igrejas)
            </IonButton>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Configuracoes</p>
        {configLoading ? (
          <p className="mt-2 text-sm text-slate-300">Carregando...</p>
        ) : config ? (
          <div className="mt-2 space-y-2 text-sm text-slate-300">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">Limite usuarios free</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                type="number"
                value={config.free_limite_usuarios_ativos}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, free_limite_usuarios_ativos: Number(e.detail.value ?? 0) } : prev,
                  )
                }
              />
              <label className="text-xs text-slate-400">Limite musicas free</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                type="number"
                value={config.free_limite_musicas}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, free_limite_musicas: Number(e.detail.value ?? 0) } : prev,
                  )
                }
              />
              <label className="text-xs text-slate-400">Limite usuarios pro</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                type="number"
                value={config.pro_limite_usuarios_ativos ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, pro_limite_usuarios_ativos: Number(e.detail.value ?? 0) } : prev,
                  )
                }
              />
              <label className="text-xs text-slate-400">Limite musicas pro</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                type="number"
                value={config.pro_limite_musicas ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, pro_limite_musicas: Number(e.detail.value ?? 0) } : prev,
                  )
                }
              />
              <label className="text-xs text-slate-400">SKU Android mensal</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                value={config.sku_android_mensal}
                onIonInput={(e) =>
                  setConfig((prev) => (prev ? { ...prev, sku_android_mensal: String(e.detail.value ?? '') } : prev))
                }
              />
              <label className="text-xs text-slate-400">SKU iOS mensal</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                value={config.sku_ios_mensal}
                onIonInput={(e) =>
                  setConfig((prev) => (prev ? { ...prev, sku_ios_mensal: String(e.detail.value ?? '') } : prev))
                }
              />
              <label className="text-xs text-slate-400">SKU Android anual</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                value={config.sku_android_anual ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) => (prev ? { ...prev, sku_android_anual: String(e.detail.value ?? '') } : prev))
                }
              />
              <label className="text-xs text-slate-400">SKU iOS anual</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                value={config.sku_ios_anual ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) => (prev ? { ...prev, sku_ios_anual: String(e.detail.value ?? '') } : prev))
                }
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <IonToggle
                checked={config.habilitar_anual}
                onIonChange={(e) =>
                  setConfig((prev) => (prev ? { ...prev, habilitar_anual: e.detail.checked } : prev))
                }
              />
              <span>Habilitar anual</span>
            </div>
            <div className="mt-4 border-t border-slate-800/60 pt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Evolution API padrao</p>
              <label className="text-xs text-slate-400">Instance ID padrao</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                value={config.default_whatsapp_instance_id ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, default_whatsapp_instance_id: String(e.detail.value ?? '') } : prev,
                  )
                }
              />
              <label className="text-xs text-slate-400">API Key padrao</label>
              <IonInput
                className="rounded-md bg-slate-950/60 px-2 py-1 text-sm text-slate-100"
                type="password"
                value={config.default_whatsapp_api_key ?? ''}
                onIonInput={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, default_whatsapp_api_key: String(e.detail.value ?? '') } : prev,
                  )
                }
              />
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <IonToggle
                  checked={Boolean(config.default_whatsapp_enabled)}
                  onIonChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, default_whatsapp_enabled: e.detail.checked } : prev,
                    )
                  }
                />
                <span>Habilitar WhatsApp por padrao</span>
              </div>
            </div>
            <IonButton
              color="success"
              className="text-xs"
              onClick={() => void salvarConfig()}
              disabled={configSaving}
            >
              {configSaving ? 'Salvando...' : 'Salvar configuracoes'}
            </IonButton>
            <p className="text-xs text-slate-400">Atualizado em: {new Date(config.updated_at).toLocaleString('pt-BR')}</p>
            {configError && <p className="text-xs text-red-300">{configError}</p>}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-300">Sem configuracao.</p>
        )}
      </section>

      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Igrejas</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <IonInput
              className="rounded-md bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
              placeholder="Buscar igreja..."
              value={igrejasBusca}
              onIonInput={(e) => {
                setIgrejasBusca(String(e.detail.value ?? ''))
                setIgrejasPagina(1)
              }}
            />
            <IonSelect
              className="rounded-md bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
              value={igrejasStatusFiltro}
              onIonChange={(e) => {
                setIgrejasStatusFiltro(e.detail.value as typeof igrejasStatusFiltro)
                setIgrejasPagina(1)
              }}
            >
              <IonSelectOption value="todas">Todas</IonSelectOption>
              <IonSelectOption value="active">Ativas</IonSelectOption>
              <IonSelectOption value="suspended">Suspensas</IonSelectOption>
              <IonSelectOption value="canceled">Canceladas</IonSelectOption>
            </IonSelect>
          </div>
        </div>
        {igrejasLoading ? (
          <p className="mt-2 text-sm text-slate-300">Carregando...</p>
        ) : igrejasFiltradas.length == 0 ? (
          <p className="mt-2 text-sm text-slate-300">Nenhuma igreja encontrada.</p>
        ) : (
          <div className="mt-2 space-y-2 text-sm text-slate-300">
            {igrejasPaginadas.map((igreja) => (
              <div key={igreja.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/50 p-3">
                <div>
                  <p className="font-semibold">{igreja.nome ?? 'Sem nome'}</p>
                  <p className="text-xs text-slate-400">{igreja.id}</p>
                  {igreja.cnpj && <p className="text-xs text-slate-400">CNPJ: {igreja.cnpj}</p>}
                  {igreja.dispensada_motivo && (
                    <p className="text-xs text-amber-300">Motivo: {igreja.dispensada_motivo}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      igreja.status === 'active' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                    }`}
                  >
                    {igreja.status}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <IonToggle
                      checked={igreja.pro_gratuito}
                      onIonChange={(e) => void atualizarProGratuito(igreja, e.detail.checked)}
                    />
                    <span>Pro gratuito</span>
                  </div>
                  <IonButton
                    fill="outline"
                    color="medium"
                    className="text-xs"
                    onClick={() => void recalcularEntitlement(igreja.id)}
                  >
                    Recalcular
                  </IonButton>
                  {igreja.status === 'active' ? (
                    <IonButton
                      color="danger"
                      className="text-xs"
                      onClick={() => void atualizarStatusIgreja(igreja, 'suspended')}
                    >
                      Suspender
                    </IonButton>
                  ) : (
                    <IonButton
                      color="success"
                      className="text-xs"
                      onClick={() => void atualizarStatusIgreja(igreja, 'active')}
                    >
                      Reativar
                    </IonButton>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
              <IonButton
                fill="outline"
                color="medium"
                className="text-xs"
                onClick={() => setIgrejasPagina(Math.max(1, igrejasPaginaClamped - 1))}
                disabled={igrejasPaginaClamped <= 1}
              >
                Pagina anterior
              </IonButton>
              <span>
                Pagina {igrejasPaginaClamped} de {totalPaginasIgrejas}
              </span>
              <IonButton
                fill="outline"
                color="medium"
                className="text-xs"
                onClick={() => setIgrejasPagina(Math.min(totalPaginasIgrejas, igrejasPaginaClamped + 1))}
                disabled={igrejasPaginaClamped >= totalPaginasIgrejas}
              >
                Proxima pagina
              </IonButton>
            </div>
            {igrejasError && <p className="text-xs text-red-300">{igrejasError}</p>}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Assinaturas</p>
            <IonSelect
              className="rounded-md bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
              value={assinaturasFiltroStatus}
              onIonChange={(e) => {
                setAssinaturasFiltroStatus(e.detail.value as typeof assinaturasFiltroStatus)
                setAssinaturasPagina(1)
              }}
            >
              <IonSelectOption value="todas">Todas</IonSelectOption>
              <IonSelectOption value="active">Ativas</IonSelectOption>
              <IonSelectOption value="trialing">Trial</IonSelectOption>
              <IonSelectOption value="past_due">Past due</IonSelectOption>
              <IonSelectOption value="canceled">Canceladas</IonSelectOption>
              <IonSelectOption value="expired">Expiradas</IonSelectOption>
              <IonSelectOption value="suspended">Suspensas</IonSelectOption>
            </IonSelect>
          </div>
          {assinaturasLoading ? (
            <p className="mt-2 text-sm text-slate-300">Carregando...</p>
          ) : assinaturasFiltradas.length == 0 ? (
            <p className="mt-2 text-sm text-slate-300">Sem assinaturas.</p>
          ) : (
            <div className="mt-2 space-y-2 text-sm text-slate-300">
              {assinaturasPaginadas.map((assinatura) => (
                <div key={assinatura.id} className="rounded-xl bg-slate-950/50 p-3">
                  <p className="font-semibold">
                    {assinatura.igreja?.nome ?? assinatura.igreja_id}
                  </p>
                  <p className="text-xs text-slate-400">
                    {assinatura.plataforma} - {assinatura.sku}
                  </p>
                  <p className="text-xs text-slate-400">Status: {assinatura.status}</p>
                  {assinatura.current_period_end && (
                    <p className="text-xs text-slate-400">
                      Periodo ate {new Date(assinatura.current_period_end).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                <IonButton
                  fill="outline"
                  color="medium"
                  className="text-xs"
                  onClick={() => setAssinaturasPagina(Math.max(1, assinaturasPaginaClamped - 1))}
                  disabled={assinaturasPaginaClamped <= 1}
                >
                  Pagina anterior
                </IonButton>
                <span>
                  Pagina {assinaturasPaginaClamped} de {totalPaginasAssinaturas}
                </span>
                <IonButton
                  fill="outline"
                  color="medium"
                  className="text-xs"
                  onClick={() => setAssinaturasPagina(Math.min(totalPaginasAssinaturas, assinaturasPaginaClamped + 1))}
                  disabled={assinaturasPaginaClamped >= totalPaginasAssinaturas}
                >
                  Proxima pagina
                </IonButton>
              </div>
              {assinaturasError && <p className="text-xs text-red-300">{assinaturasError}</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auditoria</p>
          {auditoriaLoading ? (
            <p className="mt-2 text-sm text-slate-300">Carregando...</p>
          ) : auditoria.length == 0 ? (
            <p className="mt-2 text-sm text-slate-300">Sem registros.</p>
          ) : (
            <div className="mt-2 space-y-2 text-sm text-slate-300">
              {auditoria.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-950/50 p-3">
                  <p className="font-semibold">{item.action}</p>
                  <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
              {auditoriaError && <p className="text-xs text-red-300">{auditoriaError}</p>}
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
