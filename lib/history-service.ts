import type { ProjectFile, VersionSnapshot, FileDiff } from '@/types/history'

const STORAGE_KEY = 'ai-app-builder-history'
const MAX_LOCAL_SNAPSHOTS = 50

export function saveSnapshot(
  projectId: string,
  files: ProjectFile[],
  name: string,
  description: string,
  parentSnapshotId?: string
): VersionSnapshot {
  const snapshot: VersionSnapshot = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    name,
    description,
    files: JSON.parse(JSON.stringify(files)), // Deep clone
    createdAt: new Date(),
    createdBy: 'user',
    parentSnapshotId,
  }
  
  // Calculate diff if parent exists
  if (parentSnapshotId) {
    const parent = getSnapshotById(parentSnapshotId)
    if (parent) {
      snapshot.diff = calculateDiff(parent.files, files)
    }
  }
  
  // Save to localStorage
  const history = getHistory()
  const projectHistory = history[projectId] || []
  
  projectHistory.unshift(snapshot)
  
  // Limit snapshots
  if (projectHistory.length > MAX_LOCAL_SNAPSHOTS) {
    projectHistory.splice(MAX_LOCAL_SNAPSHOTS)
  }
  
  history[projectId] = projectHistory
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  
  return snapshot
}

export function getProjectSnapshots(projectId: string): VersionSnapshot[] {
  const history = getHistory()
  return history[projectId] || []
}

export function getSnapshotById(snapshotId: string): VersionSnapshot | null {
  const history = getHistory()
  
  for (const projectId in history) {
    const snapshot = history[projectId].find(s => s.id === snapshotId)
    if (snapshot) return snapshot
  }
  
  return null
}

export function restoreSnapshot(snapshotId: string): ProjectFile[] | null {
  const snapshot = getSnapshotById(snapshotId)
  if (!snapshot) return null
  
  return JSON.parse(JSON.stringify(snapshot.files))
}

export function deleteSnapshot(projectId: string, snapshotId: string): boolean {
  const history = getHistory()
  const projectHistory = history[projectId]
  
  if (!projectHistory) return false
  
  const index = projectHistory.findIndex(s => s.id === snapshotId)
  if (index === -1) return false
  
  projectHistory.splice(index, 1)
  history[projectId] = projectHistory
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  
  return true
}

export function compareSnapshots(
  snapshotId1: string,
  snapshotId2: string
): FileDiff[] {
  const snapshot1 = getSnapshotById(snapshotId1)
  const snapshot2 = getSnapshotById(snapshotId2)
  
  if (!snapshot1 || !snapshot2) {
    return []
  }
  
  return calculateDiff(snapshot1.files, snapshot2.files)
}

export function autoSave(
  projectId: string,
  files: ProjectFile[],
  intervalMs: number = 60000
): () => void {
  let lastSaveTime = Date.now()
  let lastContentHash = hashFiles(files)
  
  const interval = setInterval(() => {
    const currentHash = hashFiles(files)
    
    // Only save if content changed
    if (currentHash !== lastContentHash) {
      const date = new Date()
      saveSnapshot(
        projectId,
        files,
        `Auto-save ${date.toLocaleTimeString()}`,
        'Automatic snapshot'
      )
      lastSaveTime = Date.now()
      lastContentHash = currentHash
    }
  }, intervalMs)
  
  return () => clearInterval(interval)
}

function calculateDiff(oldFiles: ProjectFile[], newFiles: ProjectFile[]): FileDiff[] {
  const diffs: FileDiff[] = []
  const oldMap = new Map(oldFiles.map(f => [f.id, f]))
  const newMap = new Map(newFiles.map(f => [f.id, f]))
  
  // Find added and modified files
  for (const [id, newFile] of newMap) {
    const oldFile = oldMap.get(id)
    
    if (!oldFile) {
      // Added
      diffs.push({
        fileId: id,
        filePath: newFile.path,
        operation: 'added',
        additions: countLines(newFile.content),
        deletions: 0,
        afterContent: newFile.content,
      })
    } else if (oldFile.content !== newFile.content) {
      // Modified
      const { additions, deletions } = countLineChanges(oldFile.content, newFile.content)
      diffs.push({
        fileId: id,
        filePath: newFile.path,
        operation: 'modified',
        additions,
        deletions,
        beforeContent: oldFile.content,
        afterContent: newFile.content,
      })
    }
  }
  
  // Find deleted files
  for (const [id, oldFile] of oldMap) {
    if (!newMap.has(id)) {
      diffs.push({
        fileId: id,
        filePath: oldFile.path,
        operation: 'deleted',
        additions: 0,
        deletions: countLines(oldFile.content),
        beforeContent: oldFile.content,
      })
    }
  }
  
  return diffs
}

function countLines(content: string): number {
  return content.split('\n').length
}

function countLineChanges(oldContent: string, newContent: string): { additions: number; deletions: number } {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  
  // Simple diff counting (in production, use a proper diff library)
  const maxLen = Math.max(oldLines.length, newLines.length)
  let additions = 0
  let deletions = 0
  
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      additions++
    } else if (i >= newLines.length) {
      deletions++
    } else if (oldLines[i] !== newLines[i]) {
      // Simplified - count both as changed
      deletions++
      additions++
    }
  }
  
  return { additions, deletions }
}

function hashFiles(files: ProjectFile[]): string {
  return files
    .map(f => `${f.id}:${f.content.length}:${f.updatedAt}`)
    .sort()
    .join('|')
}

function getHistory(): Record<string, VersionSnapshot[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}