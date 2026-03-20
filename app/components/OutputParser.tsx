'use client'

import { useState } from 'react'
import { Check, Copy, Database, FileCode, Server, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatLatency } from '@/lib/utils'
import type { OutputParserProps } from '@/types'

type Tab = 'frontend' | 'backend' | 'database'

export function OutputParser({ data, error, loading = false }: OutputParserProps) {
  const [activeTab, setActiveTab] = useState<Tab>('frontend')
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null)

  const handleCopy = async (tab: Tab, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">AI is generating your app...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium text-red-900">Generation failed</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <FileCode className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            Generated code will appear here
          </p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'frontend', label: 'Frontend', icon: <FileCode className="h-4 w-4" /> },
    { id: 'backend', label: 'Backend', icon: <Server className="h-4 w-4" /> },
    { id: 'database', label: 'Database', icon: <Database className="h-4 w-4" /> },
  ]

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white overflow-hidden animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium',
              'border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => handleCopy(activeTab, data[activeTab])}
          className={cn(
            'flex items-center gap-1 px-4 py-3 text-sm',
            'text-gray-600 hover:text-gray-900 transition-colors'
          )}
        >
          {copiedTab === activeTab ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        <pre className="max-h-[500px] overflow-auto p-4 text-sm">
          <code className="font-mono text-gray-800 whitespace-pre-wrap">
            {data[activeTab]}
          </code>
        </pre>
      </div>
    </div>
  )
}
