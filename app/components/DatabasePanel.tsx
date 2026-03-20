'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  Database, 
  Play, 
  Table, 
  Clock, 
  Trash2, 
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  FileJson
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { initDatabase, executeQuery, getTables, getTableSchema, exportDatabase } from '@/lib/database-sandbox'
import type { SQLJsDatabase, DatabaseQuery } from '@/types/database'

export function DatabasePanel({ schema, isVisible }: { schema: string; isVisible: boolean }) {
  const [db, setDb] = useState<SQLJsDatabase | null>(null)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<DatabaseQuery[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableSchema, setTableSchema] = useState<unknown[][]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  
  // Initialize database
  useEffect(() => {
    if (!isVisible) return
    
    const init = async () => {
      try {
        const database = await initDatabase()
        
        // Run schema if provided
        if (schema) {
          const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)
          
          statements.forEach(stmt => {
            try {
              database.run(stmt)
            } catch (e) {
              console.warn('Schema statement failed:', e)
            }
          })
        }
        
        setDb(database)
        setTables(getTables(database))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database')
      }
    }
    
    init()
  }, [schema, isVisible])
  
  // Execute query
  const runQuery = useCallback(() => {
    if (!db || !query.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    const result = executeQuery(db, query)
    
    setHistory(prev => [result, ...prev])
    
    if (result.error) {
      setError(result.error)
    }
    
    // Refresh tables if DDL query
    if (/create|drop|alter/i.test(query)) {
      setTables(getTables(db))
    }
    
    setIsLoading(false)
  }, [db, query])
  
  // View table schema
  const viewTableSchema = useCallback((tableName: string) => {
    if (!db) return
    
    const schema = getTableSchema(db, tableName)
    setSelectedTable(tableName)
    setTableSchema(schema[0]?.values || [])
    setExpandedTables(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tableName)) {
        newSet.delete(tableName)
      } else {
        newSet.add(tableName)
      }
      return newSet
    })
  }, [db])
  
  // Export database
  const handleExport = useCallback(() => {
    if (!db) return
    
    const data = exportDatabase(db)
    const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'database.sqlite'
    link.click()
    URL.revokeObjectURL(url)
  }, [db])
  
  if (!isVisible) return null
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span className="font-medium text-zinc-100">Database Sandbox</span>
          {db && (
            <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded">
              SQLite (in-memory)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!db}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Tables */}
        <div className="w-48 border-r border-zinc-700 flex flex-col">
          <div className="p-3 border-b border-zinc-700">
            <span className="text-xs font-medium text-zinc-500 uppercase">Tables</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => viewTableSchema(table)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left transition-colors',
                  selectedTable === table
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                )}
              >
                {expandedTables.has(table) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Table className="w-4 h-4 text-emerald-400" />
                {table}
              </button>
            ))}
            {tables.length === 0 && (
              <div className="text-xs text-zinc-500 px-2 py-4 text-center">
                No tables yet
              </div>
            )}
          </div>
        </div>
        
        {/* Main - Query & Results */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Query Input */}
          <div className="p-4 border-b border-zinc-700">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    runQuery()
                  }
                }}
                placeholder="SELECT * FROM... (Cmd+Enter to run)"
                className="w-full h-24 bg-zinc-800 text-zinc-100 font-mono text-sm p-3 rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none"
                spellCheck={false}
              />
              <button
                onClick={runQuery}
                disabled={!db || !query.trim() || isLoading}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-200">{error}</span>
              </div>
            )}
            
            {/* Schema View */}
            {selectedTable && tableSchema.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-zinc-300">
                    Schema: {selectedTable}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">Column</th>
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">Not Null</th>
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">Default</th>
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">PK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSchema.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800">
                        <td className="px-3 py-2 text-zinc-300 font-mono">{(row[1] as string)}</td>
                        <td className="px-3 py-2 text-zinc-400">{(row[2] as string)}</td>
                        <td className="px-3 py-2 text-zinc-400">{(row[3] ? "YES" : "NO")}</td>
                        <td className="px-3 py-2 text-zinc-400">{(row[4] as string || "-")}</td>
                        <td className="px-3 py-2 text-zinc-400">{row[5] ? 'YES' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Query Results */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">Query History</span>
                  </div>
                  <button
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'border rounded-lg overflow-hidden',
                        item.error 
                          ? 'border-red-700 bg-red-900/20' 
                          : 'border-zinc-700 bg-zinc-800/50'
                      )}
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 bg-zinc-800/50">
                        <code className="text-xs text-zinc-400 font-mono truncate max-w-[60%]">
                          {item.sql.slice(0, 80)}{item.sql.length > 80 ? '...' : ''}
                        </code>
                        <span className="text-xs text-zinc-500">
                          {item.executionTimeMs}ms
                        </span>
                      </div>
                      
                      {item.error ? (
                        <div className="p-3 text-sm text-red-400">
                          {item.error}
                        </div>
                      ) : item.results && item.results.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-zinc-800">
                              <tr>
                                {item.results[0].columns.map((col) => (
                                  <th
                                    key={col}
                                    className="px-3 py-2 text-left text-zinc-400 font-medium"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {item.results[0].values.slice(0, 100).map((row, i) => (
                                <tr key={i} className="border-b border-zinc-800">
                                  {row.map((val, j) => (
                                    <td key={j} className="px-3 py-2 text-zinc-300 font-mono">
                                      {val === null ? (
                                        <span className="text-zinc-500">NULL</span>
                                      ) : typeof val === 'object' ? (
                                        <span className="text-amber-400">{JSON.stringify(val)}</span>
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {item.results[0].values.length > 100 && (
                            <div className="px-3 py-2 text-xs text-zinc-500 text-center">
                              Showing first 100 rows ({item.results[0].values.length} total)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-zinc-500">
                          Query executed successfully
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}