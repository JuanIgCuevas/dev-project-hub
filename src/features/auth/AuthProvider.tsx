import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface SignUpInput { email: string; password: string; username: string }
interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<boolean>
  signOut: () => Promise<void>
  signOutAll: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const finishLoading = () => {
      if (active) setLoading(false)
    }

    if (!isSupabaseConfigured) {
      finishLoading()
      return
    }

    // Never leave the app trapped behind the startup screen if storage, the
    // network or an expired refresh token makes Supabase take too long.
    const startupTimeout = window.setTimeout(finishLoading, 6_000)

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (!error) setSession(data.session)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(finishLoading)

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      finishLoading()
    })
    return () => {
      active = false
      window.clearTimeout(startupTimeout)
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password })
      if (error) throw error
    },
    async signUp({ email, password, username }) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      return Boolean(data.session)
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    async signOutAll() {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
    },
    async sendPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    async updateEmail(email) {
      const { error } = await supabase.auth.updateUser({ email: normalizeEmail(email) })
      if (error) throw error
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// El hook comparte el contexto definido en este archivo con el proveedor.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return context
}
