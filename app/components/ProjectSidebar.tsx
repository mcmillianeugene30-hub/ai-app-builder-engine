'use client'

import { useState, useCallback } from 'react'
import { 
  Folder, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Clock,
  FileCode,
  MoreVertical,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectSidebarProps, ProjectListItem } from '@/types/project'

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  loading = false,
}: ProjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleExpanded = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }, [])

  const handleDelete = useCallback(async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return
    
    setDeletingId(projectId)
    try {
      await onDeleteProject(projectId)
    } finally {
      setDeletingId(null)
    }
  }, [onDeleteProject])

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-72 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100 mb-3">Projects</h2>
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'group relative rounded-lg transition-colors',
                  activeProjectId === project.id 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'hover:bg-zinc-800/50'
                )}
              >
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      activeProjectId === project.id
                        ? 'bg-blue-600/30 text-blue-300'
                        : 'bg-zinc-800 text-zinc-400'
                    )}>
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'text-sm font-medium truncate',
                        activeProjectId === project.id ? 'text-blue-200' : 'text-zinc-200'
                      )}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                        <span className="text-zinc-600">•</span>
                        <FileCode className="w-3 h-3" />
                        <span>{project.fileCount} files</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  disabled={deletingId === project.id}
                  className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10"
                >
                  {deletingId === project.id ? (
                    <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
