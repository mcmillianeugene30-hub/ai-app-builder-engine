import { create } from 'zustand'
import type { Project, ProjectFile } from '@/types/project'

interface AppState {
  // View state
  activeView: 'generate' | 'editor'
  activePanel: 'explorer' | 'database' | 'git' | 'export' | 'collaboration' | 'chat' | 'history' | 'terminal' | null
  viewMode: 'editor-only' | 'preview-only' | 'split-horizontal' | 'split-vertical'
  
  // AI Generation state
  prompt: string
  isGenerating: boolean
  generationError: string | null
  
  // Project state
  projects: Project[]
  activeProject: Project | null
  isLoadingProjects: boolean
  
  // Editor state
  openFiles: ProjectFile[]
  activeFileId: string | null
  
  // Actions
  setActiveView: (view: 'generate' | 'editor') => void
  setActivePanel: (panel: AppState['activePanel']) => void
  setViewMode: (mode: AppState['viewMode']) => void
  setPrompt: (prompt: string) => void
  setIsGenerating: (isGenerating: boolean) => void
  setGenerationError: (error: string | null) => void
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  updateProjectFiles: (files: ProjectFile[]) => void
  openFile: (file: ProjectFile) => void
  closeFile: (fileId: string) => void
  setActiveFile: (fileId: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activeView: 'generate',
  activePanel: null,
  viewMode: 'split-horizontal',
  prompt: '',
  isGenerating: false,
  generationError: null,
  projects: [],
  activeProject: null,
  isLoadingProjects: false,
  openFiles: [],
  activeFileId: null,
  
  // Actions
  setActiveView: (view) => set({ activeView: view }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPrompt: (prompt) => set({ prompt }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationError: (error) => set({ generationError: error }),
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ 
    activeProject: project,
    openFiles: project ? project.files.slice(0, 5) : [],
    activeFileId: project?.files[0]?.id || null,
  }),
  updateProjectFiles: (files) => {
    const { activeProject } = get()
    if (activeProject) {
      set({ 
        activeProject: { ...activeProject, files },
        openFiles: files.filter(f => 
          get().openFiles.some(of => of.id === f.id)
        ),
      })
    }
  },
  openFile: (file) => {
    const { openFiles, activeFileId } = get()
    if (!openFiles.some(f => f.id === file.id)) {
      set({ 
        openFiles: [...openFiles, file],
        activeFileId: file.id,
      })
    } else if (activeFileId !== file.id) {
      set({ activeFileId: file.id })
    }
  },
  closeFile: (fileId) => {
    const { openFiles, activeFileId } = get()
    const newOpenFiles = openFiles.filter(f => f.id !== fileId)
    set({ 
      openFiles: newOpenFiles,
      activeFileId: activeFileId === fileId 
        ? newOpenFiles[newOpenFiles.length - 1]?.id || null 
        : activeFileId,
    })
  },
  setActiveFile: (fileId) => set({ activeFileId: fileId }),
}))