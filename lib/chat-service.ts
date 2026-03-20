import type { ChatMessage, ChatRequest, ChatResponse, ChatRole, ProjectFile } from '@/types/chat'

const SYSTEM_PROMPT = `You are an expert coding assistant helping a developer build applications in an AI-powered IDE.

When responding:
1. Be concise but thorough
2. Provide code examples when relevant
3. Explain the "why" behind your suggestions
4. Reference specific files or code when available
5. If suggesting edits, provide complete, working code
6. Use markdown formatting for code blocks with language tags

Context you'll receive:
- Current open files
- Current active file
- Project structure

You can:
- Answer questions about code
- Suggest improvements
- Debug errors
- Explain concepts
- Propose refactors
- Generate new code

Always consider the full project context when making suggestions.`

export async function sendChatMessage(
  request: ChatRequest,
  onChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  try {
    // Build context from open files
    const contextText = request.context.openFiles
      .map(f => `File: ${f.path}\n\`\`\`${f.language}\n${f.content.slice(0, 2000)}\n\`\`\``)
      .join('\n\n')
    
    const currentFileText = request.context.currentFile
      ? `CURRENT FILE:\n${request.context.currentFile.path}\n\`\`\`${request.context.currentFile.language}\n${request.context.currentFile.content}\n\`\`\``
      : ''
    
    const fullPrompt = `${SYSTEM_PROMPT}

PROJECT CONTEXT:
${contextText}

${currentFileText}

USER QUESTION:
${request.message}

${request.history.length > 0 ? `PREVIOUS CONVERSATION:\n${request.history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}` : ''}

Please respond:`

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: fullPrompt,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    let fullContent = ''
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullContent += chunk
      onChunk?.(fullContent)
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: fullContent,
      timestamp: new Date(),
      codeBlocks: extractCodeBlocks(fullContent),
    }

    return {
      success: true,
      message,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      message: null,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

function extractCodeBlocks(content: string): { language: string; code: string; filePath?: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: { language: string; code: string; filePath?: string }[] = []
  
  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text'
    const code = match[2].trim()
    
    // Try to extract file path from code comment or context
    const filePathMatch = code.match(/\/\/\s*File:\s*(.+)/) || 
                          code.match(/\/\*\s*File:\s*(.+)\*\//) ||
                          code.match(/#\s*File:\s*(.+)/)
    const filePath = filePathMatch ? filePathMatch[1] : undefined
    
    blocks.push({ language, code, filePath })
  }
  
  return blocks
}

export function parseEditSuggestion(content: string): { fileId: string; newContent: string } | null {
  // Look for patterns like "Edit file X:" or "Here's the updated code for Y:"
  const patterns = [
    /Edit\s+file\s+[`']?([^`']+)[`']?:\s*```[\s\S]*?```/i,
    /Update\s+[`']?([^`']+)[`']?\s*with:\s*```[\s\S]*?```/i,
    /Here's\s+the\s+updated\s+[`']?([^`']+)[`']?:\s*```[\s\S]*?```/i,
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      const fileId = match[1]
      const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/)
      if (codeMatch) {
        return { fileId, newContent: codeMatch[1] }
      }
    }
  }
  
  return null
}