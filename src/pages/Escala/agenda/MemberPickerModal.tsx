import { useState, useMemo } from 'react'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFooter,
} from '@ionic/react'
import { closeOutline, checkmarkOutline } from 'ionicons/icons'
import type { Usuario } from '../../../types'
import { LABEL_CLASSES, INPUT_STYLES } from '../../../styles/form-styles'

interface MemberPickerModalProps {
  isOpen: boolean
  onClose: () => void
  membros: Usuario[]
  value: string // usuarioId selecionado
  onChange: (id: string) => void
}

export function MemberPickerModal({ isOpen, onClose, membros, value, onChange }: MemberPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const membrosFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return membros
    return membros.filter((m) => m.nome?.toLowerCase().includes(q) ?? false)
  }, [searchQuery, membros])

  const handleSelect = (id: string) => {
    onChange(id)
    setSearchQuery('')
    onClose()
  }

  const membroSelecionado = membros.find((m) => m.id === value)

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle className={LABEL_CLASSES.section}>Selecionar membro</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon slot="icon-only" icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(String(e.detail.value ?? ''))}
          placeholder="Buscar membro"
          style={INPUT_STYLES.default}
        />

        {membroSelecionado && (
          <>
            <div className={`${LABEL_CLASSES.field} text-slate-400 mt-4 mb-2`}>
              Selecionado
            </div>
            <IonList lines="none" className="p-0 rounded-xl bg-slate-900/60 mb-4">
              <IonItem className="rounded-xl">
                <IonLabel className={LABEL_CLASSES.field}>
                  <div>{membroSelecionado.nome}</div>
                  {membroSelecionado.funcoes && membroSelecionado.funcoes.length > 0 && (
                    <div className={`${LABEL_CLASSES.small} text-slate-500`}>
                      {membroSelecionado.funcoes.join(', ')}
                    </div>
                  )}
                </IonLabel>
                <IonIcon slot="end" icon={checkmarkOutline} className="text-primary" />
              </IonItem>
            </IonList>
          </>
        )}

        <div className={`${LABEL_CLASSES.field} text-slate-400 mt-4 mb-2`}>
          Todos os membros ({membrosFiltrados.length})
        </div>

        <IonList className="rounded-xl">
          {membrosFiltrados.map((membro) => {
            const isSelected = value === membro.id
            return (
              <IonItem
                key={membro.id}
                button
                onClick={() => handleSelect(membro.id)}
                className={isSelected ? 'bg-slate-900/40' : ''}
              >
                <IonLabel>
                  <div className={LABEL_CLASSES.field}>{membro.nome}</div>
                  {membro.funcoes && membro.funcoes.length > 0 && (
                    <div className={`${LABEL_CLASSES.small} text-slate-500`}>
                      {membro.funcoes.join(', ')}
                    </div>
                  )}
                </IonLabel>
                {isSelected && (
                  <IonIcon slot="end" icon={checkmarkOutline} className="text-primary" />
                )}
              </IonItem>
            )
          })}

          {membrosFiltrados.length === 0 && (
            <div className={`${LABEL_CLASSES.field} text-slate-500 text-center py-8`}>
              Nenhum membro encontrado
            </div>
          )}
        </IonList>
      </IonContent>

      <IonFooter>
        <div className="p-3">
          <IonButton expand="block" onClick={onClose} disabled={!value}>
            <IonIcon slot="start" icon={checkmarkOutline} />
            Concluir
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>
  )
}
