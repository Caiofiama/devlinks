import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/, 'Lowercase, numbers, _ and - only'),
  name: z.string().min(1).max(60).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const linkSchema = z.object({
  title: z.string().min(1).max(60),
  url: z.string().url(),
  icon: z.string().max(30).optional(),
})

export const reorderSchema = z.object({
  ids: z.array(z.string()),
})

export const settingsSchema = z.object({
  name: z.string().max(60).optional(),
  bio: z.string().max(160).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/).optional(),
})

export const themeSchema = z.object({
  theme: z.enum(['default', 'dark', 'purple', 'green', 'ocean', 'sunset']),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type LinkInput = z.infer<typeof linkSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
