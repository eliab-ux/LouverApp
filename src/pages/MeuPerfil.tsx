import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useInlineToast } from '../lib/inlineToastContext'
import { maskPhoneBR, unmask } from '../utils/phoneMask'
import type { AppUser } from '../types'
import { Button, Input, Select } from '../components/ui'
import { ThemeSelectRow } from '../components/ThemeSelectRow'

type PerfilForm = {
  email: string
  telefoneMasked: string  // Exibe com máscara (XX) XXXXX-XXXX
  canal_notificacao: 'email' | 'whatsapp' | 'ambos'
}

export function MeuPerfil({ user }: { user: AppUser }) {
  const { showToast } = useInlineToast()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [form, setForm] = useState<PerfilForm>({
    email: user.email,
    telefoneMasked: maskPhoneBR(user.telefone ?? ''),
    canal_notificacao: user.canal_notificacao ?? 'email',
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('email, telefone, canal_notificacao')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          showToast({ message: error.message, color: 'danger' })
          return
        }

        if (!data || !mounted) return

        // Debug: verificar valor do telefone vindo do banco
        console.log('[MeuPerfil] Telefone do banco (SEM máscara):', data.telefone)
        const masked = maskPhoneBR(String(data.telefone ?? ''))
        console.log('[MeuPerfil] Telefone COM máscara:', masked)

        setForm({
          email: String(data.email ?? user.email),
          telefoneMasked: masked,
          canal_notificacao: (data.canal_notificacao as 'email' | 'whatsapp' | 'ambos') ?? 'email',
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
      // Remove máscara do telefone antes de salvar (salva apenas dígitos)
      const nextTelefone = unmask(form.telefoneMasked).trim() || null

      console.log('[MeuPerfil] Salvando telefone SEM máscara:', nextTelefone)

      if (nextEmail !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: nextEmail })
        if (authErr) {
          showToast({ message: authErr.message, color: 'danger' })
          return
        }
      }

      const { error: userErr } = await supabase
        .from('usuarios')
        .update({ email: nextEmail, telefone: nextTelefone, canal_notificacao: form.canal_notificacao })
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
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Título da página */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Meu Perfil</h1>
        <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Atualize seus dados pessoais.</p>
      </div>

      {/* Formulário */}
      <div className="rounded-xl bg-white dark:bg-neutral-800 p-4 space-y-4">
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="seu@email.com"
          disabled={loading || initialLoading}
        />

        <Input
          label="Telefone"
          type="tel"
          value={form.telefoneMasked}
          onChange={(e) => {
            const masked = maskPhoneBR(e.target.value)
            setForm((prev) => ({ ...prev, telefoneMasked: masked }))
          }}
          placeholder="(11) 99999-9999"
          disabled={loading || initialLoading}
        />

        <Select
          label="Canal de Notificação Preferido"
          value={form.canal_notificacao}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, canal_notificacao: e.target.value as 'email' | 'whatsapp' | 'ambos' }))
          }
          disabled={loading || initialLoading}
        >
          <option value="email">📧 Email</option>
          <option value="whatsapp">💬 WhatsApp</option>
          <option value="ambos">📧💬 Ambos (Email + WhatsApp)</option>
        </Select>

        {form.canal_notificacao !== 'email' && !form.telefoneMasked.trim() && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
            <span className="text-warning-600 dark:text-warning-400 text-sm">⚠️</span>
            <p className="text-xs md:text-sm text-warning-700 dark:text-warning-300">
              Para receber notificações via WhatsApp, adicione seu telefone acima.
            </p>
          </div>
        )}

        {/* Seletor de Tema */}
        <div className="pt-2">
          <ThemeSelectRow />
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={!canSave}
          loading={loading}
          onClick={() => void salvar()}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
