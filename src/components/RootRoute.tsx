import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { usePreferences } from '../features/preferences/preferencesContext'

export function RootRoute() {
  const { user, loading } = useAuth()
  const { preferences } = usePreferences()

  if (loading) return <div className="route-loader"><span /><p>Preparando tu espacio...</p></div>
  return <Navigate to={user ? preferences.defaultPage : '/login'} replace />
}
