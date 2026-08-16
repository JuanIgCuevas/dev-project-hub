import { Download, RefreshCw, WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { usePreferences } from '../preferences/preferencesContext'
import { applyPwaUpdate, getPwaState, promptInstall, subscribePwaState } from './pwaManager'

function usePwaState() {
  return useSyncExternalStore(subscribePwaState, getPwaState, getPwaState)
}

export function PwaStatusBanner() {
  const { preferences } = usePreferences()
  const pwa = usePwaState()
  const english = preferences.language === 'en'

  if (pwa.updateAvailable) return <aside className="pwa-status-banner update" role="status">
    <RefreshCw />
    <span>{english ? 'A new DevHub version is ready.' : 'Hay una nueva versión de DevHub lista.'}</span>
    <button type="button" onClick={applyPwaUpdate}>{english ? 'Update' : 'Actualizar'}</button>
  </aside>

  if (pwa.online) return null
  return <aside className="pwa-status-banner offline" role="status">
    <WifiOff />
    <span>{english ? 'You are offline. Some features may be unavailable.' : 'Estás sin conexión. Algunas funciones pueden no estar disponibles.'}</span>
  </aside>
}

export function PwaInstallCard() {
  const { preferences } = usePreferences()
  const pwa = usePwaState()
  const english = preferences.language === 'en'

  const title = pwa.installed
    ? (english ? 'DevHub is installed' : 'DevHub está instalada')
    : (english ? 'Install DevHub' : 'Instalar DevHub')
  const description = pwa.installed
    ? (english ? 'Open it from your device like any other application.' : 'Podés abrirla desde tu dispositivo como cualquier otra aplicación.')
    : pwa.canInstall
      ? (english ? 'Add it to your device for faster access and an app-like experience.' : 'Agregala a tu dispositivo para acceder más rápido y usarla como una aplicación.')
      : (english ? 'Use the “Install app” option in your browser menu when it becomes available.' : 'Usá la opción “Instalar aplicación” del menú del navegador cuando esté disponible.')

  return <section className="settings-card settings-wide pwa-install-card">
    <div className="settings-card-title"><span><Download /></span><div><h2>{title}</h2><p>{description}</p></div></div>
    <div className="pwa-install-state">
      <span className={pwa.installed ? 'installed' : ''}><i />{pwa.installed ? (english ? 'Installed' : 'Instalada') : pwa.supported ? (english ? 'Available on compatible browsers' : 'Disponible en navegadores compatibles') : (english ? 'Browser not compatible' : 'Navegador no compatible')}</span>
      {pwa.canInstall && !pwa.installed && <button className="button primary" type="button" onClick={() => void promptInstall()}><Download /> {english ? 'Install now' : 'Instalar ahora'}</button>}
    </div>
  </section>
}
