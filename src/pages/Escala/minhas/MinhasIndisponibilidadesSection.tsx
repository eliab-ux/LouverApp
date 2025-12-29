import {
  IonButton,
  IonCard,
  IonIcon,
  IonInput,
  IonTextarea,
  IonToggle,
} from '@ionic/react'
import { trashOutline } from 'ionicons/icons'
import type { CSSProperties } from 'react'
import type { FormEvent } from 'react'
import type { Indisponibilidade } from '../../../types'

export default function MinhasIndisponibilidadesSection(props: {
  marcarPeriodo: boolean
  setMarcarPeriodo: (v: boolean) => void

  novaIndispData: string
  setNovaIndispData: (v: string) => void

  novaIndispDataFim: string
  setNovaIndispDataFim: (v: string) => void

  novaIndispMotivo: string
  setNovaIndispMotivo: (v: string) => void

  savingIndisponibilidade: boolean
  indisponibilidadeError: string | null

  criarIndisponibilidade: (event: FormEvent) => void
  excluirIndisponibilidade: (id: string) => void

  indisponibilidades: Indisponibilidade[]
}) {
  const {
    marcarPeriodo,
    setMarcarPeriodo,
    novaIndispData,
    setNovaIndispData,
    novaIndispDataFim,
    setNovaIndispDataFim,
    novaIndispMotivo,
    setNovaIndispMotivo,
    savingIndisponibilidade,
    indisponibilidadeError,
    criarIndisponibilidade,
    excluirIndisponibilidade,
    indisponibilidades,
  } = props

  const buttonPaddingStyle: CSSProperties & Record<string, string> = {
    ['--padding-start']: '14px',
    ['--padding-end']: '14px',
  }

  return (
    <IonCard className="p-3 shadow-sm">
      <p className="text-xs text-slate-400 mb-3">Marque as datas em que você não poderá participar.</p>

      <form
        onSubmit={criarIndisponibilidade}
        className="mb-4 rounded-2xl bg-slate-900/60 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <IonToggle
            checked={marcarPeriodo}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onIonChange={(e) => {
              const next = Boolean(e.detail.checked)
              setMarcarPeriodo(next)
              if (!next) {
                setNovaIndispDataFim('')
              }
            }}
            style={{ transform: 'scale(0.72)', transformOrigin: 'left center' }}
          />
          <span className="text-[11px] font-medium text-slate-200">Marcar período de indisponibilidade</span>
        </div>

        <div className="space-y-3">
          <div className={marcarPeriodo ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="data">
                {marcarPeriodo ? 'Data Inicial *' : 'Data *'}
              </label>
              <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  📅
                </span>
                <IonInput
                  id="data"
                  type="date"
                  value={novaIndispData}
                  min={new Date().toISOString().split('T')[0]}
                  onIonChange={(e) => setNovaIndispData(String(e.detail.value ?? ''))}
                  style={{ paddingLeft: '28px', fontSize: '11px' }}
                />
              </div>
            </div>

            {marcarPeriodo && (
              <div>
                <label className="block text-[10px] text-slate-400 mb-1" htmlFor="dataFim">
                  Data Final *
                </label>
                <div
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    📅
                  </span>
                  <IonInput
                    id="dataFim"
                    type="date"
                    value={novaIndispDataFim}
                    min={novaIndispData || new Date().toISOString().split('T')[0]}
                    onIonChange={(e) => setNovaIndispDataFim(String(e.detail.value ?? ''))}
                    style={{ paddingLeft: '28px', fontSize: '11px' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1" htmlFor="motivo">
              Motivo (opcional)
            </label>
            <IonTextarea
              id="motivo"
              value={novaIndispMotivo}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onIonInput={(e) => setNovaIndispMotivo(String(e.detail.value ?? ''))}
              placeholder="Ex: Viagem, trabalho, compromisso familiar..."
              rows={2}
              style={{ fontSize: '11px' }}
            />
          </div>
        </div>
        <IonButton
          type="submit"
          expand="block"
          size="small"
          disabled={savingIndisponibilidade}
          style={buttonPaddingStyle}
        >
          {savingIndisponibilidade ? 'Salvando...' : 'Marcar Indisponibilidade'}
        </IonButton>
      </form>

      {indisponibilidadeError && (
        <p className="mb-3 text-[11px] text-red-300 bg-red-950/40 rounded-xl px-3 py-2">
          {indisponibilidadeError}
        </p>
      )}

      {indisponibilidades.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl p-5 text-center text-sm text-slate-400">
          Você ainda não marcou nenhuma indisponibilidade.
        </div>
      ) : (
        <div className="space-y-2">
          {indisponibilidades.map((indisponibilidade) => {
            const dataInicio = new Date(indisponibilidade.data + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            const dataFim = indisponibilidade.data_fim
              ? new Date(indisponibilidade.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : null
            const ehPeriodo = !!dataFim && indisponibilidade.data !== indisponibilidade.data_fim

            return (
              <IonCard
                key={indisponibilidade.id}
                className="p-3 shadow-sm flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-300">
                      🗓️{' '}
                      {ehPeriodo ? (
                        <>
                          {dataInicio} <span className="text-emerald-400">até</span> {dataFim}
                        </>
                      ) : (
                        dataInicio
                      )}
                    </span>
                    {indisponibilidade.motivo && (
                      <span className="text-[11px] text-slate-400">- {indisponibilidade.motivo}</span>
                    )}
                  </div>
                </div>
                <IonButton
                  type="button"
                  size="small"
                  color="danger"
                  fill="clear"
                  onClick={() => excluirIndisponibilidade(indisponibilidade.id)}
                  disabled={savingIndisponibilidade}
                  aria-label="Remover indisponibilidade"
                  className="m-0 h-7"
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonCard>
            )
          })}
        </div>
      )}
    </IonCard>
  )
}
