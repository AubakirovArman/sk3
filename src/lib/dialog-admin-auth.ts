import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireDialogAdmin() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any)?.role !== 'dialog_admin') {
    return null
  }

  return session
}
