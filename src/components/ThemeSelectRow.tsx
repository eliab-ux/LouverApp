import { useState } from 'react'
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react'
import { applyTheme, getSavedTheme, saveTheme, type ThemeMode } from '../theme/theme'

export function ThemeSelectRow() {
  const [mode, setMode] = useState<ThemeMode>(() => getSavedTheme())

  const onChange = (value: ThemeMode) => {
    setMode(value)
    saveTheme(value)
    applyTheme(value)
  }

  return (
    <IonItem lines="full">
      <IonLabel>Tema</IonLabel>
      <IonSelect
        value={mode}
        interface="popover"
        onIonChange={(e) => onChange(e.detail.value as ThemeMode)}
      >
        <IonSelectOption value="system">Sistema</IonSelectOption>
        <IonSelectOption value="light">Claro</IonSelectOption>
        <IonSelectOption value="dark">Escuro</IonSelectOption>
      </IonSelect>
    </IonItem>
  )
}
