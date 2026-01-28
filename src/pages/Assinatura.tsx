import { IonButton } from '@ionic/react'
import type { AppUser } from '../types'
import { useEntitlement } from '../lib/useEntitlement'

export function Assinatura({ user }: { user: AppUser }) {
  const { entitlement, loading, error, refresh } = useEntitlement(user.igrejaId)

  return (
    <main className="space-y-4">
      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Assinatura</p>
        <h2 className="mt-2 text-2xl font-semibold">Plano atual</h2>
        <p className="mt-1 text-sm text-slate-300">
          {loading && 'Carregando...'}
          {!loading && entitlement && (entitlement.plano === 'pro' ? 'Pro' : 'Free')}
          {!loading && !entitlement && 'Indisponivel'}
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900/60 p-4 shadow-sm text-slate-100">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Limites</p>
        {entitlement ? (
          <div className="mt-2 space-y-1 text-sm text-slate-300">
            <p>Usuarios ativos: {entitlement.limite_usuarios_ativos ?? 'Ilimitado'}</p>
            <p>Musicas cadastradas: {entitlement.limite_musicas ?? 'Ilimitado'}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Sem dados de entitlement.</p>
        )}
      </section>

      {error && (
        <div className="rounded-2xl bg-red-950/50 border border-red-500/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <IonButton onClick={() => void refresh()}>Atualizar status</IonButton>
      </div>
    </main>
  )
}
