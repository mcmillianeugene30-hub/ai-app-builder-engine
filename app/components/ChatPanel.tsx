'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  MessageSquare, 
  Send, 
  Loader2,
  User,
  Bot,
  Paperclip,
  X,
  Copy,
  Check,
  Code,
  Edit3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendChatMessage, parseEditSuggestion } from '@/lib/chat-service'
import type { Project, ProjectFile } from '@/types/project'
import type { ChatMessage, ChatAttachment } from '@/types/chat'

export function ChatPanel({ 
  project, 
  currentFile, 
  openFiles,
  isVisible,
  onRequestEdit 
}: { 
  project: Project | null
  currentFile: ProjectFile | null
  openFiles: ProjectFile[]
  isVisible: boolean
  onRequestEdit: (fileId: string, newContent: string) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Focus input on mount
  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus()
    }
  }, [isVisible])
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
    setIsLoading(true)
    
    // Add placeholder for assistant
    const assistantId = `${Date.now()}-assistant`
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }])
    
    const response = await sendChatMessage(
      {
        message: input,
        context: {
          currentFile,
          openFiles,
          projectContext: project?.name,
        },
        history: messages,
      },
      (chunk) => {
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: chunk }
            : m
        ))
      }
    )
    
    if (response.success && response.message) {
      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, ...response.message, isStreaming: false }
          : m
      ))
      
      // Check for edit suggestions
      const edit = parseEditSuggestion(response.message.content)
      if (edit && currentFile && currentFile.id === edit.fileId) {
        // Could auto-apply or show suggestion
      }
    } else {
      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, content: 'Error: ' + (response.error || 'Failed to get response'), isStreaming: false }
          : m
      ))
    }
    
    setIsLoading(false)
  }, [input, attachments, messages, currentFile, openFiles, project, isLoading])
  
  const attachCurrentFile = () => {
    if (!currentFile) return
    
    const exists = attachments.some(a => a.fileId === currentFile.id)
    if (exists) return
    
    setAttachments(prev => [...prev, {
      type: 'file',
      fileId: currentFile.id,
      fileName: currentFile.name,
      content: currentFile.content,
    }])
  }
  
  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(a => a.fileId !== fileId))
  }
  
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }
  
  const applyEdit = (code: string) => {
    if (!currentFile) return
    onRequestEdit(currentFile.id, code)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  if (!isVisible) return null
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-zinc-100">AI Assistant</span>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ask me anything about your code!</p>
            <p className="text-xs mt-1">I can help with debugging, explanations, or improvements.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              message.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
            )}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className={cn(
              'flex-1 max-w-[80%]',
              message.role === 'user' ? 'text-right' : ''
            )}>
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {message.attachments.map((att) => (
                    <span 
                      key={att.fileId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                    >
                      <Code className="w-3 h-3" />
                      {att.fileName}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Message Content */}
              <div className={cn(
                'inline-block text-left text-sm whitespace-pre-wrap',
                message.role === 'user' 
                  ? 'bg-blue-600 text-white px-3 py-2 rounded-lg'
                  : 'text-zinc-300'
              )}>
                {message.content || (message.isStreaming && '...')}
                
                {/* Code Blocks */}
                {message.codeBlocks && message.codeBlocks.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.codeBlocks.map((block, i) => (
                      <div 
                        key={i}
                        className="bg-zinc-950 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-b border-zinc-700">
                          <span className="text-xs text-zinc-500">
                            {block.language}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => applyEdit(block.code)}
                              className="p-1 text-zinc-400 hover:text-purple-400"
                              title="Apply to current file"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => copyCode(block.code, `${message.id}-${i}`)}
                              className="p-1 text-zinc-400 hover:text-zinc-200"
                              title="Copy"
                            >
                              {copiedCode === `${message.id}-${i}` ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <pre className="p-3 text-xs text-zinc-300 overflow-x-auto">
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-zinc-700">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => (
              <span 
                key={att.fileId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded"
              >
                <Code className="w-3 h-3" />
                {att.fileName}
                <button
                  onClick={() => removeAttachment(att.fileId)}
                  className="ml-1 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question... (Shift+Enter for new line)"
              className="w-full px-3 py-2 pr-20 bg-zinc-800 text-zinc-100 text-sm rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
              rows={2}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button
                onClick={attachCurrentFile}
                disabled={!currentFile}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                title="Attach current file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}