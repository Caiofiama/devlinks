'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DndLinkList from '@/components/DndLinkList'
import LinkForm from '@/components/LinkForm'
import AnalyticsChart from '@/components/AnalyticsChart'
import ThemePicker from '@/components/ThemePicker'
import { Badge } from '@/components/ui/badge'
import type { LinkInput } from '@/lib/validations'

type Link = { id: string; title: string; url: string; icon: string | null; clickCount: number; order: number; createdAt: string }
type User = { id: string; username: string; name: string | null; plan: 'FREE' | 'PRO'; theme: string }

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editLink, setEditLink] = useState<Link | null>(null)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    const [userRes, linksRes] = await Promise.all([
      fetch('/api/user'),
      fetch('/api/links'),
    ])
    if (userRes.ok) setUser((await userRes.json() as { user: User }).user)
    if (linksRes.ok) setLinks((await linksRes.json() as { links: Link[] }).links)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  // Aplica o tema no <html> sempre que o user mudar
  useEffect(() => {
    if (!user) return
    const html = document.documentElement
    html.setAttribute('data-theme', user.theme)
    // Remove classe 'dark' do Tailwind se existir — usamos data-theme
    html.classList.remove('dark')
  }, [user?.theme])

  async function handleAdd(data: LinkInput) {
    setError('')
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setShowForm(false)
      await fetchData()
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? 'Failed to add link')
    }
  }

  async function handleEdit(data: LinkInput) {
    if (!editLink) return
    await fetch(`/api/links/${editLink.id}`, {  // eslint-disable-line @typescript-eslint/no-non-null-assertion
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setEditLink(null)
    await fetchData()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  async function handleReorder(ids: string[]) {
    await fetch('/api/links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  async function handleTheme(theme: string) {
    // Aplica imediatamente para feedback visual instantâneo
    document.documentElement.setAttribute('data-theme', theme)
    setUser((prev) => prev ? { ...prev, theme } : prev)

    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
  }

  const isPro = user?.plan === 'PRO'
  const atLimit = !isPro && links.length >= 5

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">My Links</h1>
            <Badge variant={isPro ? 'default' : 'secondary'}>{user?.plan ?? 'FREE'}</Badge>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={atLimit || showForm} size="sm">
            <Plus size={16} className="mr-1" />
            {atLimit ? 'Limit reached' : 'Add Link'}
          </Button>
        </div>

        {!isPro && (
          <p className="text-xs text-muted-foreground">{links.length}/5 links used on Free plan</p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {(showForm || editLink) && (
          <Card>
            <CardContent className="pt-6">
              <LinkForm
                defaultValues={editLink ? { title: editLink.title, url: editLink.url, icon: editLink.icon ?? undefined } : undefined}
                onSubmit={editLink ? handleEdit : handleAdd}
                onCancel={() => { setShowForm(false); setEditLink(null) }}
                isEdit={!!editLink}
              />
            </CardContent>
          </Card>
        )}

        {links.length > 0 ? (
          <DndLinkList
            links={links}
            onReorder={handleReorder}
            onEdit={(l) => { setEditLink(l); setShowForm(false) }}
            onDelete={handleDelete}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No links yet. Add your first link!</p>
        )}
      </div>

      <div className="space-y-4">
        {user && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{user.name ?? user.username}</p>
                <a
                  href={`/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  devlinks.dev/{user.username}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
              <CardContent>
                {!isPro && <p className="text-xs text-muted-foreground mb-3">Upgrade to PRO for more themes</p>}
                <ThemePicker current={user.theme} isPro={isPro} onSelect={handleTheme} />
              </CardContent>
            </Card>

            {isPro && (
              <Card>
                <CardHeader><CardTitle className="text-base">Analytics</CardTitle></CardHeader>
                <CardContent>
                  <AnalyticsChart links={links} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
