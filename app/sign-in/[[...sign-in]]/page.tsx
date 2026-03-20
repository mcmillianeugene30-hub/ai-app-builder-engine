import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            AI App Builder
          </h1>
          <p className="text-zinc-400">
            Sign in to start building
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
              headerTitle: 'text-zinc-100',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton: 'border-zinc-700 hover:bg-zinc-800',
              formFieldLabel: 'text-zinc-300',
              formFieldInput: 'bg-zinc-950 border-zinc-700 text-zinc-100',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
            },
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
