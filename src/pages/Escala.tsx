import { useEffect, useState } from 'react'
import {
  IonAccordion,
  IonAccordionGroup,
  IonIcon,
  IonItem,
  IonLabel,
} from '@ionic/react'
import {
  calendarOutline,
  peopleOutline,
  closeCircleOutline,
} from 'ionicons/icons'
import AgendaSection from './Escala/agenda/AgendaSection'
import MinhasIndisponibilidadesSection from './Escala/minhas/MinhasIndisponibilidadesSection'
import IndisponibilidadeEquipeSection from './Escala/equipe/IndisponibilidadeEquipeSection'
import useAgenda from './Escala/hooks/useAgenda'
import useMinhasIndisponibilidades from './Escala/hooks/useMinhasIndisponibilidades'
import useIndisponibilidadeEquipe from './Escala/hooks/useIndisponibilidadeEquipe'
import useEscalaSharedData from './Escala/hooks/useEscalaSharedData'
import useConfirmDialog from './Escala/hooks/useConfirmDialog'
import { supabase } from '../lib/supabase'
import { useInlineToast } from '../lib/inlineToastContext'
import { useEntitlement } from '../lib/useEntitlement'
import type { AppUser } from '../types'
import { PaywallModal } from '../components/PaywallModal'

interface EscalaProps {
  user: AppUser
}

