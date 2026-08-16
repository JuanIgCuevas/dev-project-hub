import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowRight, Check, Circle, Eye, EyeOff, Languages, Play, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from './AuthProvider'
import { usePreferences } from '../preferences/preferencesContext'
import { isSupabaseConfigured } from '../../lib/supabase'

const authSchema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(6, 'Ingresá al menos 6 caracteres.'),
  passwordConfirmation: z.string().optional(),
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
  const { signIn, signUp, signOut, user } = useAuth()
  const { preferences, updatePreference } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const isLogin = mode === 'login'
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<AuthValues>({ resolver: zodResolver(authSchema) })
  const password = watch('password', '')
  const passwordConfirmation = watch('passwordConfirmation', '')
  const passwordsMismatch = !isLogin && Boolean(passwordConfirmation) && password !== passwordConfirmation
  const passwordRegistration = register('password')
  const confirmationRegistration = register('passwordConfirmation')
  const passwordChecks = [
    { label: '8 caracteres', valid: password.length >= 8, required: true },
    { label: 'Una mayúscula', valid: /[A-Z]/.test(password), required: true },
    { label: 'Una minúscula', valid: /[a-z]/.test(password), required: true },
    { label: 'Un número', valid: /\d/.test(password), required: true },
    { label: 'Un símbolo', valid: /[^A-Za-z0-9]/.test(password), required: false },
  ]
  const passwordScore = passwordChecks.filter(check => check.valid).length
  const strength = passwordScore <= 1 ? 'Muy débil' : passwordScore === 2 ? 'Débil' : passwordScore === 3 ? 'Buena' : 'Fuerte'
  useEffect(() => {
    const state = location.state as { accountCreated?: boolean; accountDeleted?: boolean } | null
    if (isLogin && state?.accountCreated) setNotice('Revisá tu email para confirmar el acceso. Si ese correo ya tenía una cuenta, iniciá sesión o recuperá la contraseña.')
    if (isLogin && state?.accountDeleted) setNotice('Tu cuenta y todos sus datos fueron eliminados correctamente.')
  }, [isLogin, location.state])
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
    if (!isLogin && passwordChecks.some(check => check.required && !check.valid)) {
      setError('password', { message: 'La contraseña todavía no cumple todos los requisitos.' })
      return
    }
    if (!isLogin && !values.passwordConfirmation) {
      setError('passwordConfirmation', { message: 'Repetí la contraseña para confirmarla.' })
      return
    }
    if (!isLogin && values.password !== values.passwordConfirmation) {
      setError('passwordConfirmation', { message: 'Las contraseñas no coinciden.' })
      return
    }
    try {
      if (isLogin) {
        await signIn(values.email, values.password)
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
        navigate(from || preferences.defaultPage, { replace: true })
      } else {
        const hasSession = await signUp({ email: values.email, password: values.password, username: values.username! })
        if (hasSession) await signOut()
        navigate('/login', { replace: true, state: { accountCreated: true } })
      }
    } catch (error) { setServerError(getAuthError(error)) }
  }

  return <div className={`auth-page ${isLogin ? 'login-mode' : 'register-mode'}`}><div className="auth-copy"><Link className="brand" to="/"><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>BUILD SYSTEM · 2026</small></span></Link><div><span className="auth-label"><Sparkles size={15} /> CONSTRUYE CON INTENCIÓN</span><h1>Tus ideas merecen<br /><em>llegar a producción.</em></h1><p>Organiza tus proyectos, mantén el foco y convierte tu próximo side project en algo real.</p></div><blockquote>“La herramienta que necesitaba para dejar de abandonar proyectos a mitad de camino.”<footer>— Un developer con demasiadas ideas</footer></blockquote></div>
    <div className="auth-panel"><label className="auth-language-switch"><Languages /><span>Idioma</span><select aria-label="Idioma de la aplicación" value={preferences.language} onChange={event => updatePreference('language', event.target.value as typeof preferences.language)}><option value="es">ES</option><option value="en">EN</option></select></label><form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate><h2>{isLogin ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}</h2><p>{isLogin ? 'Continúa construyendo donde lo dejaste.' : 'Tu próximo proyecto empieza acá.'}</p>
      {!isLogin && <label>Nombre<input autoComplete="name" {...register('username')} placeholder="¿Cómo te llamamos?" /><small>{errors.username?.message}</small></label>}
      <label>Email<input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} {...register('email')} placeholder="vos@email.com" /><small>{errors.email?.message}</small></label>
      <label>Contraseña<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} {...passwordRegistration} onKeyUp={event => setCapsLock(event.getModifierState('CapsLock'))} onBlur={event => { passwordRegistration.onBlur(event); setCapsLock(false) }} placeholder={isLogin ? 'Tu contraseña' : 'Creá una contraseña segura'} /><button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}>{showPassword ? <EyeOff /> : <Eye />}</button></div><small>{errors.password?.message}</small>{capsLock && <span className="caps-lock-warning"><AlertTriangle /> Bloq Mayús está activado</span>}{isLogin && <Link className="forgot-link" to="/forgot-password">¿Olvidaste tu contraseña?</Link>}</label>
      {!isLogin && <><div className={`password-strength strength-${Math.min(passwordScore, 4)}`}><div><span>Seguridad</span><strong>{password ? strength : 'Sin contraseña'}</strong></div><div className="strength-bars" aria-hidden="true"><i /><i /><i /><i /></div><ul>{passwordChecks.map(check => <li className={check.valid ? 'valid' : ''} key={check.label}>{check.valid ? <Check /> : <Circle />}{check.label}{!check.required && <em>recomendado</em>}</li>)}</ul></div><label>Confirmar contraseña<div className={`password-field ${passwordsMismatch ? 'field-invalid' : ''}`}><input type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" aria-invalid={passwordsMismatch || Boolean(errors.passwordConfirmation)} {...confirmationRegistration} onKeyUp={event => setCapsLock(event.getModifierState('CapsLock'))} onBlur={event => { confirmationRegistration.onBlur(event); setCapsLock(false) }} placeholder="Volvé a escribirla" /><button type="button" onClick={() => setShowConfirmation(current => !current)} aria-label={showConfirmation ? 'Ocultar confirmación' : 'Mostrar confirmación'} aria-pressed={showConfirmation}>{showConfirmation ? <EyeOff /> : <Eye />}</button></div><small className={passwordConfirmation && !passwordsMismatch ? 'field-success' : ''} aria-live="polite">{errors.passwordConfirmation?.message || (passwordsMismatch ? 'Las contraseñas no coinciden.' : passwordConfirmation ? 'Las contraseñas coinciden.' : '')}</small></label></>}
      {serverError && <div className="form-message error" role="alert">{serverError}</div>}{notice && <div className="form-message success" role="status">{notice}</div>}
      <button className="button primary wide" disabled={isSubmitting || passwordsMismatch} type="submit">{isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'} {!isSubmitting && <ArrowRight size={18} />}</button>
      {isLogin && <Link className="auth-demo-link" to="/demo"><Play size={16} /> Ver demo interactiva <ArrowRight size={15} /></Link>}
      <p className="auth-switch">{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Crea una gratis' : 'Inicia sesión'}</Link></p>
    </form></div></div>
}
