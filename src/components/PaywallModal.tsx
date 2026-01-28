import { IonButton, IonIcon, IonModal } from '@ionic/react'
import { closeOutline } from 'ionicons/icons'

export function PaywallModal({
  isOpen,
  showAnual,
  onClose,
  onAssinarMensal,
  onAssinarAnual,
}: {
  isOpen: boolean
  showAnual: boolean
  onClose: () => void
  onAssinarMensal: () => void
  onAssinarAnual: () => void
}) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div className="min-h-full bg-slate-950 text-slate-100 px-6 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">LouvorApp Pro</p>
            <h2 className="mt-2 text-2xl font-semibold">Assine para liberar</h2>
            <p className="mt-2 text-sm text-slate-300">
              Libere mais músicos, mais músicas e exportação de PDF.
            </p>
          </div>
          <IonButton fill="clear" size="small" onClick={onClose} aria-label="Fechar">
            <IonIcon icon={closeOutline} />
          </IonButton>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="font-semibold text-slate-100">Benefícios</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>+ Músicos ativos</li>
              <li>+ Músicas cadastradas</li>
              <li>Exportação de escala em PDF</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <IonButton expand="block" onClick={onAssinarMensal}>
            Assinar mensal
          </IonButton>
          {showAnual && (
            <IonButton expand="block" color="secondary" onClick={onAssinarAnual}>
              Assinar anual
            </IonButton>
          )}
          <IonButton expand="block" fill="clear" onClick={onClose}>
            Fechar
          </IonButton>
        </div>
      </div>
    </IonModal>
  )
}
