type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string }

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

export interface PwaState {
  canInstall: boolean
  installed: boolean
  online: boolean
  updateAvailable: boolean
  supported: boolean
}

const listeners = new Set<() => void>()
let installPrompt: BeforeInstallPromptEvent | null = null
let registration: ServiceWorkerRegistration | null = null
let initialized = false

const isStandalone = () => (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

let state: PwaState = {
  canInstall: false,
  installed: typeof window !== 'undefined' && isStandalone(),
  online: typeof navigator === 'undefined' || navigator.onLine,
  updateAvailable: false,
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
}

function updateState(next: Partial<PwaState>) {
  state = { ...state, ...next }
  listeners.forEach(listener => listener())
}

export const getPwaState = () => state
export const subscribePwaState = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall() {
  if (!installPrompt) return false
  await installPrompt.prompt()
  const choice = await installPrompt.userChoice
  installPrompt = null
  updateState({ canInstall: false })
  return choice.outcome === 'accepted'
}

export function applyPwaUpdate() {
  if (!registration?.waiting) return
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

export function registerPwa() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('online', () => updateState({ online: true }))
  window.addEventListener('offline', () => updateState({ online: false }))
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    updateState({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    installPrompt = null
    updateState({ canInstall: false, installed: true })
  })

  if (!import.meta.env.PROD || !state.supported) return

  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      if (registration.waiting) updateState({ updateAvailable: true })
      registration.addEventListener('updatefound', () => {
        const worker = registration?.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            updateState({ updateAvailable: true })
          }
        })
      })
    } catch (error) {
      console.warn('No se pudo activar el modo instalable.', error)
    }
  })
}
