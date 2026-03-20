import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Awareness } from 'y-protocols/awareness'
import type { 
  CollaborationConfig, 
  CollaborationState, 
  PeerInfo,
  UserAwareness,
  CursorPosition 
} from '@/types/collaboration'

export class CollaborationManager {
  private doc: Y.Doc
  private provider: WebrtcProvider | null = null
  private awareness: Awareness | null = null
  private config: CollaborationConfig
  private state: CollaborationState
  private listeners: Set<(state: CollaborationState) => void> = new Set()
  private fileMap: Y.Map<Y.Text>

  constructor(config: CollaborationConfig) {
    this.config = config
    this.doc = new Y.Doc()
    this.fileMap = this.doc.getMap('files')
    
    this.state = {
      isConnected: false,
      isConnecting: false,
      roomId: config.roomId,
      peers: [],
      awareness: new Map(),
      error: null,
    }
  }

  connect(): void {
    if (this.provider) return
    
    this.updateState({ isConnecting: true, error: null })
    
    try {
      this.provider = new WebrtcProvider(
        this.config.roomId,
        this.doc,
        {
          signaling: this.config.signalingServers,
        }
      )
      
      this.awareness = this.provider.awareness
      
      // Set local user info
      this.awareness.setLocalState({
        user: {
          id: this.generateUserId(),
          name: this.config.userName,
          color: this.config.userColor,
        },
      })
      
      // Listen for changes
      this.awareness.on('change', () => {
        this.updatePeersFromAwareness()
      })
      
      this.provider.on('status', (event: { status: 'connected' | 'disconnected' }) => {
        this.updateState({ 
          isConnected: event.status === 'connected',
          isConnecting: false,
        })
      })
      
      this.provider.on('connection-error', (error: Error) => {
        this.updateState({ 
          error: error.message,
          isConnecting: false,
        })
      })
      
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to connect',
        isConnecting: false,
      })
    }
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
      this.awareness = null
    }
    
    this.updateState({
      isConnected: false,
      isConnecting: false,
      peers: [],
      awareness: new Map(),
    })
  }

  private updatePeersFromAwareness(): void {
    if (!this.awareness) return
    
    const peers: PeerInfo[] = []
    const awarenessMap = new Map<number, UserAwareness>()
    
    this.awareness.getStates().forEach((state: unknown, clientId: number) => {
      const userState = state as UserAwareness | undefined
      
      if (userState?.user && clientId !== this.awareness?.clientID) {
        peers.push({
          id: userState.user.id,
          displayName: userState.user.name,
          color: userState.user.color,
          cursor: userState.cursor,
          isActive: true,
          lastSeen: new Date(),
        })
      }
      
      awarenessMap.set(clientId, userState || { user: { id: '', name: '', color: '' } })
    })
    
    this.updateState({ peers, awareness: awarenessMap })
  }

  updateCursor(cursor: CursorPosition): void {
    if (!this.awareness) return
    
    const currentState = this.awareness.getLocalState() as UserAwareness | undefined
    
    this.awareness.setLocalState({
      ...currentState,
      cursor,
    })
  }

  updateSelectedFile(fileId: string): void {
    if (!this.awareness) return
    
    const currentState = this.awareness.getLocalState() as UserAwareness | undefined
    
    this.awareness.setLocalState({
      ...currentState,
      selectedFile: fileId,
    })
  }

  syncFile(fileId: string, content: string): void {
    let yText = this.fileMap.get(fileId)
    
    if (!yText) {
      yText = new Y.Text()
      this.fileMap.set(fileId, yText)
    }
    
    // Only update if content is different
    if (yText.toString() !== content) {
      yText.delete(0, yText.length)
      yText.insert(0, content)
    }
  }

  getFileContent(fileId: string): string {
    const yText = this.fileMap.get(fileId)
    return yText?.toString() || ''
  }

  observeFile(fileId: string, callback: (content: string) => void): () => void {
    const yText = this.fileMap.get(fileId)
    
    if (!yText) {
      const newYText = new Y.Text()
      this.fileMap.set(fileId, newYText)
      
      const handler = () => callback(newYText.toString())
      newYText.observe(handler)
      return () => newYText.unobserve(handler)
    }
    
    const handler = () => callback(yText.toString())
    yText.observe(handler)
    return () => yText.unobserve(handler)
  }

  private generateUserId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private updateState(updates: Partial<CollaborationState>): void {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  subscribe(listener: (state: CollaborationState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state) // Initial state
    return () => this.listeners.delete(listener)
  }

  getState(): CollaborationState {
    return this.state
  }
}

// Generate a random color for user
export function generateUserColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF',
    '#F43F5E', '#14B8A6', '#8C9EFF', '#FF8A80', '#FFD180',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate a room ID
export function generateRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

// Default signaling servers (free public servers)
export const DEFAULT_SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
]