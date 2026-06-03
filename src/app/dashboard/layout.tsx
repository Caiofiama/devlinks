import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser()
  if (!auth) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">{children}</main>
    </div>
  )
}
