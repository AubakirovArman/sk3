import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.email && session.user.role === 'admin'
}

export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
}
