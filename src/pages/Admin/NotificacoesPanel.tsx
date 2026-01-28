import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
} from '@ionic/react'
import { notificationsOutline, saveOutline } from 'ionicons/icons'
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
      <IonCard className="m-0">
        <IonCardHeader>
          <IonCardTitle className="flex items-center gap-2 text-base">
            <IonIcon icon={notificationsOutline} />
            Notificações
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p className="text-sm">Sem permissão.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    )
  }

  return (
    <IonCard className="m-0">
      <IonCardHeader>
        <IonCardTitle className="flex items-center gap-2 text-base">
          <IonIcon icon={notificationsOutline} />
          Notificações
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText color="medium">
          <p className="text-sm mb-4">Configure quando os lembretes começam e quantas vezes por dia.</p>
        </IonText>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-4">
            {/* Mensagens */}
            {error && (
              <IonText color="danger">
                <p className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              </IonText>
            )}

            {success && (
              <IonText color="success">
                <p className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                  {success}
                </p>
              </IonText>
            )}

            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IonItem lines="none">
                <IonLabel position="stacked">Dias antes do evento</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={diasAntes}
                  onIonInput={(e) => setDiasAntes(Number(e.detail.value))}
                  placeholder="Ex: 3"
                />
              </IonItem>

              <IonItem lines="none">
                <IonLabel position="stacked">Alertas por dia</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={alertasPorDia}
                  onIonInput={(e) => setAlertasPorDia(Number(e.detail.value))}
                  placeholder="Ex: 2"
                />
              </IonItem>
            </div>

            {/* Informação */}
            <IonNote className="block">
              <p className="text-xs">
                Lembretes automáticos são enviados, apenas para os ministrantes da escala, para as escalas publicadas e que estejam sem músicas
              </p>
            </IonNote>

            {/* Botão salvar */}
            <IonButton expand="block" type="submit" disabled={saving}>
              <IonIcon slot="start" icon={saveOutline} />
              {saving ? 'Salvando...' : 'Salvar configuração'}
            </IonButton>
          </form>
        )}
      </IonCardContent>
    </IonCard>
  )
}
