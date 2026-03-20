import { auth, currentUser } from '@clerk/nextjs'
import { supabaseAdmin } from './supabase'

export async function getCurrentUser() {
  const { userId } = auth()
  
  if (!userId) {
    return null
  }
  
  const user = await currentUser()
  
  if (!user) {
    return null
  }
  
  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress,
    name: `${user.firstName} ${user.lastName}`.trim(),
    image: user.imageUrl,
  }
}

export async function getUserId(): Promise<string | null> {
  const { userId } = auth()
  return userId
}

export async function requireAuth(): Promise<string> {
  const userId = await getUserId()
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  return userId
}

export async function syncUserToDatabase() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to sync user:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Failed to sync user:', error)
    return null
  }
}
