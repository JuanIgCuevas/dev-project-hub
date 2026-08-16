import { Download, Laptop, MonitorDown, RefreshCw, Share2, Smartphone, WifiOff } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { usePreferences } from '../preferences/preferencesContext'
import { detectInstallPlatform, type InstallPlatform } from './installPlatform'
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
  const [detectedPlatform] = useState<InstallPlatform>(detectInstallPlatform)
  const [platform, setPlatform] = useState<InstallPlatform>(detectedPlatform)

  const title = pwa.installed
    ? (english ? 'DevHub is installed' : 'DevHub está instalada')
    : (english ? 'Install DevHub' : 'Instalar DevHub')
  const description = pwa.installed
    ? (english ? 'Open it from your device like any other application.' : 'Podés abrirla desde tu dispositivo como cualquier otra aplicación.')
    : pwa.canInstall
      ? (english ? 'Add it to your device for faster access and an app-like experience.' : 'Agregala a tu dispositivo para acceder más rápido y usarla como una aplicación.')
      : (english ? 'Use the “Install app” option in your browser menu when it becomes available.' : 'Usá la opción “Instalar aplicación” del menú del navegador cuando esté disponible.')

  const platformContent = {
    android: {
      label: 'Android',
      Icon: Smartphone,
      intro: english ? 'Recommended browser: Google Chrome.' : 'Navegador recomendado: Google Chrome.',
      steps: english
        ? ['Open DevHub from its published link.', 'Tap the three-dot browser menu.', 'Choose “Install app” or “Add to Home screen” and confirm.']
        : ['Abrí DevHub desde su enlace publicado.', 'Tocá el menú de tres puntos del navegador.', 'Elegí “Instalar aplicación” o “Agregar a pantalla principal” y confirmá.'],
    },
    ios: {
      label: 'iPhone / iPad',
      Icon: Share2,
      intro: english ? 'On Apple devices, installation is done from Safari.' : 'En dispositivos Apple, la instalación se realiza desde Safari.',
      steps: english
        ? ['Open DevHub in Safari.', 'Tap the Share button.', 'Choose “Add to Home Screen”, enable “Open as Web App” and tap “Add”.']
        : ['Abrí DevHub utilizando Safari.', 'Tocá el botón Compartir.', 'Elegí “Añadir a pantalla de inicio”, activá “Abrir como app web” y tocá “Añadir”.'],
    },
    desktop: {
      label: english ? 'Computer' : 'Computadora',
      Icon: Laptop,
      intro: english ? 'Available in compatible browsers such as Chrome or Edge.' : 'Disponible en navegadores compatibles como Chrome o Edge.',
      steps: english
        ? ['Open DevHub from its published link.', 'Click the install icon in the address bar or open the browser menu.', 'Choose “Install DevHub” and confirm.']
        : ['Abrí DevHub desde su enlace publicado.', 'Tocá el ícono de instalación de la barra de direcciones o abrí el menú del navegador.', 'Elegí “Instalar DevHub” y confirmá.'],
    },
  } satisfies Record<InstallPlatform, { label: string; Icon: typeof Smartphone; intro: string; steps: string[] }>
  const guide = platformContent[platform]

  return <section className="settings-card settings-wide pwa-install-card">
    <div className="settings-card-title"><span><Download /></span><div><h2>{title}</h2><p>{description}</p></div></div>
    <div className="pwa-install-state">
      <span className={pwa.installed ? 'installed' : ''}><i />{pwa.installed ? (english ? 'Installed' : 'Instalada') : pwa.supported ? (english ? 'Available on compatible browsers' : 'Disponible en navegadores compatibles') : (english ? 'Browser not compatible' : 'Navegador no compatible')}</span>
      {pwa.canInstall && !pwa.installed && <button className="button primary" type="button" onClick={() => void promptInstall()}><Download /> {english ? 'Install now' : 'Instalar ahora'}</button>}
    </div>
    <div className="pwa-install-guide">
      <div className="pwa-platform-heading">
        <div><p className="eyebrow">{english ? 'INSTALLATION GUIDE' : 'GUÍA DE INSTALACIÓN'}</p><h3>{english ? 'How do you want to install it?' : '¿Dónde querés instalarla?'}</h3></div>
        <span><MonitorDown /> {english ? 'No app store required' : 'No requiere una tienda'}</span>
      </div>
      <div className="pwa-platform-tabs" role="group" aria-label={english ? 'Choose installation platform' : 'Elegir plataforma de instalación'}>
        {(Object.keys(platformContent) as InstallPlatform[]).map(key => {
          const item = platformContent[key]
          return <button key={key} type="button" className={platform === key ? 'active' : ''} aria-pressed={platform === key} onClick={() => setPlatform(key)}>
            <item.Icon />
            <span>{item.label}{detectedPlatform === key && <small>{english ? 'This device' : 'Este dispositivo'}</small>}</span>
          </button>
        })}
      </div>
      <div className="pwa-platform-steps" aria-live="polite">
        <div className="pwa-platform-intro"><guide.Icon /><strong>{guide.label}</strong><span>{guide.intro}</span></div>
        <ol>{guide.steps.map(step => <li key={step}><span>{step}</span></li>)}</ol>
        <p><WifiOff /> {english ? 'Some content can open offline. Signing in and saving changes require an internet connection.' : 'Parte del contenido puede abrir sin conexión. Para iniciar sesión y guardar cambios necesitás internet.'}</p>
      </div>
    </div>
  </section>
}
