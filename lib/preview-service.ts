import type { 
  ProjectFile, 
  CodeBundle, 
  SanitizedCode, 
  PreviewFramework 
} from '@/types/preview'

// Dangerous patterns to sanitize
const DANGEROUS_PATTERNS = [
  // eval and similar
  /\beval\s*\(/gi,
  /\bFunction\s*\(/gi,
  /\bnew\s+Function\s*\(/gi,
  // document.write (can break parent)
  /document\.write\s*\(/gi,
  /document\.writeln\s*\(/gi,
  // opener manipulation (tabnabbing)
  /window\.opener/gi,
  /window\.parent/gi,
  /window\.top/gi,
  // iframe breaking
  /iframe/gi,
  /frame/gi,
  // protocol handlers
  /javascript:/gi,
  /data:/gi,
  /vbscript:/gi,
  // cookie/local storage access to parent
  /document\.cookie/gi,
  /localStorage/gi,
  /sessionStorage/gi,
  // XHR/fetch to external (allow with caution)
  /fetch\s*\(\s*['"`]/gi,
  /XMLHttpRequest/gi,
]

// Check if code is safe
export function sanitizeCode(
  html: string,
  css: string,
  javascript: string
): SanitizedCode {
  const warnings: string[] = []
  let isSafe = true
  const combined = `${html} ${css} ${javascript}`

  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    const matches = combined.match(pattern)
    if (matches) {
      warnings.push(`Potentially unsafe pattern detected: ${pattern.source}`)
      isSafe = false
    }
  })

  // Sanitize HTML (basic)
  const sanitizedHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags from HTML
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, 'blocked:')

  // Sanitize CSS (basic)
  const sanitizedCss = css
    .replace(/expression\s*\(/gi, 'blocked(') // CSS expressions
    .replace(/@import\s+url\s*\(/gi, '/* @import blocked */')

  // Sanitize JS (wrap in try-catch, remove dangerous)
  const sanitizedJs = javascript
    .replace(/eval\s*\(/gi, 'console.log("eval blocked");(')
    .replace(/document\.write\s*\(/gi, 'console.log("document.write blocked");(')
    .replace(/window\.parent/gi, 'null /* parent access blocked */')
    .replace(/window\.top/gi, 'null /* top access blocked */')
    .replace(/window\.opener/gi, 'null /* opener access blocked */')

  return {
    html: sanitizedHtml,
    css: sanitizedCss,
    javascript: sanitizedJs,
    warnings,
    isSafe,
  }
}

// Detect framework from files
export function detectFramework(files: ProjectFile[]): PreviewFramework {
  const allContent = files.map(f => f.content).join(' ')
  const allNames = files.map(f => f.name).join(' ')

  // React detection
  if (
    allContent.includes('React') ||
    allContent.includes('react') ||
    allContent.includes('useState') ||
    allContent.includes('useEffect') ||
    allContent.includes('jsx') ||
    allContent.includes('tsx') ||
    allNames.includes('.tsx') ||
    allNames.includes('.jsx')
  ) {
    return 'react'
  }

  // Vue detection
  if (
    allContent.includes('Vue') ||
    allContent.includes('vue') ||
    allContent.includes('createApp') ||
    allNames.includes('.vue')
  ) {
    return 'vue'
  }

  // Svelte detection
  if (
    allContent.includes('Svelte') ||
    allNames.includes('.svelte')
  ) {
    return 'svelte'
  }

  // If has HTML files but no framework
  if (allNames.includes('.html')) {
    return 'html'
  }

  return 'unknown'
}

// Build code bundle from project files
export function buildCodeBundle(files: ProjectFile[]): CodeBundle {
  const framework = detectFramework(files)

  // Extract files by type
  const htmlFiles = files.filter(f => 
    f.language === 'html' || f.name.endsWith('.html')
  )
  const cssFiles = files.filter(f => 
    f.language === 'css' || f.language === 'scss' || 
    f.name.endsWith('.css') || f.name.endsWith('.scss')
  )
  const jsFiles = files.filter(f => 
    f.language === 'javascript' || f.language === 'typescript' ||
    f.name.endsWith('.js') || f.name.endsWith('.jsx') ||
    f.name.endsWith('.ts') || f.name.endsWith('.tsx')
  )

  // Combine content
  const html = htmlFiles.map(f => f.content).join('\n\n') || '<div id="root"></div>'
  const css = cssFiles.map(f => f.content).join('\n\n')
  const javascript = jsFiles.map(f => f.content).join('\n\n')

  // Check for React/Vue imports
  const hasReact = 
    javascript.includes('import React') ||
    javascript.includes('from "react"') ||
    javascript.includes("from 'react'") ||
    javascript.includes('useState') ||
    javascript.includes('useEffect')

  const hasVue = 
    javascript.includes('import { createApp }') ||
    javascript.includes('from "vue"') ||
    javascript.includes("from 'vue'")

  return {
    html,
    css,
    javascript,
    hasReact,
    hasVue,
    framework,
  }
}

// Generate preview HTML document
export function generatePreviewDocument(
  bundle: CodeBundle,
  sanitized: SanitizedCode
): string {
  const { framework, hasReact, hasVue } = bundle

  // Base CSP for iframe
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  // CDNs based on framework
  const reactScripts = hasReact ? `
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ` : ''

  const vueScripts = hasVue ? `
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  ` : ''

  // Error handler wrapper
  const errorHandler = `
    <script>
      window.onerror = function(msg, url, line, col, error) {
        console.error('Preview Error:', msg, 'at line', line);
        window.parent.postMessage({
          type: 'PREVIEW_ERROR',
          message: msg,
          line: line,
          col: col
        }, '*');
        return false;
      };
      
      window.onunhandledrejection = function(event) {
        console.error('Unhandled Promise Rejection:', event.reason);
        window.parent.postMessage({
          type: 'PREVIEW_ERROR',
          message: 'Unhandled Promise: ' + event.reason,
          line: 0
        }, '*');
      };
    </script>
  `

  // Build the full document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Preview</title>
  ${reactScripts}
  ${vueScripts}
  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      background: white;
    }
    
    /* User CSS */
    ${sanitized.css}
  </style>
  ${errorHandler}
</head>
<body>
  ${sanitized.html}
  
  <script>
    // Prevent access to parent window
    try {
      Object.defineProperty(window, 'parent', {
        get: () => window,
        set: () => {}
      });
      Object.defineProperty(window, 'top', {
        get: () => window,
        set: () => {}
      });
      Object.defineProperty(window, 'opener', {
        get: () => null,
        set: () => {}
      });
    } catch(e) {
      console.log('Sandbox active');
    }
    
    // User JavaScript
    try {
      ${sanitized.javascript}
    } catch(e) {
      console.error('Runtime Error:', e.message);
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        message: e.message,
        line: e.lineNumber || 0
      }, '*');
    }
  </script>
</body>
</html>`
}

// Render preview (main entry point)
export function renderPreview(files: ProjectFile[]): {
  html: string
  warnings: string[]
  framework: PreviewFramework
  isSafe: boolean
} {
  const bundle = buildCodeBundle(files)
  const sanitized = sanitizeCode(bundle.html, bundle.css, bundle.javascript)
  
  const previewDoc = generatePreviewDocument(bundle, sanitized)

  return {
    html: previewDoc,
    warnings: sanitized.warnings,
    framework: bundle.framework,
    isSafe: sanitized.isSafe,
  }
}