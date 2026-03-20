export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface AnalyticsDashboard {
  userId: string
  period: AnalyticsPeriod
  overview: AnalyticsOverview
  charts: AnalyticsChart[]
  tables: AnalyticsTable[]
  generatedAt: string
}

export interface AnalyticsOverview {
  totalProjects: number
  totalDeployments: number
  totalCreditsUsed: number
  totalStorageMB: number
  apiCalls: number
  activeCollaborations: number
  // Change from previous period
  changes: Record<string, { value: number; percentChange: number }>
}

export interface AnalyticsChart {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area'
  title: string
  labels: string[]
  datasets: AnalyticsDataset[]
}

export interface AnalyticsDataset {
  label: string
  data: number[]
  color?: string
}

export interface AnalyticsTable {
  id: string
  title: string
  columns: AnalyticsColumn[]
  rows: AnalyticsRow[]
}

export interface AnalyticsColumn {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'currency'
  sortable: boolean
}

export interface AnalyticsRow {
  id: string
  [key: string]: unknown
}

export interface UsageBreakdown {
  category: string
  creditsUsed: number
  percentage: number
  cost: number
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}
