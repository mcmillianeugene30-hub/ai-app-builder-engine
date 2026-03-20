'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ProjectFile } from '@/types/project'
import type { OpenFile, EditorState } from '@/types/editor'

export function useEditor(
  saveFileFn: (fileId: string, content: string) => Promise<void>
) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Track content changes for each file
  const contentMap = useRef<Map<string, string>>(new Map())
  
  // Auto-save timer ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // Open a file
  const openFile = useCallback((file: ProjectFile) => {
    setOpenFiles(prev => {
      // Check if already open
      const existing = prev.find(f => f.file.id === file.id)
      if (existing) {
        setActiveFileId(file.id)
        return prev
      }
      
      // Add new file
      const newOpenFile: OpenFile = {
        file,
        isDirty: false,
        isActive: false,
      }
      
      setActiveFileId(file.id)
      return [...prev, newOpenFile]
    })
  }, [])

  // Switch to file
  const switchFile = useCallback((fileId: string) => {
    setActiveFileId(fileId)
    setOpenFiles(prev =>
      prev.map(f => ({
        ...f,
        isActive: f.file.id === fileId,
      }))
    )
  }, [])

  // Close a file
  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.file.id !== fileId)
      
      // Update active file if we closed the active one
      if (activeFileId === fileId && newFiles.length > 0) {
        const lastFile = newFiles[newFiles.length - 1]
        setActiveFileId(lastFile.file.id)
      } else if (newFiles.length === 0) {
        setActiveFileId(null)
      }
      
      // Clean up content map
      contentMap.current.delete(fileId)
      
      return newFiles
    })
  }, [activeFileId])

  // Update file content
  const updateFileContent = useCallback((fileId: string, content: string) => {
    contentMap.current.set(fileId, content)
    
    setOpenFiles(prev =>
      prev.map(f => {
        if (f.file.id === fileId) {
          return {
            ...f,
            isDirty: content !== f.file.content,
          }
        }
        return f
      })
    )
  }, [])

  // Save current file
  const saveCurrentFile = useCallback(async () => {
    if (!activeFileId || isSaving) return
    
    const newContent = contentMap.current.get(activeFileId)
    if (newContent === undefined) return
    
    setIsSaving(true)
    try {
      await saveFileFn(activeFileId, newContent)
      
      // Mark as clean after successful save
      setOpenFiles(prev =>
        prev.map(f => {
          if (f.file.id === activeFileId) {
            return {
              ...f,
              isDirty: false,
              file: {
                ...f.file,
                content: newContent,
                updatedAt: new Date().toISOString(),
              },
            }
          }
          return f
        })
      )
      
      // Clear from content map
      contentMap.current.delete(activeFileId)
    } finally {
      setIsSaving(false)
    }
  }, [activeFileId, isSaving, saveFileFn])

  // Save specific file
  const saveFile = useCallback(async (fileId: string) => {
    if (isSaving) return
    
    const newContent = contentMap.current.get(fileId)
    if (newContent === undefined) return
    
    setIsSaving(true)
    try {
      await saveFileFn(fileId, newContent)
      
      setOpenFiles(prev =>
        prev.map(f => {
          if (f.file.id === fileId) {
            return {
              ...f,
              isDirty: false,
              file: {
                ...f.file,
                content: newContent,
                updatedAt: new Date().toISOString(),
              },
            }
          }
          return f
        })
      )
      
      contentMap.current.delete(fileId)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, saveFileFn])

  // Get active file content (edited or original)
  const getActiveFileContent = useCallback((): string => {
    if (!activeFileId) return ''
    
    const editedContent = contentMap.current.get(activeFileId)
    if (editedContent !== undefined) return editedContent
    
    const activeFile = openFiles.find(f => f.file.id === activeFileId)
    return activeFile?.file.content || ''
  }, [activeFileId, openFiles])

  // Check if active file is dirty
  const isActiveDirty = useCallback((): boolean => {
    if (!activeFileId) return false
    const activeFile = openFiles.find(f => f.file.id === activeFileId)
    return activeFile?.isDirty || false
  }, [activeFileId, openFiles])

  // Close all files
  const closeAllFiles = useCallback(() => {
    setOpenFiles([])
    setActiveFileId(null)
    contentMap.current.clear()
  }, [])

  // Get active file
  const activeFile = openFiles.find(f => f.file.id === activeFileId) || null

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+W to close file
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeFileId) {
          closeFile(activeFileId)
        }
      }
      
      // Cmd/Ctrl+S handled in CodeEditor component
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFileId, closeFile])

  return {
    openFiles,
    activeFileId,
    activeFile,
    isSaving,
    openFile,
    switchFile,
    closeFile,
    updateFileContent,
    saveCurrentFile,
    saveFile,
    getActiveFileContent,
    isActiveDirty,
    closeAllFiles,
  }
}
