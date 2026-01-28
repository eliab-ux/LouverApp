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
  IonCheckbox,
  IonReorderGroup,
  IonReorder,
  IonButton,
  IonIcon,
  IonFooter,
} from '@ionic/react'
import { trashOutline, closeOutline, checkmarkOutline, reorderThreeOutline } from 'ionicons/icons'
import type { Musica } from '../../../types'
import { LABEL_CLASSES, INPUT_STYLES } from '../../../styles/form-styles'

interface MedleyPickerModalProps {
  isOpen: boolean
  onClose: () => void
  musicas: Musica[]
  value: string[] // songIds selecionados (ordenado)
  onChange: (ids: string[]) => void
}

export function MedleyPickerModal({ isOpen, onClose, musicas, value, onChange }: MedleyPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const musicasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return musicas
    return musicas.filter((m) => m.nome.toLowerCase().includes(q))
  }, [searchQuery, musicas])

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id]) // adiciona no final (sequência)
    }
  }

  const musicasSelecionadas = value.map((id) => musicas.find((m) => m.id === id)).filter(Boolean) as Musica[]

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle className={LABEL_CLASSES.section}>Montar medley</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon slot="icon-only" icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(String(e.detail.value ?? ''))}
          placeholder="Buscar música"
          style={INPUT_STYLES.default}
        />

        {/* Músicas selecionadas (reordenáveis) */}
        {musicasSelecionadas.length > 0 && (
          <>
            <div className={`${LABEL_CLASSES.field} text-slate-400 mt-4 mb-2`}>
              Selecionadas ({musicasSelecionadas.length}) - Arraste para ordenar
            </div>

            <IonReorderGroup
              disabled={false}
              onIonItemReorder={(ev) => {
                const from = ev.detail.from
                const to = ev.detail.to
                const next = [...value]
                const [moved] = next.splice(from, 1)
                next.splice(to, 0, moved)
                onChange(next)
                ev.detail.complete()
              }}
            >
              <IonList lines="none" className="p-0 rounded-xl bg-slate-900/60">
                {musicasSelecionadas.map((musica, idx) => (
                  <IonItem key={musica.id} className="rounded-xl">
                    <div slot="start" className={`${LABEL_CLASSES.small} text-slate-500 w-6 text-center`}>
                      {idx + 1}
                    </div>

                    <IonLabel className={LABEL_CLASSES.field}>
                      <div className="truncate">{musica.nome}</div>
                    </IonLabel>

                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={() => onChange(value.filter((x) => x !== musica.id))}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>

                    <IonReorder slot="end">
                      <IonIcon icon={reorderThreeOutline} />
                    </IonReorder>
                  </IonItem>
                ))}
              </IonList>
            </IonReorderGroup>
          </>
        )}

        {/* Todas as músicas */}
        <div className={`${LABEL_CLASSES.field} text-slate-400 mt-4 mb-2`}>
          Todas as músicas ({musicasFiltradas.length})
        </div>

        <IonList className="rounded-xl">
          {musicasFiltradas.map((musica) => {
            const isSelected = value.includes(musica.id)
            return (
              <IonItem key={musica.id} button onClick={() => toggle(musica.id)}>
                <IonCheckbox slot="start" checked={isSelected} />
                <IonLabel>
                  <div className={LABEL_CLASSES.field}>{musica.nome}</div>
                  {musica.categoria_principal && (
                    <div className={`${LABEL_CLASSES.small} text-slate-500`}>
                      {musica.categoria_principal.nome}
                      {musica.estilo && ` • ${musica.estilo.nome}`}
                    </div>
                  )}
                </IonLabel>
              </IonItem>
            )
          })}

          {musicasFiltradas.length === 0 && (
            <div className={`${LABEL_CLASSES.field} text-slate-500 text-center py-8`}>
              Nenhuma música encontrada
            </div>
          )}
        </IonList>
      </IonContent>

      <IonFooter>
        <div className="p-3">
          <IonButton expand="block" onClick={onClose} disabled={value.length === 0}>
            <IonIcon slot="start" icon={checkmarkOutline} />
            Concluir ({value.length} {value.length === 1 ? 'música' : 'músicas'})
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>
  )
}
