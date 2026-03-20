import { authMiddleware, redirectToSignIn } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhook',
  ],
  apiRoutes: [
    '/api/projects',
    '/api/projects/(.*)',
    '/api/generate',
    '/api/chat',
    '/api/deploy',
  ],
  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
  },
})

export const config = {
  matcher: [
    '/((?!_next/image|_next/static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
