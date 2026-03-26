import { createRoot } from 'react-dom/client'
import { setupIonicReact } from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

import '@ionic/react/css/palettes/dark.class.css'
import './theme/variables.css'
import './styles/design-tokens.css'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

setupIonicReact()

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setStyle({ style: Style.Light })
}

createRoot(document.getElementById('root')!).render(
  <App />,
)

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
  })
}
