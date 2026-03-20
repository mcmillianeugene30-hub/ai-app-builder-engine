import type { DeployConfig, DeployResult, DeploymentStatus, DeploymentFile } from '@/types/deploy'

const VERCEL_API_URL = 'https://api.vercel.com/v13/deployments'

export async function deployToVercel(
  files: DeploymentFile[],
  config: DeployConfig
): Promise<DeployResult> {
  const token = process.env.VERCEL_TOKEN
  
  if (!token) {
    return {
      success: false,
      error: 'Vercel token not configured',
    }
  }
  
  try {
    // Build deployment payload
    const deploymentData = {
      name: config.name || 'ai-app',
      target: 'production',
      project: config.projectId,
      files: files.map(f => ({
        file: f.path,
        data: Buffer.from(f.content).toString('base64'),
        encoding: 'base64',
      })),
      env: config.env || {},
      public: config.public !== false,
    }
    
    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Deployment failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      url: data.url ? `https://${data.url}` : data.alias[0] || data.id,
      deploymentId: data.id,
      status: data.readyState === 'READY' ? 'ready' : 'building',
    }
  } catch (error) {
    console.error('Deployment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    }
  }
}

export async function getDeploymentStatus(
  deploymentId: string
): Promise<DeploymentStatus> {
  const token = process.env.VERCEL_TOKEN
  
  if (!token) {
    return { status: 'error', error: 'Token not configured' }
  }
  
  try {
    const response = await fetch(`${VERCEL_API_URL}/${deploymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch deployment status')
    }
    
    const data = await response.json()
    
    const statusMap: Record<string, DeploymentStatus['status']> = {
      'READY': 'ready',
      'BUILDING': 'building',
      'QUEUED': 'building',
      'ERROR': 'error',
      'CANCELED': 'error',
    }
    
    return {
      status: statusMap[data.readyState] || 'building',
      url: data.url ? `https://${data.url}` : data.alias?.[0],
      error: data.errorMessage,
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function prepareFilesForDeploy(
  frontend: string,
  backend: string,
  database: string
): Promise<DeploymentFile[]> {
  const files: DeploymentFile[] = []
  
  // Add package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: 'ai-generated-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
    }, null, 2),
  })
  
  // Add next.config.js
  files.push({
    path: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}
module.exports = nextConfig`,
  })
  
  // Add frontend files
  if (frontend) {
    files.push({
      path: 'app/page.tsx',
      content: frontend,
    })
    files.push({
      path: 'app/layout.tsx',
      content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
    })
  }
  
  // Add backend files
  if (backend) {
    files.push({
      path: 'app/api/route.ts',
      content: backend,
    })
  }
  
  // Add database files
  if (database) {
    files.push({
      path: 'database/schema.sql',
      content: database,
    })
  }
  
  return files
}
