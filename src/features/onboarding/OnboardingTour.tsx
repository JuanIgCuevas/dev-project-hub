import { ArrowLeft, ArrowRight, Bot, FolderKanban, LayoutDashboard, Lightbulb, ListTodo, RotateCcw, Settings, Sparkles, Timer, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TourStep {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  secondaryIcon?: LucideIcon
  tone: string
  points: string[]
}

const steps: TourStep[] = [
  {
    eyebrow: 'BIENVENIDO A DEVHUB',
    title: 'Todo tu trabajo, con una dirección clara',
    description: 'DevHub reúne proyectos, tareas, ideas y sesiones de foco para ayudarte a decidir qué continuar y terminar lo que empezaste.',
    icon: Sparkles,
    tone: 'welcome',
    points: ['Un resumen para saber qué hacer hoy', 'Cada proyecto con tareas y progreso', 'Historial real de tu tiempo enfocado'],
  },
  {
    eyebrow: 'PASO 1 · INICIO',
    title: 'Empezá por el pulso general',
    description: 'Inicio te muestra la próxima tarea recomendada, tus minutos Focus, ideas pendientes y el proyecto que necesita atención.',
    icon: LayoutDashboard,
    tone: 'home',
    points: ['Revisá tu próximo paso', 'Detectá proyectos frenados', 'Consultá tu objetivo Focus diario'],
  },
  {
    eyebrow: 'PASO 2 · PROJECT REVIVAL',
    title: 'Retomá sin reconstruir todo en tu cabeza',
    description: 'DevHub recuerda tu último resultado, lo que quedó pendiente y el próximo paso. El radar detecta proyectos que están perdiendo impulso.',
    icon: RotateCcw,
    tone: 'revival',
    points: ['Iniciá una sesión de rescate corta', 'Dejá un mensaje para tu próxima sesión', 'Descubrí tu Project DNA con el uso'],
  },
  {
    eyebrow: 'PASO 3 · PROYECTOS',
    title: 'Dale un hogar a cada proyecto',
    description: 'Creá un proyecto, definí su estado y stack, y mantené sus tareas, enlaces y avances en un solo lugar.',
    icon: FolderKanban,
    tone: 'projects',
    points: ['Usá estados para reflejar su momento', 'Mirá el progreso y Project Pulse', 'Entrá al proyecto para trabajar en detalle'],
  },
  {
    eyebrow: 'PASO 4 · TAREAS E IDEAS',
    title: 'Separá lo accionable de lo posible',
    description: 'Mis tareas reúne el trabajo de todos los proyectos. Ideas es tu bandeja para guardar oportunidades sin convertirlas en compromisos todavía.',
    icon: ListTodo,
    secondaryIcon: Lightbulb,
    tone: 'work',
    points: ['Filtrá tareas por proyecto y prioridad', 'Usá lista o Kanban', 'Convertí una buena idea en proyecto cuando esté lista'],
  },
  {
    eyebrow: 'PASO 5 · MODO FOCUS',
    title: 'Trabajá con un objetivo concreto',
    description: 'Elegí un proyecto, una duración y las tareas de la sesión. Al terminar, guardá qué resolviste, qué quedó pendiente y cuál es el próximo paso.',
    icon: Timer,
    tone: 'focus',
    points: ['El temporizador sigue activo mientras navegás', 'Podés minimizarlo para que no moleste', 'El historial construye una memoria real del proyecto'],
  },
  {
    eyebrow: 'PASO 6 · ASISTENTE Y AJUSTES',
    title: 'Personalizá DevHub a tu manera',
    description: 'El asistente usa tus datos para ayudarte a decidir. Desde Ajustes podés controlar su comportamiento, el tema, Focus, tu cuenta y este tutorial.',
    icon: Bot,
    secondaryIcon: Settings,
    tone: 'assistant',
    points: ['Preguntá qué proyecto continuar', 'Configurá metas y duración de Focus', 'Volvé a abrir este recorrido cuando quieras'],
  },
]

export function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = steps[currentStep]
  const StepIcon = step.icon
  const SecondaryIcon = step.secondaryIcon
  const isLast = currentStep === steps.length - 1

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onFinish() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onFinish])

  return <div className="onboarding-backdrop" role="presentation">
    <section className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <button className="onboarding-close" type="button" onClick={onFinish} aria-label="Omitir tutorial" title="Omitir tutorial"><X /></button>
      <div className={`onboarding-visual ${step.tone}`}>
        <span className="onboarding-orbit orbit-one" />
        <span className="onboarding-orbit orbit-two" />
        <div className="onboarding-icon"><StepIcon />{SecondaryIcon && <span><SecondaryIcon /></span>}</div>
        <strong>DevHub</strong>
        <small>{currentStep === 0 ? 'Construí con intención' : `${currentStep} de ${steps.length - 1}`}</small>
      </div>
      <div className="onboarding-content">
        <div className="onboarding-progress" aria-label={`Paso ${currentStep + 1} de ${steps.length}`}>{steps.map((item, index) => <i className={index <= currentStep ? 'active' : ''} key={item.eyebrow} />)}</div>
        <p className="eyebrow">{step.eyebrow}</p>
        <h2 id="onboarding-title">{step.title}</h2>
        <p className="onboarding-description">{step.description}</p>
        <ul>{step.points.map(point => <li key={point}><span>✓</span>{point}</li>)}</ul>
        <div className="onboarding-actions">
          <button className="onboarding-skip" type="button" onClick={onFinish}>Omitir tutorial</button>
          <div>{currentStep > 0 && <button className="button" type="button" onClick={() => setCurrentStep(index => index - 1)}><ArrowLeft /> Atrás</button>}<button className="button primary" type="button" onClick={() => isLast ? onFinish() : setCurrentStep(index => index + 1)}>{isLast ? 'Empezar a construir' : 'Siguiente'} {!isLast && <ArrowRight />}</button></div>
        </div>
      </div>
    </section>
  </div>
}
