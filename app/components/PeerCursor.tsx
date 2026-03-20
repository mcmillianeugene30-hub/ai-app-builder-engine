'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PeerInfo } from '@/types/collaboration'

export function PeerCursor({ peer, isVisible }: { peer: PeerInfo; isVisible: boolean }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    if (!peer.cursor || !isVisible) return
    
    // In a real implementation, this would calculate exact pixel position
    // based on line height and character width of the editor
    const lineHeight = 24
    const charWidth = 9.6
    
    setPosition({
      x: peer.cursor.column * charWidth,
      y: peer.cursor.line * lineHeight,
    })
  }, [peer.cursor, isVisible])
  
  if (!isVisible || !peer.cursor) return null
  
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Cursor */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="absolute -left-1 -top-1"
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 00-.85.35z"
          fill={peer.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Label */}
      <div
        className="absolute left-4 top-0 px-2 py-0.5 text-xs text-white rounded whitespace-nowrap"
        style={{ backgroundColor: peer.color }}
      >
        {peer.displayName}
      </div>
    </div>
  )
}
