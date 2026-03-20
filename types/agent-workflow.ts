import type { Project, ProjectFile } from './project'

export type AgentPhase = 'planning' | 'development' | 'production' | 'deployment'

export interface Agent {
  id: string
  name: string
  phase: AgentPhase
  role: string
  systemPrompt: string
  icon: string
  color: string
}

export interface AgentTask {
  id: string
  agentId: string
  phase: AgentPhase
  input: string
  output?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  dependencies: string[] // Task IDs that must complete first
  tokensUsed: number
  duration: number
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface AgentWorkflow {
  id: string
  projectId: string
  userId: string
  initialPrompt: string
  phases: AgentPhase[]
  tasks: AgentTask[]
  currentPhase: AgentPhase
  overallProgress: number
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused'
  result?: AgentWorkflowResult
  createdAt: string
  updatedAt: string
}

export interface AgentWorkflowResult {
  frontend: ProjectFile[]
  backend: ProjectFile[]
  database: ProjectFile[]
  documentation: ProjectFile[]
  deploymentConfig: ProjectFile[]
  summary: string
  totalTokens: number
  totalDuration: number
}

export interface AgentMessage {
  id: string
  workflowId: string
  fromAgentId: string
  toAgentId?: string
  type: 'request' | 'response' | 'broadcast' | 'handoff'
  content: string
  metadata?: Record<string, any>
  createdAt: string
}

// Agent definitions
export const AGENTS: Agent[] = [
  // PLANNING PHASE
  {
    id: 'architect',
    name: 'Solution Architect',
    phase: 'planning',
    role: 'Designs system architecture and technology stack',
    systemPrompt: `You are an expert Solution Architect. Your job is to:
1. Analyze user requirements
2. Design system architecture
3. Choose appropriate tech stack
4. Define data models and API structure
5. Plan component hierarchy

Output: Architecture document with diagrams, tech stack decisions, and implementation plan.`,
    icon: 'Compass',
    color: '#3b82f6'
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    phase: 'planning',
    role: 'Defines features, user flows, and acceptance criteria',
    systemPrompt: `You are an expert Product Manager. Your job is to:
1. Define product features
2. Create user stories
3. Design user flows
4. Set acceptance criteria
5. Prioritize MVP features

Output: Product requirements document with user stories, flows, and feature list.`,
    icon: 'Target',
    color: '#8b5cf6'
  },
  
  // DEVELOPMENT PHASE
  {
    id: 'frontend-dev',
    name: 'Frontend Developer',
    phase: 'development',
    role: 'Implements UI components and frontend logic',
    systemPrompt: `You are an expert Frontend Developer. Your job is to:
1. Implement React components
2. Create responsive layouts
3. Add state management
4. Style with Tailwind CSS
5. Add animations and interactions

Output: Production-ready React components with TypeScript.`,
    icon: 'Layout',
    color: '#10b981'
  },
  {
    id: 'backend-dev',
    name: 'Backend Developer',
    phase: 'development',
    role: 'Builds API routes and server logic',
    systemPrompt: `You are an expert Backend Developer. Your job is to:
1. Create API routes
2. Implement business logic
3. Set up authentication
4. Handle data validation
5. Add error handling

Output: Production-ready API routes with proper error handling.`,
    icon: 'Server',
    color: '#f59e0b'
  },
  {
    id: 'database-dev',
    name: 'Database Engineer',
    phase: 'development',
    role: 'Designs and implements database schema',
    systemPrompt: `You are an expert Database Engineer. Your job is to:
1. Design database schema
2. Create migrations
3. Write queries
4. Optimize performance
5. Add indexes

Output: Database schema, migrations, and optimized queries.`,
    icon: 'Database',
    color: '#6366f1'
  },
  
  // PRODUCTION PHASE
  {
    id: 'security-engineer',
    name: 'Security Engineer',
    phase: 'production',
    role: 'Audits and secures the application',
    systemPrompt: `You are an expert Security Engineer. Your job is to:
1. Audit for vulnerabilities
2. Add security headers
3. Implement input validation
4. Sanitize outputs
5. Check for injection attacks
6. Add rate limiting

Output: Security audit report and fixes applied.`,
    icon: 'Shield',
    color: '#ef4444'
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    phase: 'production',
    role: 'Optimizes performance and efficiency',
    systemPrompt: `You are an expert Performance Engineer. Your job is to:
1. Optimize bundle size
2. Add code splitting
3. Implement caching
4. Optimize images
5. Add lazy loading
6. Check Core Web Vitals

Output: Performance optimizations and metrics.`,
    icon: 'Zap',
    color: '#eab308'
  },
  {
    id: 'qa-engineer',
    name: 'QA Engineer',
    phase: 'production',
    role: 'Tests and validates the application',
    systemPrompt: `You are an expert QA Engineer. Your job is to:
1. Write unit tests
2. Create integration tests
3. Test edge cases
4. Validate accessibility
5. Cross-browser testing
6. Document bugs

Output: Test suite with coverage report.`,
    icon: 'CheckCircle',
    color: '#22c55e'
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    phase: 'production',
    role: 'Sets up CI/CD and infrastructure',
    systemPrompt: `You are an expert DevOps Engineer. Your job is to:
1. Create CI/CD pipelines
2. Set up environment configs
3. Configure monitoring
4. Set up logging
5. Create Docker files
6. Document deployment

Output: CI/CD config, Docker files, and deployment docs.`,
    icon: 'GitBranch',
    color: '#ec4899'
  },
  
  // DEPLOYMENT PHASE
  {
    id: 'deployment-engineer',
    name: 'Deployment Engineer',
    phase: 'deployment',
    role: 'Deploys application to production',
    systemPrompt: `You are an expert Deployment Engineer. Your job is to:
1. Prepare production build
2. Configure environment variables
3. Deploy to hosting platform
4. Set up custom domain
5. Configure SSL
6. Verify deployment health

Output: Live deployment URL and health check results.`,
    icon: 'Rocket',
    color: '#06b6d4'
  },
]

// Phase definitions
export const AGENT_PHASES: { [key in AgentPhase]: { name: string; description: string; order: number } } = {
  planning: {
    name: 'Planning',
    description: 'Architecture design and requirements',
    order: 1
  },
  development: {
    name: 'Development',
    description: 'Code implementation',
    order: 2
  },
  production: {
    name: 'Production Ready',
    description: 'Security, performance, testing',
    order: 3
  },
  deployment: {
    name: 'Deployment',
    description: 'Go live',
    order: 4
  }
}
