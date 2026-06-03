'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Link2, BarChart2, Settings, CreditCard, LogOut } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">DevLinks</Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard"><Link2 size={16} className="mr-1" />Links</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/billing"><CreditCard size={16} className="mr-1" />Billing</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/settings"><Settings size={16} className="mr-1" />Settings</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={16} className="mr-1" />Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
