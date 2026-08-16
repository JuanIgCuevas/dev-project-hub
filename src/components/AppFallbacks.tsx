import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { ArrowRight, Home, RefreshCw, SearchX, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { usePreferences } from '../features/preferences/preferencesContext'

interface BoundaryProps {
  children: ReactNode
  english: boolean
}

class ErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error('DevHub could not render the current view.', error, details)
  }

  render() {
    if (!this.state.failed) return this.props.children
    const { english } = this.props
    return <main className="app-fallback-page" role="alert">
      <section className="app-fallback-card">
        <span className="app-fallback-code">DEVHUB · RECOVERY</span>
        <div className="app-fallback-icon"><ShieldAlert /></div>
        <p className="eyebrow">{english ? 'SOMETHING WENT WRONG' : 'ALGO NO SALIÓ BIEN'}</p>
        <h1>{english ? 'We could not open this view.' : 'No pudimos abrir esta vista.'}</h1>
        <p>{english ? 'Your information is still safe. Reload the page to try again.' : 'Tu información sigue segura. Recargá la página para intentarlo nuevamente.'}</p>
        <div className="app-fallback-actions">
          <button className="button primary" type="button" onClick={() => window.location.reload()}><RefreshCw /> {english ? 'Try again' : 'Intentar de nuevo'}</button>
          <a className="button" href="/"><Home /> {english ? 'Go to start' : 'Ir al inicio'}</a>
        </div>
      </section>
    </main>
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences()
  return <ErrorBoundary english={preferences.language === 'en'}>{children}</ErrorBoundary>
}

export function NotFoundPage() {
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const english = preferences.language === 'en'
  const home = user ? preferences.defaultPage : '/demo'

  useEffect(() => {
    const previousTitle = document.title
    document.title = english ? 'Page not found · DevHub' : 'Página no encontrada · DevHub'
    return () => { document.title = previousTitle }
  }, [english])

  return <main className="not-found-page">
    <nav className="not-found-nav">
      <Link className="brand" to={home}><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>BUILD SYSTEM · 2026</small></span></Link>
    </nav>
    <section className="not-found-content">
      <div className="not-found-visual" aria-hidden="true"><span>4</span><SearchX /><span>4</span></div>
      <p className="eyebrow">{english ? 'ROUTE NOT FOUND' : 'RUTA NO ENCONTRADA'}</p>
      <h1>{english ? 'This page is not part of the map.' : 'Esta página no está en el mapa.'}</h1>
      <p>{english ? 'The link may have changed or the address may be incorrect. You can return to a safe place and continue building.' : 'Es posible que el enlace haya cambiado o que la dirección sea incorrecta. Podés volver a un lugar seguro y continuar construyendo.'}</p>
      <div className="not-found-actions">
        <Link className="button primary" to={home}><Home /> {user ? (english ? 'Go to my space' : 'Ir a mi espacio') : (english ? 'View interactive demo' : 'Ver demo interactiva')} <ArrowRight /></Link>
        {!user && <Link className="button" to="/login">{english ? 'Sign in' : 'Iniciar sesión'}</Link>}
      </div>
    </section>
  </main>
}
