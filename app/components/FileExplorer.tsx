'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  FileText, 
  Trash2, 
  Plus,
  ChevronRight,
  ChevronDown,
  File as FileIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileExplorerProps, ProjectFile } from '@/types/project'

type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  fileType?: ProjectFile['type']
  file?: ProjectFile
  children: FileNode[]
  isExpanded?: boolean
}

// File type icons
const FileTypeIcon = ({ type, isOpen }: { type: ProjectFile['type'] | string; isOpen?: boolean }) => {
  switch (type) {
    case 'frontend':
      return isOpen ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />
    case 'backend':
      return isOpen ? <FolderOpen className="w-4 h-4 text-green-400" /> : <Folder className="w-4 h-4 text-green-400" />
    case 'database':
      return isOpen ? <FolderOpen className="w-4 h-4 text-purple-400" /> : <Folder className="w-4 h-4 text-purple-400" />
    case 'config':
      return <FileJson className="w-4 h-4 text-yellow-400" />
    default:
      return <FileCode className="w-4 h-4 text-zinc-400" />
  }
}

// Build tree from flat file list
function buildFileTree(files: ProjectFile[]): FileNode[] {
  const root: FileNode[] = []
  const map = new Map<string, FileNode>()

  // First pass: create all nodes
  files.forEach(file => {
    const parts = file.path.split('/').filter(Boolean)
    let currentPath = ''
    
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLast = index === parts.length - 1
      
      if (!map.has(currentPath)) {
        const node: FileNode = {
          id: isLast ? file.id : `folder-${currentPath}`,
          name: part,
          type: isLast ? 'file' : 'folder',
          fileType: isLast ? file.type : undefined,
          file: isLast ? file : undefined,
          children: [],
          isExpanded: true,
        }
        map.set(currentPath, node)
      }
    })
  })

  // Second pass: build tree structure
  files.forEach(file => {
    const parts = file.path.split('/').filter(Boolean)
    let parentPath = ''
    
    parts.forEach((part, index) => {
      const currentPath = parentPath ? `${parentPath}/${part}` : part
      const isLast = index === parts.length - 1
      
      if (!isLast) {
        const parent = map.get(parentPath || 'root') || root
        const node = map.get(currentPath)!
        
        if (parent === root) {
          if (!root.find(n => n.id === node.id)) {
            root.push(node)
          }
        } else {
          const parentNode = map.get(parentPath)!
          if (!parentNode.children.find(c => c.id === node.id)) {
            parentNode.children.push(node)
          }
        }
      } else {
        // Add file to parent
        const parent = parentPath ? map.get(parentPath) : null
        const node = map.get(currentPath)!
        
        if (parent) {
          parent.children.push(node)
        } else {
          root.push(node)
        }
      }
      
      parentPath = currentPath
    })
  })

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    }).map(node => ({
      ...node,
      children: sortNodes(node.children)
    }))
  }

  return sortNodes(root)
}

interface TreeNodeProps {
  node: FileNode
  level: number
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onDeleteFile?: (fileId: string) => void
  expandedNodes: Set<string>
  onToggleExpand: (nodeId: string) => void
}

function TreeNode({ 
  node, 
  level, 
  selectedFileId, 
  onSelectFile, 
  onDeleteFile,
  expandedNodes,
  onToggleExpand,
}: TreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id)
  const isSelected = node.type === 'file' && node.file?.id === selectedFileId

  const handleClick = () => {
    if (node.type === 'folder') {
      onToggleExpand(node.id)
    } else {
      onSelectFile(node.id)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors group',
          isSelected 
            ? 'bg-blue-600/20 text-blue-200' 
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {node.type === 'folder' ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        
        <FileTypeIcon type={node.fileType || node.type} isOpen={isExpanded} />
        
        <span className="truncate flex-1 text-left">{node.name}</span>
        
        {node.type === 'file' && onDeleteFile && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFile(node.id)
            }}
            className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {node.type === 'folder' && isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({
  files,
  selectedFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    return files.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [files, searchQuery])

  const fileTree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles])

  // Group files by type for summary
  const fileCounts = useMemo(() => {
    return files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [files])

  return (
    <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-100">Files</h2>
          {onCreateFile && (
            <button
              onClick={onCreateFile}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="p-4 text-center">
            <FileIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No files yet</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-zinc-500">No files match &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          fileTree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleExpand}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      {files.length > 0 && (
        <div className="p-3 border-t border-zinc-800">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(fileCounts).map(([type, count]) => (
              <span 
                key={type} 
                className={cn(
                  'px-2 py-1 rounded-md',
                  type === 'frontend' && 'bg-blue-500/20 text-blue-300',
                  type === 'backend' && 'bg-green-500/20 text-green-300',
                  type === 'database' && 'bg-purple-500/20 text-purple-300',
                  type === 'config' && 'bg-yellow-500/20 text-yellow-300',
                  type === 'other' && 'bg-zinc-700 text-zinc-400',
                )}
              >
                {count} {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
