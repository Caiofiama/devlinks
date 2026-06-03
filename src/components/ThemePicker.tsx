'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

const THEMES = [
  { id: 'default', label: 'Default', color: 'bg-white border', proOnly: false },
  { id: 'dark', label: 'Dark', color: 'bg-gray-900', proOnly: true },
  { id: 'purple', label: 'Purple', color: 'bg-purple-600', proOnly: true },
  { id: 'green', label: 'Green', color: 'bg-green-600', proOnly: true },
  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-600', proOnly: true },
  { id: 'sunset', label: 'Sunset', color: 'bg-orange-500', proOnly: true },
] as const

type ThemeId = (typeof THEMES)[number]['id']

interface ThemePickerProps {
  current: string
  isPro: boolean
  onSelect: (theme: string) => Promise<void>
}

export default function ThemePicker({ current, isPro, onSelect }: ThemePickerProps) {
  const [saving, setSaving] = useState(false)

  async function handleSelect(theme: ThemeId, proOnly: boolean) {
    if (proOnly && !isPro) return
    setSaving(true)
    await onSelect(theme)
    setSaving(false)
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEMES.map(({ id, label, color, proOnly }) => {
        const locked = proOnly && !isPro
        return (
          <button
            key={id}
            onClick={() => handleSelect(id, proOnly)}
            disabled={saving || locked}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-lg p-2 border-2 transition-all',
              current === id ? 'border-primary' : 'border-transparent hover:border-muted-foreground',
              locked && 'opacity-60 cursor-not-allowed'
            )}
          >
            <div className={cn('h-10 w-full rounded', color)} />
            <span className="text-xs font-medium">{label}</span>
            {locked && (
              <span className="absolute top-1 right-1">
                <Lock size={10} className="text-muted-foreground" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
