import * as Y from 'yjs'

export interface CollaborationState {
  isConnected: boolean
  isConnecting: boolean
  roomId: string | null
  peers: PeerInfo[]
  awareness: Map<number, UserAwareness>
  error: string | null
}

export interface PeerInfo {
  id: string
  displayName: string
  color: string
  cursor?: CursorPosition
  isActive: boolean
  lastSeen: Date
}

export interface CursorPosition {
  fileId: string
  line: number
  column: number
  selection?: { start: number; end: number }
}

export interface UserAwareness {
  user: {
    id: string
    name: string
    color: string
  }
  cursor?: CursorPosition
  selectedFile?: string
}

export interface CollaborationConfig {
  signalingServers: string[]
  roomId: string
  userName: string
  userColor: string
}

export interface CollaborationProviderProps {
  roomId: string
  projectId: string
  children: React.ReactNode
}

export interface PeerCursorProps {
  peer: PeerInfo
  isVisible: boolean
}

export interface CollaborationPanelProps {
  peers: PeerInfo[]
  isConnected: boolean
  onInvite: () => void
  isVisible: boolean
  onLeave: () => void
}
