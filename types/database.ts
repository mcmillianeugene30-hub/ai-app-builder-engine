export interface DatabaseSandboxState {
  isReady: boolean
  db: SQLJsDatabase | null
  error: string | null
}

export interface SQLJsDatabase {
  exec: (sql: string) => SQLJsResult[]
  run: (sql: string, params?: unknown[]) => SQLJsStatement
  prepare: (sql: string) => SQLJsStatement
  export: () => Uint8Array
  close: () => void
}

export interface SQLJsResult {
  columns: string[]
  values: unknown[][]
}

export interface SQLJsStatement {
  bind: (params?: unknown[]) => boolean
  step: () => boolean
  get: () => unknown[]
  getAsObject: () => Record<string, unknown>
  free: () => void
}

export interface DatabaseQuery {
  id: string
  sql: string
  timestamp: Date
  results?: SQLJsResult[]
  error?: string
  executionTimeMs: number
}

export interface DatabasePanelProps {
  schema: string
  isVisible: boolean
  onExecute: (query: DatabaseQuery) => void
}

export interface DatabaseHistoryProps {
  queries: DatabaseQuery[]
  onSelect: (query: DatabaseQuery) => void
  onClear: () => void
}
