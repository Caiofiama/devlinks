'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { linkSchema, type LinkInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LinkFormProps {
  defaultValues?: Partial<LinkInput>
  onSubmit: (data: LinkInput) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export default function LinkForm({ defaultValues, onSubmit, onCancel, isEdit }: LinkFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LinkInput>({
    resolver: zodResolver(linkSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} placeholder="My Website" />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input id="url" {...register('url')} placeholder="https://example.com" />
        {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>}
      </div>
      <div>
        <Label htmlFor="icon">Icon (optional)</Label>
        <Input id="icon" {...register('icon')} placeholder="github, twitter, globe…" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving…' : isEdit ? 'Update Link' : 'Add Link'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
