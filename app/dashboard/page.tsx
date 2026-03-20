'use client'

import { useState, useEffect, useCallback } from 'react'
import { currentUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  Clock,
  Layout,
  Settings,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, ProjectListItem } from '@/types/project'
import { formatDistanceToNow } from 'date-fns'

// Dashboard sidebar items
const SIDEBAR_ITEMS = [
  { id: 'projects', icon: Layout, label: 'Projects' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('projects')
  const [user, setUser] = useState<any>(null)
  
  // Load projects
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch projects
        const response = await fetch('/api/projects')
        const data = await response.json()
        
        if (data.success) {
          setProjects(data.data)
        } else {
          setError('Failed to load projects')
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Create new project
  const createProject = useCallback(async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          description: 'Created from dashboard',
          files: [],
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/?project=${data.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }, [router])
  
  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProjects(projects.filter(p => p.id !== projectId))
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }, [projects])
  
  // Filter projects
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold text-zinc-100">App Builder</span>
          </div>
        </div>
        
        <nav className="flex-1 p-2">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  activeTab === item.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => router.push('/sign-in')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-64 pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
              
              {/* New project button */}
              <button
                onClick={createProject}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
        </header>
        
        {/* Projects grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-zinc-300 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Refresh page
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Layout className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-zinc-300 font-medium mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
              <p className="text-zinc-500 text-sm mb-6 max-w-sm">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first project to get started with AI-powered app building'}
              </p>
              {!searchQuery && (
                <button
                  onClick={createProject}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={() => deleteProject(project.id)}
                  onOpen={() => router.push(`/?project=${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Project card component
function ProjectCard({ 
  project, 
  onDelete, 
  onOpen 
}: { 
  project: ProjectListItem
  onDelete: () => void
  onOpen: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div 
          onClick={onOpen}
          className="flex-1 cursor-pointer"
        >
          <h3 className="font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl z-20 py-1">
                <button
                  onClick={() => {
                    onOpen()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-4">
        <span className="flex items-center gap-1">
          <Layout className="w-3 h-3" />
          {project.file_count || 0} files
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {project.updated_at 
            ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
            : 'Recently'}
        </span>
      </div>
    </div>
  )
}
