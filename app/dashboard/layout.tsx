import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  )
}
