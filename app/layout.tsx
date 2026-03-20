import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI App Builder Engine',
  description: 'Generate full-stack applications with AI',
  keywords: ['AI', 'code generation', 'full-stack', 'app builder'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#18181b',
          colorText: '#fafafa',
          colorInputBackground: '#27272a',
          colorInputText: '#fafafa',
          borderRadius: '0.5rem',
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-zinc-950 text-zinc-100`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
