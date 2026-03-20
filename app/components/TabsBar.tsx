'use client'

import { X, FileCode, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabsBarProps, OpenFile } from '@/types/editor'

function getFileIcon(file: OpenFile['file']) {
  switch (file.type) {
    case 'frontend':
      return <FileCode className="w-4 h-4 text-blue-400" />
    case 'backend':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'database':
      return <FileCode className="w-4 h-4 text-purple-400" />
    default:
      return <FileCode className="w-4 h-4 text-zinc-400" />
  }
}

export function TabsBar({
  openFiles,
  activeFileId,
  onSwitchFile,
  onCloseFile,
}: TabsBarProps) {
  if (openFiles.length === 0) {
    return null
  }

  return (
    <div className="flex items-center bg-zinc-950 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
      <div className="flex">
        {openFiles.map((openFile) => {
          const isActive = openFile.file.id === activeFileId
          
          return (
            <button
              key={openFile.file.id}
              onClick={() => onSwitchFile(openFile.file.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] text-sm transition-colors",
                "border-r border-zinc-800 relative",
                isActive 
                  ? "bg-zinc-900 text-zinc-100" 
                  : "bg-zinc-950 text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
              )}
            >
              {/* File icon */}
              {getFileIcon(openFile.file)}
              
              {/* File name */}
              <span className="truncate flex-1 text-left">
                {openFile.file.name}
              </span>
              
              {/* Dirty indicator */}
              {openFile.isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />
              )}
              
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseFile(openFile.file.id)
                }}
                className={cn(
                  "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-zinc-800 hover:text-red-400",
                  openFile.isDirty && "opacity-100"
                )}
                title="Close file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
