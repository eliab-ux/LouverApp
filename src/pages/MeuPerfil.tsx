import { useEffect, useMemo, useState } from 'react'
import { IonButton, IonInput, IonItem, IonLabel } from '@ionic/react'
import { supabase } from '../lib/supabase'
import { useInlineToast } from '../lib/inlineToastContext'
import type { AppUser } from '../types'

type PerfilForm = {
  email: string
  telefone: string
}

export function MeuPerfil({ user }: { user: AppUser }) {
  const { showToast } = useInlineToast()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [form, setForm] = useState<PerfilForm>({
    email: user.email,
    telefone: user.telefone ?? '',
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('email, telefone')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          showToast({ message: error.message, color: 'danger' })
          return
        }

        if (!data || !mounted) return

        setForm({
          email: String(data.email ?? user.email),
          telefone: String(data.telefone ?? ''),
        })
      } catch (e) {
        console.error(e)
        showToast({ message: 'Erro ao carregar perfil.', color: 'danger' })
      } finally {
        if (mounted) setInitialLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [showToast, user.email, user.id])

  const canSave = useMemo(() => {
    if (initialLoading || loading) return false
    if (!form.email.trim()) return false
    return true
  }, [form.email, initialLoading, loading])

  const salvar = async () => {
    if (!canSave) return

    setLoading(true)
    try {
      const nextEmail = form.email.trim()
      const nextTelefone = form.telefone.trim() || null

      if (nextEmail !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: nextEmail })
        if (authErr) {
          showToast({ message: authErr.message, color: 'danger' })
          return
        }
      }

      const { error: userErr } = await supabase
        .from('usuarios')
        .update({ email: nextEmail, telefone: nextTelefone })
        .eq('id', user.id)

      if (userErr) {
        showToast({ message: userErr.message, color: 'danger' })
        return
      }

      showToast({ message: 'Perfil atualizado.', color: 'success' })

      if (nextEmail !== user.email) {
        showToast({ message: 'Confirme o novo e-mail na sua caixa de entrada.', color: 'medium' })
      }

      window.setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (e) {
      console.error(e)
      showToast({ message: 'Erro ao salvar perfil.', color: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h2 className="text-base font-semibold">Meu Perfil</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Atualize seus dados pessoais.</p>
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-[#111B2E] p-4 space-y-3">
        <IonItem lines="none" className="rounded-xl">
          <IonLabel position="stacked">E-mail</IonLabel>
          <IonInput
            value={form.email}
            inputMode="email"
            autocomplete="email"
            onIonChange={(e) => setForm((prev) => ({ ...prev, email: String(e.detail.value ?? '') }))}
          />
        </IonItem>

        <IonItem lines="none" className="rounded-xl">
          <IonLabel position="stacked">Telefone</IonLabel>
          <IonInput
            value={form.telefone}
            inputMode="tel"
            autocomplete="tel"
            onIonChange={(e) => setForm((prev) => ({ ...prev, telefone: String(e.detail.value ?? '') }))}
          />
        </IonItem>

        <IonButton
          expand="block"
          size="small"
          disabled={!canSave}
          onClick={() => void salvar()}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </IonButton>
      </div>
    </div>
  )
}
