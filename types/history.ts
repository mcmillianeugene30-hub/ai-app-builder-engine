import type { ProjectFile } from './project'

export interface VersionSnapshot {
  id: string
  projectId: string
  name: string
  description: string
  files: ProjectFile[]
  createdAt: Date
  createdBy: string
  parentSnapshotId?: string
  diff?: FileDiff[]
}

export interface FileDiff {
  fileId: string
  filePath: string
  operation: 'added' | 'modified' | 'deleted'
  additions: number
  deletions: number
  beforeContent?: string
  afterContent?: string
}

export interface HistoryState {
  snapshots: VersionSnapshot[]
  currentSnapshotId: string | null
  isLoading: boolean
  error: string | null
}

export interface HistoryPanelProps {
  projectId: string
  snapshots: VersionSnapshot[]
  currentSnapshotId: string | null
  isVisible: boolean
  onCreateSnapshot: (name: string, description: string) => void
  onRestoreSnapshot: (snapshotId: string) => void
  onCompare: (snapshotId1: string, snapshotId2: string) => void
}

export interface SnapshotCardProps {
  snapshot: VersionSnapshot
  isActive: boolean
  onRestore: () => void
  onViewDiff: () => void
}

export interface DiffViewProps {
  diff: FileDiff[]
  isVisible: boolean
  onClose: () => void
}

export interface AutoSaveConfig {
  enabled: boolean
  intervalMs: number
  maxSnapshots: number
}
