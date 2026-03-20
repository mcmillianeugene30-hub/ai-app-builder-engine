import initSqlJs from 'sql.js'
import type { SQLJsDatabase, SQLJsResult, DatabaseQuery } from '@/types/database'

let SQL: typeof initSqlJs | null = null
let dbInstance: SQLJsDatabase | null = null

export async function initDatabase(): Promise<SQLJsDatabase> {
  if (dbInstance) return dbInstance
  
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    })
  }
  
  dbInstance = new SQL.Database()
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function executeQuery(db: SQLJsDatabase, sql: string): DatabaseQuery {
  const startTime = performance.now()
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const results = db.exec(sql)
    const executionTimeMs = Math.round(performance.now() - startTime)
    
    return {
      id,
      sql,
      timestamp: new Date(),
      results,
      executionTimeMs,
    }
  } catch (error) {
    const executionTimeMs = Math.round(performance.now() - startTime)
    
    return {
      id,
      sql,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs,
    }
  }
}

export function exportDatabase(db: SQLJsDatabase): Uint8Array {
  return db.export()
}

export function importDatabase(data: Uint8Array): SQLJsDatabase {
  if (!SQL) throw new Error('SQL.js not initialized')
  return new SQL.Database(data)
}

export function getTables(db: SQLJsDatabase): string[] {
  try {
    const result = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    
    if (result.length > 0 && result[0].values) {
      return result[0].values.map(row => row[0] as string)
    }
    return []
  } catch {
    return []
  }
}

export function getTableSchema(db: SQLJsDatabase, tableName: string): SQLJsResult[] {
  try {
    return db.exec(`PRAGMA table_info(${tableName})`)
  } catch (error) {
    return [{
      columns: ['error'],
      values: [[error instanceof Error ? error.message : 'Unknown error']],
    }]
  }
}

export function runMigrations(db: SQLJsDatabase, migrations: string[]): string[] {
  const results: string[] = []
  
  migrations.forEach((migration, index) => {
    try {
      db.run(migration)
      results.push(`Migration ${index + 1}: Success`)
    } catch (error) {
      results.push(`Migration ${index + 1}: ${error instanceof Error ? error.message : 'Failed'}`)
    }
  })
  
  return results
}