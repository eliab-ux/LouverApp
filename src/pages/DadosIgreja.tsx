import { useEffect, useMemo, useState } from 'react'
import { IonButton, IonInput, IonItem, IonLabel } from '@ionic/react'
import { supabase } from '../lib/supabase'
import { useInlineToast } from '../lib/inlineToastContext'
import type { AppUser } from '../types'

type IgrejaForm = {
  nome: string
  cnpj: string
}

const onlyDigits = (value: string) => value.replace(/[^\d]/g, '')

export function DadosIgreja({ user }: { user: AppUser }) {
  const { showToast } = useInlineToast()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [form, setForm] = useState<IgrejaForm>({
    nome: user.igrejaNome ?? '',
    cnpj: '',
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .select('nome, cnpj')
          .eq('id', user.igrejaId)
          .maybeSingle()

        if (error) {
          showToast({ message: error.message, color: 'danger' })
          return
        }

        if (!data || !mounted) return

        setForm({
          nome: String(data.nome ?? ''),
          cnpj: String(data.cnpj ?? ''),
        })
      } catch (e) {
        console.error(e)
        showToast({ message: 'Erro ao carregar dados da igreja.', color: 'danger' })
      } finally {
        if (mounted) setInitialLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [showToast, user.igrejaId])

  const canSave = useMemo(() => {
    if (initialLoading || loading) return false
    if (!form.nome.trim()) return false
    const cnpjDigits = onlyDigits(form.cnpj)
    if (cnpjDigits.length !== 14) return false
    return true
  }, [form.cnpj, form.nome, initialLoading, loading])

  const salvar = async () => {
    if (!canSave) return

    setLoading(true)
    try {
      const nome = form.nome.trim()
      const cnpj = onlyDigits(form.cnpj)

      const { error } = await supabase
        .from('igrejas')
        .update({ nome, cnpj })
        .eq('id', user.igrejaId)

      if (error) {
        showToast({ message: error.message, color: 'danger' })
        return
      }

      showToast({ message: 'Dados da igreja atualizados.', color: 'success' })
      window.setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (e) {
      console.error(e)
      showToast({ message: 'Erro ao salvar dados da igreja.', color: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h2 className="text-base font-semibold">Dados da Igreja</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Somente administradores podem editar.</p>
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-[#111B2E] p-4 space-y-3">
        <IonItem lines="none" className="rounded-xl">
          <IonLabel position="stacked">Nome</IonLabel>
          <IonInput
            value={form.nome}
            onIonChange={(e) => setForm((prev) => ({ ...prev, nome: String(e.detail.value ?? '') }))}
          />
        </IonItem>

        <IonItem lines="none" className="rounded-xl">
          <IonLabel position="stacked">CNPJ</IonLabel>
          <IonInput
            value={form.cnpj}
            inputMode="numeric"
            onIonChange={(e) => setForm((prev) => ({ ...prev, cnpj: String(e.detail.value ?? '') }))}
          />
        </IonItem>

        <IonButton expand="block" size="small" disabled={!canSave} onClick={() => void salvar()}>
          {loading ? 'Salvando...' : 'Salvar'}
        </IonButton>
      </div>
    </div>
  )
}
