import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from './AuthProvider'
import { usePreferences } from '../preferences/preferencesContext'
import { isSupabaseConfigured } from '../../lib/supabase'

const authSchema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(6, 'Ingresá al menos 6 caracteres.'),
  username: z.string().trim().max(40).optional(),
})
type AuthValues = z.infer<typeof authSchema>

function getAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('Invalid login credentials')) return 'El email o la contraseña no son correctos.'
  if (message.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
  if (message.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión.'
  if (message.includes('Failed to fetch') || message.includes('fetch failed')) return 'No pudimos conectarnos con Supabase. Revisá la configuración del despliegue.'
  return 'No pudimos completar la operación. Intentá nuevamente.'
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp, user } = useAuth()
  const { preferences } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const isLogin = mode === 'login'
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<AuthValues>({ resolver: zodResolver(authSchema) })
  if (user) return <Navigate to={preferences.defaultPage} replace />

  const onSubmit = async (values: AuthValues) => {
    setServerError(''); setNotice('')
    if (!isSupabaseConfigured) {
      setServerError('La conexión con Supabase no está configurada en este despliegue.')
      return
    }
    if (!isLogin && (!values.username || values.username.length < 2)) {
      setError('username', { message: 'Ingresá un nombre de al menos 2 caracteres.' })
      return
    }
    if (!isLogin && values.password.length < 8) {
      setError('password', { message: 'Usá al menos 8 caracteres.' })
      return
    }
    try {
      if (isLogin) {
        await signIn(values.email, values.password)
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
        navigate(from || preferences.defaultPage, { replace: true })
      } else {
        const hasSession = await signUp({ ...values, username: values.username! })
        if (hasSession) navigate(preferences.defaultPage, { replace: true })
        else setNotice('Cuenta creada. Revisá tu email para confirmar el acceso.')
      }
    } catch (error) { setServerError(getAuthError(error)) }
  }

  return <div className="auth-page"><div className="auth-copy"><Link className="brand" to="/"><span className="brand-mark">{'</>'}</span><span>Dev<span>Hub</span></span></Link><div><span className="auth-label"><Sparkles size={15} /> CONSTRUYE CON INTENCIÓN</span><h1>Tus ideas merecen<br /><em>llegar a producción.</em></h1><p>Organiza tus proyectos, mantén el foco y convierte tu próximo side project en algo real.</p></div><blockquote>“La herramienta que necesitaba para dejar de abandonar proyectos a mitad de camino.”<footer>— Un developer con demasiadas ideas</footer></blockquote></div>
    <div className="auth-panel"><form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate><h2>{isLogin ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}</h2><p>{isLogin ? 'Continúa construyendo donde lo dejaste.' : 'Tu próximo proyecto empieza acá.'}</p>
      {!isLogin && <label>Nombre<input autoComplete="name" {...register('username')} placeholder="¿Cómo te llamamos?" /><small>{errors.username?.message}</small></label>}
      <label>Email<input type="email" autoComplete="email" {...register('email')} placeholder="vos@email.com" /><small>{errors.email?.message}</small></label>
      <label>Contraseña<input type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} {...register('password')} placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 8 caracteres'} /><small>{errors.password?.message}</small>{isLogin && <Link className="forgot-link" to="/forgot-password">¿Olvidaste tu contraseña?</Link>}</label>
      {serverError && <div className="form-message error" role="alert">{serverError}</div>}{notice && <div className="form-message success" role="status">{notice}</div>}
      <button className="button primary wide" disabled={isSubmitting} type="submit">{isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'} {!isSubmitting && <ArrowRight size={18} />}</button>
      <p className="auth-switch">{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Crea una gratis' : 'Inicia sesión'}</Link></p>
    </form></div></div>
}
