import { PrismaClient, Plan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Demo@123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@devlinks.dev' },
    update: {},
    create: {
      email: 'demo@devlinks.dev',
      password,
      username: 'demo',
      name: 'Demo User',
      bio: 'Full-stack developer & open source enthusiast',
      theme: 'dark',
      plan: Plan.PRO,
      links: {
        create: [
          { title: 'GitHub', url: 'https://github.com', icon: 'github', order: 0 },
          { title: 'Twitter / X', url: 'https://x.com', icon: 'twitter', order: 1 },
          { title: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', order: 2 },
          { title: 'YouTube', url: 'https://youtube.com', icon: 'youtube', order: 3 },
          { title: 'Portfolio', url: 'https://example.com', icon: 'globe', order: 4 },
          { title: 'Dev.to', url: 'https://dev.to', icon: 'code', order: 5 },
          { title: 'Instagram', url: 'https://instagram.com', icon: 'instagram', order: 6 },
          { title: 'Discord', url: 'https://discord.com', icon: 'message-circle', order: 7 },
        ],
      },
    },
  })

  console.log(`Seeded user: ${user.email} (username: ${user.username})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
