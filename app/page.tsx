'use client'

import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  PromptInput, 
  GenerateButton,
  CodeEditor, 
  TabsBar, 
  FileList,
  PreviewWindow,
  DatabasePanel,
  GitPanel,
  ExportPanel,
  CollaborationPanel,
  ChatPanel,
  HistoryPanel,
  TerminalPanel,
} from './components'
import type { AppGenerationOutput } from '@/types'
import type { Project, ProjectFile } from '@/types/project'
import { 
  Layout,
  Database,
  Github,
  Download,
  Users,
  MessageSquare,
  History,
  Terminal,
  PanelLeft,
  PanelRight,
  Columns,
  Eye,
  Code,
  Sparkles,
  FileCode,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Sidebar sections
const SIDEBAR_SECTIONS = [
  { id: 'explorer', icon: FileCode, label: 'Files', color: 'text-blue-400' },
  { id: 'database', icon: Database, label: 'Database', color: 'text-emerald-400' },
  { id: 'git', icon: Github, label: 'Git', color: 'text-zinc-400' },
  { id: 'export', icon: Download, label: 'Export', color: 'text-zinc-400' },
  { id: 'collaboration', icon: Users, label: 'Live', color: 'text-indigo-400' },
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', color: 'text-purple-400' },
  { id: 'history', icon: History, label: 'History', color: 'text-amber-400' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', color: 'text-zinc-400' },
] as const

export default function Home() {
  // Store state
  const {
    activeView,
    activePanel,
    viewMode,
    prompt,
    isGenerating,
    generationError,
    activeProject,
    openFiles,
    activeFileId,
    setActiveView,
    setActivePanel,
    setViewMode,
    setPrompt,
    setIsGenerating,
    setGenerationError,
    setActiveProject,
    openFile,
    closeFile,
    setActiveFile,
    updateProjectFiles,
  } = useAppStore()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editorMounted, setEditorMounted] = useState(false)
  
  // Mount editor after hydration
  useEffect(() => {
    setEditorMounted(true)
  }, [])
  
  // Load project on mount
  useEffect(() => {
    const loadInitialProject = async () => {
      try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          // Load most recent project
          const projectId = data.data[0].id
          const projectRes = await fetch(`/api/projects/${projectId}`)
          const projectData = await projectRes.json()
          if (projectData.success) {
            setActiveProject(projectData.data)
          }
        }
      } catch (error) {
        console.error('Failed to load initial project:', error)
      }
    }
    
    loadInitialProject()
  }, [setActiveProject])
  
  // Get active file
  const activeFile = openFiles.find(f => f.id === activeFileId) || null
  
  // AI Generation
  const generateApp = useCallback(async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed')
      }
      
      // Create project from output
      const output: AppGenerationOutput = data.data
      const files: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>[] = []
      
      if (output.frontend) {
        files.push({
          name: 'page.tsx',
          path: 'frontend/app/page.tsx',
          content: output.frontend,
          type: 'frontend',
          language: 'typescript',
        })
      }
      
      if (output.backend) {
        files.push({
          name: 'route.ts',
          path: 'backend/api/route.ts',
          content: output.backend,
          type: 'backend',
          language: 'typescript',
        })
      }
      
      if (output.database) {
        files.push({
          name: 'schema.sql',
          path: 'database/schema.sql',
          content: output.database,
          type: 'database',
          language: 'sql',
        })
      }
      
      // Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prompt.slice(0, 50),
          description: `Generated: ${prompt.slice(0, 100)}...`,
          files,
        }),
      })
      
      const projectData = await projectRes.json()
      
      if (projectData.success) {
        setActiveProject(projectData.data)
        setActiveView('editor')
        setActivePanel('explorer')
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, setIsGenerating, setGenerationError, setActiveProject, setActiveView, setActivePanel])
  
  // Handle file save
  const handleFileSave = useCallback(async (fileId: string, content: string) => {
    if (!activeProject) return
    
    const updatedFiles = activeProject.files.map(f =>
      f.id === fileId ? { ...f, content } : f
    )
    
    try {
      const response = await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updatedFiles }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        updateProjectFiles(updatedFiles)
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [activeProject, updateProjectFiles])
  
  // Handle chat edit request
  const handleChatEdit = useCallback((fileId: string, newContent: string) => {
    handleFileSave(fileId, newContent)
  }, [handleFileSave])
  
  // Get previewable files
  const previewableFiles = activeProject?.files.filter(
    f => f.type === 'frontend' || f.language === 'html' || f.language === 'css'
  ) || []
  
  // Get database schema
  const databaseSchema = activeProject?.files
    .filter(f => f.type === 'database')
    .map(f => f.content)
    .join('\n\n') || ''
  
  // Sidebar content
  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'explorer':
        return activeProject ? (
          <FileList
            files={activeProject.files}
            openFileIds={openFiles.map(f => f.id)}
            activeFileId={activeFileId}
            onFileClick={openFile}
            onFileClose={closeFile}
          />
        ) : (
          <div className="p-4 text-center text-zinc-500">
            No project open
          </div>
        )
      
      case 'database':
        return (
          <DatabasePanel
            schema={databaseSchema}
            isVisible={true}
          />
        )
      
      case 'git':
        return (
          <GitPanel
            project={activeProject}
            isVisible={true}
          />
        )
      
      case 'export':
        return (
          <ExportPanel
            project={activeProject}
            isVisible={true}
          />
        )
      
      case 'collaboration':
        return (
          <CollaborationPanel
            project={activeProject}
            isVisible={true}
          />
        )
      
      case 'chat':
        return (
          <ChatPanel
            project={activeProject}
            currentFile={activeFile}
            openFiles={openFiles}
            isVisible={true}
            onRequestEdit={handleChatEdit}
          />
        )
      
      case 'history':
        return activeProject ? (
          <HistoryPanel
            projectId={activeProject.id}
            currentFiles={activeProject.files}
            isVisible={true}
            onRestore={(files) => updateProjectFiles(files)}
            onFilesChange={() => {}}
          />
        ) : null
      
      case 'terminal':
        return (
          <TerminalPanel
            project={activeProject}
            isVisible={true}
          />
        )
      
      default:
        return null
    }
  }
  
  // Generate View
  if (activeView === 'generate') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-semibold text-white">AI App Builder</h1>
          </div>
          <button
            onClick={() => setActiveView('editor')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
          >
            <Code className="w-4 h-4" />
            Editor
          </button>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                What would you like to build?
              </h2>
              <p className="text-zinc-400">
                Describe your app and AI will generate the code
              </p>
            </div>
            
            <div className="space-y-4">
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onSubmit={generateApp}
                placeholder="Build a task management app with React and SQLite..."
                maxLength={5000}
              />
              
              <GenerateButton
                onClick={generateApp}
                loading={isGenerating}
                disabled={!prompt.trim()}
              />
            </div>
            
            {generationError && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-200">
                {generationError}
              </div>
            )}
            
            {/* Example prompts */}
            <div className="mt-8">
              <p className="text-sm text-zinc-500 mb-3">Try these:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'E-commerce product page',
                  'User authentication API',
                  'Dashboard with charts',
                  'Blog with markdown support',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-sm rounded-full hover:bg-zinc-700 hover:text-zinc-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  // Editor View
  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Left Sidebar - Icons */}
      <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col py-2">
        <div className="flex items-center justify-center py-3 border-b border-zinc-800 mb-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        
        {SIDEBAR_SECTIONS.map((section) => {
          const Icon = section.icon
          const isActive = activePanel === section.id
          
          return (
            <button
              key={section.id}
              onClick={() => setActivePanel(isActive ? null : section.id)}
              className={cn(
                'p-3 mx-1 rounded-lg transition-colors relative',
                isActive 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
              title={section.label}
            >
              <Icon className={cn('w-5 h-5', section.color)} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-purple-500 rounded-r" />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Left Panel - Content */}
      {activePanel && (
        <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="font-medium text-zinc-200">
              {SIDEBAR_SECTIONS.find(s => s.id === activePanel)?.label}
            </span>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderSidebarContent()}
          </div>
        </div>
      )}
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-4">
            {/* Project name */}
            <span className="font-medium text-zinc-200">
              {activeProject?.name || 'Untitled Project'}
            </span>
            
            {/* View mode toggle */}
            <div className="flex items-center bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('editor-only')}
                className={cn(
                  'p-1.5 rounded',
                  viewMode === 'editor-only' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                )}
                title="Editor only"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split-horizontal')}
                className={cn(
                  'p-1.5 rounded',
                  viewMode === 'split-horizontal' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                )}
                title="Split horizontal"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split-vertical')}
                className={cn(
                  'p-1.5 rounded',
                  viewMode === 'split-vertical' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                )}
                title="Split vertical"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview-only')}
                className={cn(
                  'p-1.5 rounded',
                  viewMode === 'preview-only' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                )}
                title="Preview only"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('generate')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              <Sparkles className="w-4 h-4" />
              New App
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        {openFiles.length > 0 && (
          <TabsBar
            openFiles={openFiles}
            activeFileId={activeFileId}
            onTabClick={setActiveFile}
            onTabClose={closeFile}
            isDirtyMap={{}}
          />
        )}
        
        {/* Editor / Preview */}
        <div className={cn(
          'flex-1 flex overflow-hidden',
          viewMode === 'split-vertical' && 'flex-col'
        )}>
          {/* Editor */}
          {(viewMode !== 'preview-only') && (
            <div className={cn(
              'flex flex-col',
              viewMode === 'split-horizontal' && 'w-1/2',
              viewMode === 'split-vertical' && 'h-1/2',
              viewMode === 'editor-only' && 'w-full h-full'
            )}>
              {editorMounted && activeFile ? (
                <CodeEditor
                  file={activeFile}
                  value={activeFile.content}
                  onChange={(value) => {}}
                  onSave={() => handleFileSave(activeFile.id, activeFile.content)}
                  isDirty={false}
                  isSaving={false}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  {activeProject ? 'Select a file to edit' : 'No project open'}
                </div>
              )}
            </div>
          )}
          
          {/* Preview */}
          {(viewMode !== 'editor-only') && (
            <div className={cn(
              'border-zinc-800',
              viewMode === 'split-horizontal' && 'w-1/2 border-l',
              viewMode === 'split-vertical' && 'h-1/2 border-t',
              viewMode === 'preview-only' && 'w-full h-full'
            )}>
              <PreviewWindow
                files={previewableFiles}
                activeFileId={activeFileId}
                isVisible={true}
                onError={(error) => console.error('Preview error:', error)}
                onLoad={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}