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
  created_at: string
  updated_at: string
}
