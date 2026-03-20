'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  Users, 
  Share2, 
  Link as LinkIcon, 
  Copy, 
  Check,
  AlertCircle,
  LogOut,
  User,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  CollaborationManager, 
  generateUserColor, 
  generateRoomId,
  DEFAULT_SIGNALING_SERVERS 
} from '@/lib/collaboration'
import type { CollaborationState, PeerInfo } from '@/types/collaboration'

export function CollaborationPanel({ project, isVisible }: { project: Project | null; isVisible: boolean }) {
  const [manager, setManager] = useState<CollaborationManager | null>(null)
  const [state, setState] = useState<CollaborationState | null>(null)
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('Developer')
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Subscribe to state changes
  useEffect(() => {
    if (!manager) return
    
    const unsubscribe = manager.subscribe((newState) => {
      setState(newState)
    })
    
    return unsubscribe
  }, [manager])
  
  const connect = useCallback(() => {
    if (!roomId.trim()) return
    
    setIsConnecting(true)
    
    const newManager = new CollaborationManager({
      roomId,
      userName,
      userColor: generateUserColor(),
      signalingServers: DEFAULT_SIGNALING_SERVERS,
    })
    
    newManager.connect()
    setManager(newManager)
    setIsConnecting(false)
  }, [roomId, userName])
  
  const disconnect = useCallback(() => {
    manager?.disconnect()
    setManager(null)
    setState(null)
  }, [manager])
  
  const generateNewRoom = () => {
    setRoomId(generateRoomId())
  }
  
  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (!isVisible) return null
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span className="font-medium text-zinc-100">Collaboration</span>
          {state?.isConnected && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-400 rounded">
              <Circle className="w-2 h-2 fill-current" />
              Live
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!state?.isConnected ? (
          /* Connect Form */
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">
                Join or Create Room
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 text-zinc-100 text-sm rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Room ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID or generate new"
                      className="flex-1 px-3 py-2 bg-zinc-900 text-zinc-100 text-sm rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={generateNewRoom}
                      className="px-3 py-2 bg-zinc-700 text-zinc-300 text-sm rounded hover:bg-zinc-600"
                    >
                      New
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={connect}
                  disabled={!roomId.trim() || isConnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Join Room
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <h4 className="text-xs font-medium text-zinc-500 mb-2">How it works</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Share your room ID with teammates</li>
                <li>• Edit files together in real-time</li>
                <li>• See each other&apos;s cursors</li>
                <li>• Changes sync automatically</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Connected State */
          <>
            {/* Room Info */}
            <div className="p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                  <span className="text-sm font-medium text-indigo-300">
                    Connected to Room
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-3 h-3" />
                  Leave
                </button>
              </div>
              
              <div className="p-2 bg-zinc-900 rounded font-mono text-xs text-zinc-400">
                {state?.roomId}
              </div>
              
              <button
                onClick={copyRoomLink}
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
            </div>
            
            {/* Connected Users */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">In Room ({state?.peers.length || 0})</h3>
              
              <div className="space-y-1">
                {/* Self */}
                <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-zinc-200">{userName}</span>
                    <span className="text-xs text-zinc-500 ml-2">(You)</span>
                  </div>
                </div>
                
                {/* Peers */}
                {state?.peers.map((peer) => (
                  <div 
                    key={peer.id}
                    className="flex items-center gap-3 p-2 bg-zinc-800 rounded"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: peer.color }}
                    >
                      <span className="text-white text-xs font-medium">
                        {peer.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-zinc-200">{peer.displayName}</span>
                      {peer.isActive && (
                        <span className="text-xs text-green-400 ml-2">● active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Error */}
        {state?.error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-200">{state.error}</span>
          </div>
        )}
      </div>
    </div>
  )
}