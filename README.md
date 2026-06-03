# DevLinks

> Link-in-bio SaaS platform for developers. Free & Pro plans via Stripe.

**Live Demo:** https://devlinks.vercel.app _(placeholder)_

**Demo credentials:** `demo@devlinks.dev` / `Demo@123`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Neon + Prisma ORM |
| Auth | JWT + httpOnly cookies (jose) |
| Payments | Stripe Checkout, Webhooks, Customer Portal |
| UI | TailwindCSS + shadcn/ui |
| Forms | react-hook-form + Zod |
| Drag & Drop | @dnd-kit |
| Analytics | Recharts |
| Tests | Jest + ts-jest |

---

## Plans

| Feature | Free | Pro ($9/mo) |
|---|---|---|
| Links | 5 max | Unlimited |
| Themes | Default only | 6 themes |
| Analytics | — | Click charts |

---

## Local Development

### 1. Clone & install

```bash
git clone <repo>
cd devlinks
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your values
```

### 3. Push schema & seed

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Start dev server

```bash
npm run dev
```

### 5. Stripe CLI (webhooks)

Install the Stripe CLI:

```bash
# Windows
winget install Stripe.StripeCLI

# macOS
brew install stripe/stripe-cli/stripe
```

Login and forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret from the CLI output and update `STRIPE_WEBHOOK_SECRET` in `.env`.

### 6. Run tests

```bash
npm test
```

---

## Architectural Decisions

### Webhook raw body
`/api/stripe/webhook` uses `await req.text()` instead of `req.json()` to preserve the raw body required by `stripe.webhooks.constructEvent()` for HMAC signature verification. This route is explicitly excluded from the JWT middleware matcher.

### Subscription gating
Plan status is always verified server-side (never trusting client state). The `user.plan` field is the source of truth and is updated atomically with the Subscription record inside a `$transaction` on webhook events.

### JWT httpOnly cookies
Tokens are stored in httpOnly cookies (not localStorage) to prevent XSS access. The middleware validates the JWT on every protected route request using `jose` (Edge-compatible, no Node.js crypto dependency).

### Service layer
Business logic lives in `src/services/` (auth, links, stripe) — separate from API routes. This makes unit testing straightforward: mock Prisma/Stripe at the service boundary, not inside route handlers.
