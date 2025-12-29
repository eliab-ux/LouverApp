import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { AppUser } from '../../types'

type ConfigNotificacaoRow = {
  id: string
  igreja_id: string
  dias_antes: number
  alertas_por_dia: number
}

export function NotificacoesPanel({ user }: { user: AppUser }) {
  const [diasAntes, setDiasAntes] = useState(3)
  const [alertasPorDia, setAlertasPorDia] = useState(2)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const carregarConfig = useCallback(async () => {
    if (user.papel !== 'admin' && user.papel !== 'lider') return

    try {
      setLoading(true)
      setError(null)

      const { data, error: loadErr } = await supabase
        .from('configuracao_notificacao')
        .select('id, igreja_id, dias_antes, alertas_por_dia')
        .eq('igreja_id', user.igrejaId)
        .maybeSingle()

      if (loadErr) {
        setError(loadErr.message)
        return
      }

      if (data) {
        const row = data as ConfigNotificacaoRow
        setDiasAntes(Number(row.dias_antes) || 0)
        setAlertasPorDia(Number(row.alertas_por_dia) || 0)
      }
    } catch (e) {
      console.error(e)
      setError('Erro ao carregar configuração de notificações.')
    } finally {
      setLoading(false)
    }
  }, [user.igrejaId, user.papel])

  useEffect(() => {
    void carregarConfig()
  }, [carregarConfig])

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (user.papel !== 'admin' && user.papel !== 'lider') return

    const dias = Number(diasAntes)
    const alertas = Number(alertasPorDia)

    if (!Number.isFinite(dias) || dias < 0) {
      setError('Dias antes deve ser um número maior ou igual a 0.')
      return
    }

    if (!Number.isFinite(alertas) || alertas < 0) {
      setError('Alertas por dia deve ser um número maior ou igual a 0.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const { error: upsertErr } = await supabase
        .from('configuracao_notificacao')
        .upsert(
          {
            igreja_id: user.igrejaId,
            dias_antes: dias,
            alertas_por_dia: alertas,
          },
          { onConflict: 'igreja_id' },
        )

      if (upsertErr) {
        setError(upsertErr.message)
        return
      }

      setSuccess('Configuração salva.')
      window.setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  if (user.papel !== 'admin' && user.papel !== 'lider') {
    return (
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100">🔔 Notificações</h2>
        <p className="mt-2 text-[11px] text-slate-400">Sem permissão.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">🔔 Notificações</h2>
          <p className="text-[11px] text-slate-400">
            Configure quando os lembretes começam e quantas vezes por dia.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-[11px] text-slate-400">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="mt-3 space-y-3">
          {error && (
            <p className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-[11px] text-emerald-200 bg-emerald-950/30 border border-emerald-500/40 rounded-xl px-3 py-2">
              {success}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="diasAntes">
                Dias antes do evento
              </label>
              <input
                id="diasAntes"
                type="number"
                min={0}
                value={diasAntes}
                onChange={(ev) => setDiasAntes(Number(ev.target.value))}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="alertasPorDia">
                Alertas por dia
              </label>
              <input
                id="alertasPorDia"
                type="number"
                min={0}
                value={alertasPorDia}
                onChange={(ev) => setAlertasPorDia(Number(ev.target.value))}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/70 px-4 py-3 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </button>

          <div className="text-[11px] text-slate-400">
            Lembretes automáticos são enviados apenas quando existir escala publicada sem músicas e com ministrantes.
          </div>
        </form>
      )}
    </section>
  )
}
