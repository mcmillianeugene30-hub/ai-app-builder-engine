import { Octokit } from '@octokit/rest'
import type { 
  GitConfig, 
  GitCommitRequest, 
  GitCommitResponse,
  GitRepoRequest,
  GitRepoResponse,
  GitStatus,
  GitFileChange 
} from '@/types/git'

let octokit: Octokit | null = null

export function initGitHub(token: string): void {
  octokit = new Octokit({ auth: token })
}

export function isGitHubInitialized(): boolean {
  return octokit !== null
}

export async function getGitHubStatus(): Promise<GitStatus> {
  if (!octokit) {
    return { isConnected: false, username: null, avatarUrl: null, repos: [] }
  }
  
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated()
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    })
    
    return {
      isConnected: true,
      username: user.login,
      avatarUrl: user.avatar_url,
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch || 'main',
        updatedAt: repo.updated_at || '',
      })),
    }
  } catch (error) {
    console.error('GitHub status error:', error)
    return { isConnected: false, username: null, avatarUrl: null, repos: [] }
  }
}

export async function createRepository(
  request: GitRepoRequest
): Promise<GitRepoResponse> {
  if (!octokit) {
    return { success: false, repoUrl: null, cloneUrl: null, error: 'GitHub not authenticated' }
  }
  
  try {
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: request.name,
      description: request.description,
      private: request.isPrivate,
      auto_init: false,
    })
    
    // Commit initial files if provided
    if (request.files.length > 0) {
      await commitFiles({
        message: 'Initial commit from AI App Builder',
        files: request.files,
      }, repo.owner.login, repo.name)
    }
    
    return {
      success: true,
      repoUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      repoUrl: null,
      cloneUrl: null,
      error: error instanceof Error ? error.message : 'Failed to create repository',
    }
  }
}

export async function commitFiles(
  request: GitCommitRequest,
  owner?: string,
  repo?: string
): Promise<GitCommitResponse> {
  if (!octokit) {
    return { success: false, sha: null, url: null, error: 'GitHub not authenticated' }
  }
  
  const targetOwner = owner || process.env.GITHUB_OWNER || ''
  const targetRepo = repo || process.env.GITHUB_REPO || ''
  
  if (!targetOwner || !targetRepo) {
    return { success: false, sha: null, url: null, error: 'Repository not configured' }
  }
  
  try {
    // Get the current commit SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `heads/${request.branch || 'main'}`,
    })
    
    const currentCommitSha = ref.object.sha
    
    // Get the tree
    const { data: commit } = await octokit.rest.git.getCommit({
      owner: targetOwner,
      repo: targetRepo,
      commit_sha: currentCommitSha,
    })
    
    const baseTreeSha = commit.tree.sha
    
    // Create blobs for each file
    const treeEntries = await Promise.all(
      request.files.map(async (file) => {
        if (file.operation === 'delete') {
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: null,
          }
        }
        
        const { data: blob } = await octokit.rest.git.createBlob({
          owner: targetOwner,
          repo: targetRepo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        })
        
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        }
      })
    )
    
    // Create new tree
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: targetOwner,
      repo: targetRepo,
      base_tree: baseTreeSha,
      tree: treeEntries,
    })
    
    // Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: targetOwner,
      repo: targetRepo,
      message: request.message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    })
    
    // Update ref
    await octokit.rest.git.updateRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `heads/${request.branch || 'main'}`,
      sha: newCommit.sha,
    })
    
    return {
      success: true,
      sha: newCommit.sha,
      url: newCommit.html_url,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      sha: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to commit',
    }
  }
}

export async function getRepositoryContents(
  owner: string,
  repo: string,
  path: string = ''
): Promise<{ name: string; type: string; content?: string }[]> {
  if (!octokit) return []
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    })
    
    if (Array.isArray(data)) {
      return data.map(item => ({
        name: item.name,
        type: item.type,
      }))
    }
    
    if ('content' in data && data.content) {
      return [{
        name: data.name,
        type: data.type,
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
      }]
    }
    
    return []
  } catch (error) {
    console.error('Failed to get repository contents:', error)
    return []
  }
}