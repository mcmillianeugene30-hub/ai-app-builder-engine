'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  History, 
  GitCommit,
  RotateCcw,
  Eye,
  Clock,
  User,
  Check,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { 
  saveSnapshot, 
  getProjectSnapshots, 
  deleteSnapshot,
  compareSnapshots,
  autoSave 
} from '@/lib/history-service'
import type { Project, ProjectFile } from '@/types/project'
import type { VersionSnapshot, FileDiff } from '@/types/history'

export function HistoryPanel({ 
  projectId,
  currentFiles,
  isVisible,
  onRestore,
  onFilesChange
}: { 
  projectId: string
  currentFiles: ProjectFile[]
  isVisible: boolean
  onRestore: (files: ProjectFile[]) => void
  onFilesChange: () => void
}) {
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('')
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null)
  const [diff, setDiff] = useState<FileDiff[] | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  
  // Load snapshots
  useEffect(() => {
    if (!isVisible) return
    loadSnapshots()
  }, [isVisible, projectId])
  
  // Setup auto-save
  useEffect(() => {
    if (!isVisible) return
    
    const stopAutoSave = autoSave(projectId, currentFiles, 60000)
    return stopAutoSave
  }, [isVisible, projectId, currentFiles])
  
  const loadSnapshots = () => {
    const loaded = getProjectSnapshots(projectId)
    setSnapshots(loaded)
  }
  
  const createSnapshot = useCallback(() => {
    if (!newSnapshotName.trim()) return
    
    setIsLoading(true)
    
    saveSnapshot(
      projectId,
      currentFiles,
      newSnapshotName,
      newSnapshotDesc,
      snapshots[0]?.id // Use most recent as parent
    )
    
    setNewSnapshotName('')
    setNewSnapshotDesc('')
    setShowCreateForm(false)
    loadSnapshots()
    
    setIsLoading(false)
  }, [newSnapshotName, newSnapshotDesc, projectId, currentFiles, snapshots])
  
  const restore = useCallback((snapshotId: string) => {
    const files = getProjectSnapshots(projectId).find(s => s.id === snapshotId)?.files
    if (files) {
      onRestore(files)
      onFilesChange()
    }
  }, [projectId, onRestore, onFilesChange])
  
  const deleteSnap = useCallback((snapshotId: string) => {
    deleteSnapshot(projectId, snapshotId)
    loadSnapshots()
  }, [projectId])
  
  const viewDiff = useCallback((snapshotId: string) => {
    if (snapshots.length < 2) return
    
    const currentIndex = snapshots.findIndex(s => s.id === snapshotId)
    if (currentIndex === -1 || currentIndex >= snapshots.length - 1) return
    
    const prevId = snapshots[currentIndex + 1].id
    const comparison = compareSnapshots(prevId, snapshotId)
    
    setDiff(comparison)
    setShowDiff(true)
  }, [snapshots])
  
  if (!isVisible) return null
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <span className="font-medium text-zinc-100">Version History</span>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-500"
        >
          <Plus className="w-4 h-4" />
          Snapshot
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 bg-zinc-800 rounded-lg space-y-3">
            <input
              type="text"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder="Snapshot name"
              className="w-full px-3 py-2 bg-zinc-900 text-zinc-100 text-sm rounded border border-zinc-700 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={newSnapshotDesc}
              onChange={(e) => setNewSnapshotDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-zinc-900 text-zinc-100 text-sm rounded border border-zinc-700 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={createSnapshot}
                disabled={!newSnapshotName.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 text-sm rounded hover:bg-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Snapshots List */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">
            {snapshots.length} Snapshots
          </h3>
          
          {snapshots.map((snapshot, index) => (
            <div
              key={snapshot.id}
              className={cn(
                'border rounded-lg overflow-hidden',
                index === 0 ? 'border-amber-700/50 bg-amber-900/10' : 'border-zinc-700 bg-zinc-800'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 p-3">
                <button
                  onClick={() => setExpandedSnapshot(
                    expandedSnapshot === snapshot.id ? null : snapshot.id
                  )}
                >
                  {expandedSnapshot === snapshot.id ? (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">
                      {snapshot.name}
                    </span>
                    {index === 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-700 text-amber-200 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {snapshot.createdBy}
                    </span>
                    <span>{snapshot.files.length} files</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {snapshot.diff && snapshot.diff.length > 0 && (
                    <button
                      onClick={() => viewDiff(snapshot.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200"
                      title="View changes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => restore(snapshot.id)}
                    disabled={index === 0}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 disabled:opacity-30"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSnap(snapshot.id)}
                    disabled={index === 0}
                    className="p-1.5 text-zinc-400 hover:text-red-400 disabled:opacity-30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedSnapshot === snapshot.id && (
                <div className="px-4 pb-4 border-t border-zinc-700/50 pt-3">
                  {snapshot.description && (
                    <p className="text-sm text-zinc-400 mb-3">{snapshot.description}</p>
                  )}
                  
                  {snapshot.diff && snapshot.diff.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-zinc-500">Changes:</span>
                      <div className="flex flex-wrap gap-2">
                        {snapshot.diff.map((d) => (
                          <span
                            key={d.fileId}
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              d.operation === 'added' && 'bg-green-900/30 text-green-400',
                              d.operation === 'modified' && 'bg-amber-900/30 text-amber-400',
                              d.operation === 'deleted' && 'bg-red-900/30 text-red-400'
                            )}
                          >
                            {d.filePath}
                            {d.additions > 0 && (
                              <span className="ml-1 text-green-400">+{d.additions}</span>
                            )}
                            {d.deletions > 0 && (
                              <span className="ml-1 text-red-400">-{d.deletions}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {snapshots.length === 0 && (
            <div className="text-center py-8">
              <GitCommit className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">No snapshots yet</p>
              <p className="text-sm text-zinc-600 mt-1">
                Auto-saves every minute
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Diff Modal */}
      {showDiff && diff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h3 className="font-medium text-zinc-200">Changes</h3>
              <button
                onClick={() => setShowDiff(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {diff.map((d) => (
                <div key={d.fileId} className="border border-zinc-700 rounded overflow-hidden">
                  <div className={cn(
                    'px-3 py-2 text-sm font-medium',
                    d.operation === 'added' && 'bg-green-900/30 text-green-400',
                    d.operation === 'modified' && 'bg-amber-900/30 text-amber-400',
                    d.operation === 'deleted' && 'bg-red-900/30 text-red-400'
                  )}>
                    {d.filePath}
                    <span className="ml-2 text-xs">
                      {d.additions > 0 && <span className="text-green-400">+{d.additions} </span>}
                      {d.deletions > 0 && <span className="text-red-400">-{d.deletions}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}