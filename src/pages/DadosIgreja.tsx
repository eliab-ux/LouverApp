import { useEffect, useMemo, useState } from 'react'
import { IonToggle } from '@ionic/react'
import { supabase } from '../lib/supabase'
import { useInlineToast } from '../lib/inlineToastContext'
import type { AppUser } from '../types'
import { Button, Input } from '../components/ui'

type IgrejaForm = {
  nome: string
  cnpj: string
  whatsapp_habilitado: boolean
  whatsapp_instance_id: string
  whatsapp_api_key: string
}

const onlyDigits = (value: string) => value.replace(/[^\d]/g, '')

export function DadosIgreja({ user }: { user: AppUser }) {
  const { showToast } = useInlineToast()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [form, setForm] = useState<IgrejaForm>({
    nome: user.igrejaNome ?? '',
    cnpj: '',
    whatsapp_habilitado: user.igrejaWhatsAppHabilitado ?? false,
    whatsapp_instance_id: user.igrejaWhatsAppInstanceId ?? '',
    whatsapp_api_key: '',
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setInitialLoading(true)
      try {
        const { data, error } = await supabase
          .from('igrejas')
          .select('nome, cnpj, whatsapp_habilitado, whatsapp_instance_id')
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
          whatsapp_habilitado: (data as unknown as { whatsapp_habilitado?: boolean }).whatsapp_habilitado ?? false,
          whatsapp_instance_id: String((data as unknown as { whatsapp_instance_id?: string }).whatsapp_instance_id ?? ''),
          whatsapp_api_key: '', // Nunca carregar a API key do banco por segurança
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

      // Preparar update baseado nos campos preenchidos
      const updateData: Record<string, unknown> = {
        nome,
        cnpj,
        whatsapp_habilitado: form.whatsapp_habilitado,
        whatsapp_instance_id: form.whatsapp_habilitado ? form.whatsapp_instance_id.trim() : null,
      }

      // Só atualizar API key se foi fornecida
      if (form.whatsapp_api_key.trim()) {
        updateData.whatsapp_api_key = form.whatsapp_api_key.trim()
      }

      const { error } = await supabase
        .from('igrejas')
        .update(updateData)
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
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Título da página */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dados da Igreja</h1>
      </div>

      {/* Dados Básicos */}
      <div className="rounded-xl bg-white dark:bg-neutral-800 p-4 space-y-4">
        <h2 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100">Dados Básicos</h2>

        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          placeholder="Nome da igreja"
          disabled={loading || initialLoading}
        />

        <Input
          label="CNPJ"
          value={form.cnpj}
          onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
          placeholder="00.000.000/0000-00"
          disabled={loading || initialLoading}
          helperText="Digite apenas os números"
        />

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

      {/* Configurações WhatsApp */}
      <div className="rounded-xl bg-white dark:bg-neutral-800 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Notificações via WhatsApp
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Envie notificações via WhatsApp usando Evolution API
            </p>
          </div>
          <IonToggle
            checked={form.whatsapp_habilitado}
            onIonChange={(e) =>
              setForm((prev) => ({ ...prev, whatsapp_habilitado: e.detail.checked }))
            }
            style={{ '--handle-width': '20px', '--handle-height': '20px', '--track-height': '24px', '--track-width': '44px' } as React.CSSProperties}
          />
        </div>

        {form.whatsapp_habilitado && (
          <div className="space-y-4 pt-2">
            <Input
              label="Instance ID (Evolution API)"
              value={form.whatsapp_instance_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp_instance_id: e.target.value }))
              }
              placeholder="minha-instancia"
              disabled={loading || initialLoading}
            />

            <Input
              label="API Key (Evolution API)"
              helperText={!form.whatsapp_api_key ? 'Deixe em branco para manter a atual' : undefined}
              type="password"
              value={form.whatsapp_api_key}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp_api_key: e.target.value }))
              }
              placeholder="Sua API Key"
              disabled={loading || initialLoading}
            />

            <div className="flex items-start gap-2 p-3 rounded-lg bg-info-50 dark:bg-info-900/20">
              <span className="text-info-600 dark:text-info-400 text-sm">💡</span>
              <p className="text-xs md:text-sm text-info-700 dark:text-info-300">
                Após configurar, os usuários poderão escolher receber notificações via WhatsApp em
                suas preferências de perfil.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
