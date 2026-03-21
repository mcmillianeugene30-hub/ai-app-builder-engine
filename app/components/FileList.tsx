'use client'

import { 
  FileCode, 
  FileJson, 
  FileText, 
  File as FileIcon,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import type { FileListProps } from '@/types/editor'
import type { ProjectFile } from '@/types/project'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  file?: ProjectFile
  children: FileNode[]
  depth: number
}

// File type icons
function FileTypeIcon({ type, isOpen }: { type: ProjectFile['type']; isOpen?: boolean }) {
  const iconClass = "w-4 h-4"
  
  switch (type) {
    case 'frontend':
      return isOpen ? <FolderOpen className={cn(iconClass, "text-blue-400")} /> : <Folder className={cn(iconClass, "text-blue-400")} />
    case 'backend':
      return isOpen ? <FolderOpen className={cn(iconClass, "text-green-400")} /> : <Folder className={cn(iconClass, "text-green-400")} />
    case 'database':
      return isOpen ? <FolderOpen className={cn(iconClass, "text-purple-400")} /> : <Folder className={cn(iconClass, "text-purple-400")} />
    case 'config':
      return <FileJson className={cn(iconClass, "text-yellow-400")} />
    default:
      return <FileText className={cn(iconClass, "text-zinc-400")} />
  }
}

// Build file tree from flat file list
function buildFileTree(files: ProjectFile[]): FileNode[] {
  const root: FileNode[] = []
  const nodes = new Map<string, FileNode>()
  
  // Sort files by path for consistent ordering
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))
  
  for (const file of sortedFiles) {
    const parts = file.path.split('/')
    let currentPath = ''
    let currentNodes = root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLastPart = i === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (isLastPart) {
        // This is a file
        const fileNode: FileNode = {
          id: file.id,
          name: part,
          type: 'file',
          file,
          children: [],
          depth: i,
        }
        currentNodes.push(fileNode)
        nodes.set(file.id, fileNode)
      } else {
        // This is a folder
        let folderNode = currentNodes.find(n => n.name === part && n.type === 'folder')
        
        if (!folderNode) {
          folderNode = {
            id: `folder-${currentPath}`,
            name: part,
            type: 'folder',
            children: [],
            depth: i,
          }
          currentNodes.push(folderNode)
        }
        
        currentNodes = folderNode.children
      }
    }
  }
  
  // Sort: folders first, then files, both alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => {
      if (n.children.length > 0) {
        sortNodes(n.children)
      }
    })
  }
  
  sortNodes(root)
  return root
}

// File tree item component
function FileTreeItem({
  node,
  openFileIds,
  activeFileId,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
}: {
  node: FileNode
  openFileIds: string[]
  activeFileId: string | null
  onSelectFile: (file: ProjectFile) => void
  expandedFolders: Set<string>
  onToggleFolder: (id: string) => void
}) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedFolders.has(node.id)
  const isFileOpen = node.file ? openFileIds.includes(node.file.id) : false
  const isFileActive = node.file ? node.file.id === activeFileId : false
  
  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.id)
    } else if (node.file) {
      onSelectFile(node.file)
    }
  }
  
  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
          isFileActive 
            ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500" 
            : isFileOpen
              ? "bg-zinc-800/50 text-zinc-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        )}
        style={{ paddingLeft: `${12 + node.depth * 16}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-zinc-400" />
            ) : (
              <Folder className="w-4 h-4 text-zinc-400" />
            )}
          </>
        ) : node.file ? (
          <FileTypeIcon type={node.file.type} isOpen={isFileOpen} />
        ) : (
          <FileText className="w-4 h-4 text-zinc-400" />
        )}
        
        <span className="truncate flex-1 text-left">{node.name}</span>
        
        {isFileOpen && !isFileActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" title="Open" />
        )}
      </button>
      
      {isFolder && isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.id}
              node={child}
              openFileIds={openFileIds}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileList({
  files,
  openFileIds,
  activeFileId,
  onSelectFile,
}: FileListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Auto-expand root level folders
    const initial = new Set<string>()
    return initial
  })
  
  const fileTree = useMemo(() => buildFileTree(files), [files])
  
  const handleToggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Files
        </span>
        <button 
          className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
          title="New file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-sm">
            No files in project
          </div>
        ) : (
          fileTree.map(node => (
            <FileTreeItem
              key={node.id}
              node={node}
              openFileIds={openFileIds}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
          ))
        )}
      </div>
      
      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-zinc-800 text-xs text-zinc-500">
        {files.length} file{files.length !== 1 ? 's' : ''}
        {openFileIds.length > 0 && (
          <span className="ml-2">
            • {openFileIds.length} open
          </span>
        )}
      </div>
    </div>
  )
}
