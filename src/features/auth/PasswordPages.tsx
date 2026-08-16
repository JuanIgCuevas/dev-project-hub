import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from './AuthProvider'

const emailSchema = z.object({ email: z.email('Ingresá un email válido.') })
const passwordSchema = z.object({
  password: z.string().min(8, 'Usá al menos 8 caracteres.'),
  confirmation: z.string(),
}).refine(values => values.password === values.confirmation, { path: ['confirmation'], message: 'Las contraseñas no coinciden.' })

function AuthCard({ children }: { children: React.ReactNode }) {
  return <div className="simple-auth"><div className="simple-auth-card"><Link className="brand" to="/"><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>BUILD SYSTEM · 2026</small></span></Link>{children}</div></div>
}

export function ForgotPasswordPage() {
  const { sendPasswordReset, user } = useAuth()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })
  if (user) return <Navigate to="/settings" replace />

  return <AuthCard><span className="account-icon"><Mail /></span><h1>Recuperar contraseña</h1><p>Te enviaremos un enlace seguro para elegir una contraseña nueva.</p>
    {sent ? <div className="form-message success">Revisá tu bandeja de entrada y también la carpeta de spam.</div> : <form onSubmit={handleSubmit(async values => { setServerError(''); try { await sendPasswordReset(values.email); setSent(true) } catch { setServerError('No pudimos enviar el enlace. Intentá nuevamente.') } })}><label>Email<input type="email" autoComplete="email" {...register('email')} placeholder="vos@email.com" /><small>{errors.email?.message}</small></label>{serverError && <div className="form-message error">{serverError}</div>}<button className="button primary wide" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar enlace'} {!isSubmitting && <ArrowRight size={18} />}</button></form>}
    <Link className="back-auth" to="/login"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
  </AuthCard>
}

export function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) })
  if (loading) return null
  if (!user) return <Navigate to="/forgot-password" replace />

  return <AuthCard><span className="account-icon"><KeyRound /></span><h1>Nueva contraseña</h1><p>Elegí una contraseña segura que no hayas usado anteriormente.</p><form onSubmit={handleSubmit(async values => { setServerError(''); try { await updatePassword(values.password); navigate('/settings', { replace: true, state: { passwordUpdated: true } }) } catch { setServerError('No pudimos actualizar la contraseña. Solicitá un enlace nuevo.') } })}>
    <label>Nueva contraseña<input type="password" autoComplete="new-password" {...register('password')} /><small>{errors.password?.message}</small></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" {...register('confirmation')} /><small>{errors.confirmation?.message}</small></label>{serverError && <div className="form-message error">{serverError}</div>}<button className="button primary wide" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar contraseña'} {!isSubmitting && <ArrowRight size={18} />}</button>
  </form></AuthCard>
}
