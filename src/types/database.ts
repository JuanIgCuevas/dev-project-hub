export type ProjectStatus = 'idea' | 'in_progress' | 'paused' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type IdeaStatus = 'inbox' | 'considering' | 'archived'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: ProjectStatus
  technologies: string[]
  repository_url: string | null
  live_url: string | null
  is_public: boolean
  public_slug: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  technologies: string[]
  status: IdeaStatus
  converted_project_id: string | null
  excitement: number
  usefulness: number
  difficulty: number
  portfolio_value: number
  estimated_hours: number
  created_at: string
  updated_at: string
}

export interface ProjectEvent {
  id: string
  project_id: string
  event_type: 'project_created' | 'status_changed' | 'task_created' | 'task_completed' | 'note'
  title: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ProjectDecision {
  id: string
  project_id: string
  title: string
  context: string | null
  decision: string
  created_at: string
}

export interface FocusSessionRecord {
  id: string
  project_id: string
  task_ids: string[]
  task_titles: string[]
  planned_seconds: number
  focused_seconds: number
  started_at: string
  completed_at: string
  completion_reason: 'timer' | 'manual'
  outcome: string | null
  pending: string | null
  next_step: string | null
  rating: number | null
  created_at: string
  updated_at: string
}