export function Escala({ user }: EscalaProps) {
  const { showToast } = useInlineToast()

  const [accordionValue, setAccordionValue] = useState<string>('agenda')

  // Mensagem de sucesso
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const { abrirConfirmacao, portal: confirmDialogPortal } = useConfirmDialog()

  const agenda = useAgenda({ user, supabase, showToast, setMensagemSucesso, abrirConfirmacao })
  const { entitlement } = useEntitlement(user.igrejaId)

  const equipe = useIndisponibilidadeEquipe({
    supabase,
    igrejaId: user.igrejaId,
    canViewEquipe: user.papel === 'admin' || user.papel === 'lider',
    showToast,
  })

  const shared = useEscalaSharedData({ supabase, igrejaId: user.igrejaId, showToast })

  const minhas = useMinhasIndisponibilidades({
    user,
    supabase,
    showToast,
    abrirConfirmacao,
    validationCtx: {
      eventos: agenda.eventos ?? [],
      escalas: agenda.escalas ?? [],
      escalados: agenda.escalados ?? [],
      nomeTipoEvento: agenda.nomeTipoEvento,
    },
  })

  useEffect(() => {
    console.log('[Escala] mount', {
      userId: user.id,
      igrejaId: user.igrejaId,
      papel: user.papel,
      path: window.location?.pathname,
    })

    return () => {
      console.log('[Escala] unmount', {
        userId: user.id,
        igrejaId: user.igrejaId,
        path: window.location?.pathname,
      })
    }
  }, [user.id, user.igrejaId, user.papel])

  const handleImprimirEscalaMensal = () => {
    if (!entitlement || entitlement.plano !== 'pro') {
      showToast({ message: 'Funcionalidade disponivel apenas no plano Pro.', color: 'warning' })
      setPaywallOpen(true)
      return
    }
    agenda.handleImprimirEscalaMensal()
  }

  return (
    <main className="space-y-4">
      <section className="w-full rounded-2xl bg-slate-900/50 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-xs">📅</div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Escala</h2>
            </div>
          </div>
        </div>

        <IonAccordionGroup
          className="rounded-2xl bg-slate-900/80 p-2 text-sm shadow-sm"
          value={accordionValue}
          onIonChange={(e) => {
            const next = String(e.detail.value ?? '')
            if (next === 'agenda' || next === 'minhas' || next === 'equipe') {
              setAccordionValue(next)
            }
          }}
        >
        <IonAccordion value="agenda">
          <IonItem slot="header" className="ion-no-padding" lines="none">
            <IonIcon slot="start" icon={calendarOutline} className="text-slate-400" />
            <IonLabel>
              <h2 className="text-sm font-semibold text-gray-800">Agenda de Eventos</h2>
              <p className="text-xs text-gray-500 leading-tight">Cultos, ensaios e montagem de escala</p>
            </IonLabel>
          </IonItem>
          <div slot="content" className="p-3">
            <AgendaSection
              user={user}
              mesExportacao={agenda.mesExportacao}
              setMesExportacao={agenda.setMesExportacao}
              handleImprimirEscalaMensal={handleImprimirEscalaMensal}
              filtroStatusEvento={agenda.filtroStatusEvento}
              setFiltroStatusEvento={agenda.setFiltroStatusEvento}
              setPaginaEventos={agenda.setPaginaEventos}
              eventosFiltradosPorStatus={agenda.eventosFiltradosPorStatus}
              eventoError={agenda.eventoError}
              escalaError={agenda.escalaError}
              tiposEvento={agenda.tiposEvento}
              novoEventoTipoEventoId={agenda.novoEventoTipoEventoId}
              setNovoEventoTipoEventoId={agenda.setNovoEventoTipoEventoId}
              novoEventoData={agenda.novoEventoData}
              setNovoEventoData={agenda.setNovoEventoData}
              novoEventoHora={agenda.novoEventoHora}
              setNovoEventoHora={agenda.setNovoEventoHora}
              criarEvento={agenda.criarEvento}
              EVENTOS_POR_PAGINA={agenda.EVENTOS_POR_PAGINA}
              eventos={agenda.eventos}
              eventosPaginaAtual={agenda.eventosPaginaAtual}
              paginaEventos={agenda.paginaEventos}
              totalPaginasEventos={agenda.totalPaginasEventos}
              escalas={agenda.escalas}
              escalados={agenda.escalados}
              escalaMusicas={agenda.escalaMusicas}
              eventosPublicadosEmEdicao={agenda.eventosPublicadosEmEdicao}
              eventoSelecionadoId={agenda.eventoSelecionadoId}
              setEventoSelecionadoId={agenda.setEventoSelecionadoId}
              membros={shared.membros}
              todasIndisponibilidades={equipe.todasIndisponibilidades}
              novoEscaladoUsuarioId={agenda.novoEscaladoUsuarioId}
              setNovoEscaladoUsuarioId={agenda.setNovoEscaladoUsuarioId}
              novoEscaladoFuncao={agenda.novoEscaladoFuncao}
              setNovoEscaladoFuncao={agenda.setNovoEscaladoFuncao}
              adicionarEscalado={agenda.adicionarEscalado}
              musicas={agenda.musicas}
              novaMusicaId={agenda.novaMusicaId}
              setNovaMusicaId={agenda.setNovaMusicaId}
              novaMusicaTom={agenda.novaMusicaTom}
              setNovaMusicaTom={agenda.setNovaMusicaTom}
              tipoItemRepertorio={agenda.tipoItemRepertorio}
              setTipoItemRepertorio={agenda.setTipoItemRepertorio}
              medleySongIds={agenda.medleySongIds}
              setMedleySongIds={agenda.setMedleySongIds}
              medleyModalOpen={agenda.medleyModalOpen}
              setMedleyModalOpen={agenda.setMedleyModalOpen}
              adicionarMusicaEscala={agenda.adicionarMusicaEscala}
              reordenarMusicasEscala={agenda.reordenarMusicasEscala}
              removerMusicaEscala={agenda.removerMusicaEscala}
              alternarMinistrante={agenda.alternarMinistrante}
              removerEscalado={agenda.removerEscalado}
              publicarEscala={(eventoId) => void agenda.publicarEscala(eventoId)}
              excluirEvento={(eventoId) => void agenda.excluirEvento(eventoId)}
            />
          </div>
        </IonAccordion>

        <IonAccordion value="minhas">
          <IonItem slot="header" className="ion-no-padding" lines="none">
            <IonIcon slot="start" icon={closeCircleOutline} className="text-slate-400" />
            <IonLabel>
              <h2 className="text-sm font-semibold text-gray-800">Minhas Indisponibilidades</h2>
              <p className="text-xs text-gray-500 leading-tight">Marque datas em que você não poderá participar</p>
            </IonLabel>
          </IonItem>
          <div slot="content" className="p-3">
            <MinhasIndisponibilidadesSection
              marcarPeriodo={minhas.marcarPeriodo}
              setMarcarPeriodo={minhas.setMarcarPeriodo}
              novaIndispData={minhas.novaIndispData}
              setNovaIndispData={minhas.setNovaIndispData}
              novaIndispDataFim={minhas.novaIndispDataFim}
              setNovaIndispDataFim={minhas.setNovaIndispDataFim}
              novaIndispMotivo={minhas.novaIndispMotivo}
              setNovaIndispMotivo={minhas.setNovaIndispMotivo}
              savingIndisponibilidade={minhas.savingIndisponibilidade}
              indisponibilidadeError={minhas.indisponibilidadeError}
              criarIndisponibilidade={minhas.criarIndisponibilidade}
              excluirIndisponibilidade={(id) => void minhas.excluirIndisponibilidade(id)}
              indisponibilidades={minhas.indisponibilidades}
            />
          </div>
        </IonAccordion>

        {(user.papel === 'admin' || user.papel === 'lider') && (
          <IonAccordion value="equipe">
            <IonItem slot="header" className="ion-no-padding" lines="none">
              <IonIcon slot="start" icon={peopleOutline} className="text-slate-400" />
              <IonLabel>
                <h2 className="text-sm font-semibold text-gray-800">Indisponibilidade da Equipe</h2>
                <p className="text-xs text-gray-500 leading-tight">Visão geral e filtros (admin/líder)</p>
              </IonLabel>
            </IonItem>
            <div slot="content" className="p-3">
              <IndisponibilidadeEquipeSection
                igrejaNome={user.igrejaNome}
                membros={shared.membros}
                todasIndisponibilidades={equipe.todasIndisponibilidades}
                filtroEquipeMembroId={equipe.filtrosEquipe.membroId}
                setFiltroEquipeMembroId={(v) => equipe.setFiltrosEquipe((prev) => ({ ...prev, membroId: v }))}
                filtroEquipeDataInicio={equipe.filtrosEquipe.dataInicio}
                setFiltroEquipeDataInicio={(v) => equipe.setFiltrosEquipe((prev) => ({ ...prev, dataInicio: v }))}
                filtroEquipeDataFim={equipe.filtrosEquipe.dataFim}
                setFiltroEquipeDataFim={(v) => equipe.setFiltrosEquipe((prev) => ({ ...prev, dataFim: v }))}
              />
            </div>
          </IonAccordion>
        )}
        </IonAccordionGroup>
      </section>

      {/* Mensagem de Sucesso */}
      {mensagemSucesso && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-slate-900 px-4 py-3 rounded-2xl shadow-xl z-50 text-[11px] font-semibold">
          {mensagemSucesso}
        </div>
      )}

      {confirmDialogPortal}

      <PaywallModal
        isOpen={paywallOpen}
        showAnual={false}
        onClose={() => setPaywallOpen(false)}
        onAssinarMensal={() => {
          showToast({ message: 'Assinatura disponivel no app mobile.', color: 'medium' })
          setPaywallOpen(false)
        }}
        onAssinarAnual={() => {
          showToast({ message: 'Assinatura anual disponivel no app mobile.', color: 'medium' })
          setPaywallOpen(false)
        }}
      />
    </main>
  )
}
