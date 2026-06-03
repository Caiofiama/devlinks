'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, type SettingsInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type User = { username: string; name: string | null; bio: string | null; avatar: string | null }

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((d: { user: User }) => {
        reset({
          username: d.user.username,
          name: d.user.name ?? '',
          bio: d.user.bio ?? '',
          avatar: d.user.avatar ?? '',
        })
      })
  }, [reset])

  async function onSubmit(data: SettingsInput) {
    setError('')
    setSaved(false)
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSaved(true)
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? 'Failed to save')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input {...register('username')} placeholder="devname" />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <Label>Name</Label>
              <Input {...register('name')} placeholder="Your Name" />
            </div>
            <div>
              <Label>Bio</Label>
              <Input {...register('bio')} placeholder="A short bio" />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input {...register('avatar')} placeholder="https://example.com/photo.jpg" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && <p className="text-sm text-green-600">Settings saved!</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
