import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

export default async function Home() {
  const auth = await getAuthUser()
  redirect(auth ? '/dashboard' : '/login')
}
