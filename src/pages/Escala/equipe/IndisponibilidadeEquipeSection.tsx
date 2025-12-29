import { IonButton, IonCard, IonIcon, IonInput, IonSelect, IonSelectOption } from '@ionic/react'
import { downloadOutline } from 'ionicons/icons'
import type { CSSProperties } from 'react'
import type { Indisponibilidade, Usuario } from '../../../types'

export default function IndisponibilidadeEquipeSection(props: {
  igrejaNome: string | null | undefined

  membros: Usuario[]
  todasIndisponibilidades: Indisponibilidade[]

  filtroEquipeMembroId: string
  setFiltroEquipeMembroId: (v: string) => void

  filtroEquipeDataInicio: string
  setFiltroEquipeDataInicio: (v: string) => void

  filtroEquipeDataFim: string
  setFiltroEquipeDataFim: (v: string) => void
}) {
  const {
    igrejaNome,
    membros,
    todasIndisponibilidades,
    filtroEquipeMembroId,
    setFiltroEquipeMembroId,
    filtroEquipeDataInicio,
    setFiltroEquipeDataInicio,
    filtroEquipeDataFim,
    setFiltroEquipeDataFim,
  } = props

  const selectStyleSmall: CSSProperties & Record<string, string> = {
    width: '100%',
    fontSize: '11px',
    ['--placeholder-color']: '#94a3b8',
    ['--color']: '#e2e8f0',
  }

  const indisponibilidadesFiltradas = todasIndisponibilidades
    .filter((ind) => {
      if (filtroEquipeMembroId !== 'todos' && ind.usuario_id !== filtroEquipeMembroId) {
        return false
      }

      if (filtroEquipeDataInicio && ind.data < filtroEquipeDataInicio) {
        return false
      }

      if (filtroEquipeDataFim && ind.data > filtroEquipeDataFim) {
        return false
      }

      return true
    })
    .sort((a, b) => a.data.localeCompare(b.data))

  const handleImprimirIndisponibilidades = () => {
    if (indisponibilidadesFiltradas.length === 0) return

    const titulo = `Indisponibilidades da Equipe - ${igrejaNome ?? ''}`
    const geradoEm = new Date().toLocaleString('pt-BR')

    const linhasLista = indisponibilidadesFiltradas
      .map((ind) => {
        const membro = membros.find((m) => m.id === ind.usuario_id)
        const dataInicio = new Date(ind.data + 'T00:00:00').toLocaleDateString('pt-BR')
        const dataFim = ind.data_fim
          ? new Date(ind.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')
          : null
        const ehPeriodo = !!dataFim && ind.data !== ind.data_fim
        const periodoTexto = ehPeriodo ? `${dataInicio} até ${dataFim}` : dataInicio
        const motivo = ind.motivo ?? ''

        return `
                      <div class="row">
                        <div class="cell">${
                          (membro?.nome ?? 'Membro desconhecido').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                        }</div>
                        <div class="cell">${periodoTexto}</div>
                        <div class="cell">${motivo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                      </div>`
      })
      .join('')

    const html = `<!DOCTYPE html>
                  <html>
                    <head>
                      <meta charSet="utf-8" />
                      <title>${titulo}</title>
                      <style>
                        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111827; }
                        h1 { font-size: 18px; margin-bottom: 4px; }
                        p { margin: 2px 0; }
                        .grid { width: 100%; margin-top: 12px; border-radius: 12px; overflow: hidden; }
                        .header { display: grid; grid-template-columns: 1.5fr 1fr 1fr; background: #f3f4f6; font-weight: 600; font-size: 11px; }
                        .row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; font-size: 11px; }
                        .cell { padding: 8px 10px; }
                      </style>
                    </head>
                    <body>
                      <h1>${titulo}</h1>
                      <p>Gerado em: ${geradoEm}</p>
                      <div class="grid">
                        <div class="header">
                          <div class="cell">Nome</div>
                          <div class="cell">Data/Período</div>
                          <div class="cell">Motivo</div>
                        </div>
                        ${linhasLista}
                      </div>
                    </body>
                  </html>`

    const janela = window.open('', '_blank')
    if (!janela) return

    janela.document.write(html)
    janela.document.close()
    janela.print()
  }

  return (
    <IonCard className="p-3 shadow-sm">
      <div>
        <div className="flex items-center justify-end gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 text-[11px]">
            <IonButton
              type="button"
              fill="clear"
              size="small"
              onClick={handleImprimirIndisponibilidades}
              disabled={indisponibilidadesFiltradas.length === 0}
              aria-label="Baixar PDF das indisponibilidades"
              className="m-0 h-7"
            >
              <IonIcon icon={downloadOutline} />
            </IonButton>
          </div>
        </div>

        <div className="mb-3 space-y-2 text-[11px]">
          <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <label className="block text-[10px] text-slate-400 mb-1">Membro</label>
            <IonSelect
              value={filtroEquipeMembroId}
              interface="popover"
              placeholder="Todos"
              onIonChange={(e) => setFiltroEquipeMembroId(String(e.detail.value ?? 'todos'))}
              style={selectStyleSmall}
            >
              <IonSelectOption value="todos">Todos</IonSelectOption>
              {membros
                .slice()
                .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
                .map((m) => (
                  <IonSelectOption key={m.id} value={m.id}>
                    {m.nome ?? 'Sem nome'}
                  </IonSelectOption>
                ))}
            </IonSelect>
          </div>

          <div className="flex gap-2">
            <div
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <label className="block text-[10px] text-slate-400 mb-1">Data inicial</label>
              <IonInput
                type="date"
                value={filtroEquipeDataInicio}
                onIonChange={(e) => setFiltroEquipeDataInicio(String(e.detail.value ?? ''))}
                style={{ fontSize: '11px' }}
              />
            </div>

            <div
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <label className="block text-[10px] text-slate-400 mb-1">Data final</label>
              <IonInput
                type="date"
                value={filtroEquipeDataFim}
                onIonChange={(e) => setFiltroEquipeDataFim(String(e.detail.value ?? ''))}
                style={{ fontSize: '11px' }}
              />
            </div>
          </div>
        </div>

        {todasIndisponibilidades.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-5 text-center text-sm text-slate-400">
            Nenhum membro marcou indisponibilidade.
          </div>
        ) : indisponibilidadesFiltradas.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-5 text-center text-xs text-slate-400">
            Nenhum registro encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {indisponibilidadesFiltradas.map((ind) => {
              const membro = membros.find((m) => m.id === ind.usuario_id)
              const dataInicio = new Date(ind.data + 'T00:00:00').toLocaleDateString('pt-BR')
              const dataFim = ind.data_fim
                ? new Date(ind.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')
                : null
              const ehPeriodo = !!dataFim && ind.data !== ind.data_fim

              return (
                <IonCard key={ind.id} className="p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold text-slate-200">
                        {membro?.nome ?? 'Membro desconhecido'}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs text-red-400">
                          {ehPeriodo ? (
                            <>
                              {dataInicio} <span className="text-slate-500">até</span> {dataFim}
                            </>
                          ) : (
                            dataInicio
                          )}
                        </span>
                        {ind.motivo && <span className="text-xs text-slate-500">• {ind.motivo}</span>}
                      </div>
                    </div>
                  </div>
                </IonCard>
              )
            })}
          </div>
        )}
      </div>
    </IonCard>
  )
}
