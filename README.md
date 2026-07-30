# MovieChoice

> **Eliminate streaming decision fatigue with personalized recommendations in seconds.**

MovieChoice answers **"What should we watch tonight?"** by understanding who is watching, their mood, available time, and streaming subscriptions — then recommending the best movie or TV show they can watch right now. It feels like **talking to a trusted friend who knows every movie and every streaming service.**

---

## Product Overview

| Aspect | Detail |
|--------|--------|
| **Platform** | Mobile-first Progressive Web App (PWA) |
| **Core Experience** | Quick Pick — under 30 seconds to a recommendation |
| **Discovery** | Explore mode — collections, Friday Picks, hidden gems, trending |
| **Personalization** | Household profiles with taste signals (thumbs, ratings) |
| **AI Refinement** | Natural-language refinement on every screen |
| **Auth** | Google sign-in + Resend email magic-link |
| **Catalog** | TMDB (metadata + JustWatch availability) |
| **AI** | OpenAI (GPT-4o) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | MongoDB (Atlas) + Mongoose |
| **Auth** | NextAuth (Google + Resend) |
| **AI** | OpenAI (GPT-4o) |
| **Catalog** | TMDB API |
| **Email** | Resend |
| **Deployment** | Vercel |
| **PWA** | next-pwa |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- MongoDB Atlas account
- TMDB API key
- OpenAI API key
- Resend API key
- Google OAuth credentials

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd moviechoice

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/moviechoice

# NextAuth
NEXTAUTH_SECRET=<generate-random-secret>
NEXTAUTH_URL=http://localhost:3000

# TMDB
TMDB_API_READ_ACCESS_TOKEN=<your-tmdb-read-access-token>
TMDB_BASE_URL=https://api.themoviedb.org/3

# OpenAI
OPENAI_API_KEY=sk-<your-openai-api-key>
OPENAI_DEFAULT_MODEL=gpt-4o

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Resend (Email Magic-Link)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=admin@mail.thinkroman.com

# Cache
CACHE_TTL=3600
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

---

## Project Structure

```
moviechoice/
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── README.md                 # This file
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml            # Dependency lock file
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.ts            # Next.js configuration
├── public/                   # Static assets
│   ├── icons/                # PWA icons
│   └── manifest.json         # PWA manifest
├── docs/                     # Documentation
│   ├── DISCOVERY.md          # Product discovery decisions
│   ├── PRODUCT.md            # Product overview
│   ├── PRD.md                # Product requirements
│   ├── DECISIONS.md          # Decision log
│   ├── ARCHITECTURE.md       # System architecture
│   ├── DATABASE.md           # Database design
│   ├── API.md                # API contract
│   ├── USER_FLOWS.md         # User flows
│   ├── DESIGN_SYSTEM.md      # Design system
│   ├── AI_ARCHITECTURE.md    # AI architecture
│   ├── ROADMAP.md            # Implementation roadmap
│   └── TODO.md               # Actionable task list
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── ai/               # AI endpoints
│   │   ├── auth/             # NextAuth endpoints
│   │   ├── catalog/          # Catalog endpoints
│   │   ├── explore/          # Explore endpoints
│   │   ├── quick-pick/       # Quick Pick endpoint
│   │   ├── saved/            # Saved lists endpoints
│   │   ├── taste/            # Taste signal endpoints
│   │   └── user/             # User profile endpoints
│   ├── (app)/                # App routes
│   │   ├── explore/          # Explore page
│   │   ├── onboarding/       # Onboarding page
│   │   ├── quick-pick/       # Quick Pick page
│   │   └── settings/         # Settings page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── ai/                   # AI components
│   ├── explore/              # Explore components
│   ├── onboarding/           # Onboarding components
│   ├── profiles/             # Profile components
│   ├── pwa/                  # PWA components
│   ├── quick-pick/           # Quick Pick components
│   ├── saved/                # Saved list components
│   ├── taste/                # Taste signal components
│   └── ui/                   # Shared UI components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility libraries
│   ├── ai/                   # AI services
│   ├── catalog/              # Catalog provider
│   ├── recommendation/       # Recommendation engine
│   └── auth.ts               # NextAuth configuration
├── models/                   # Mongoose models
│   ├── CatalogCache.ts       # Catalog cache model
│   ├── Profile.ts            # Household profile model
│   ├── SavedList.ts          # Saved list model
│   └── TasteSignal.ts        # Taste signal model
└── types/                    # TypeScript type definitions
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [DISCOVERY.md](./docs/DISCOVERY.md) | Product discovery decisions (source of truth) |
| [PRODUCT.md](./docs/PRODUCT.md) | Product vision, mission, target users, principles |
| [PRD.md](./docs/PRD.md) | Product requirements organized by feature area |
| [DECISIONS.md](./docs/DECISIONS.md) | All approved product and architectural decisions |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, components, data flow |
| [DATABASE.md](./docs/DATABASE.md) | MongoDB schema, models, indexes |
| [API.md](./docs/API.md) | API contract — endpoints, request/response shapes |
| [USER_FLOWS.md](./docs/USER_FLOWS.md) | Detailed user flows (Quick Pick, Explore, onboarding) |
| [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | Design tokens, components, PWA design |
| [AI_ARCHITECTURE.md](./docs/AI_ARCHITECTURE.md) | AI interpretation, explanation, grounding |
| [ROADMAP.md](./docs/ROADMAP.md) | Phased implementation roadmap |
| [TODO.md](./docs/TODO.md) | Actionable task list |

---

## Deployment

### Vercel

1. Push to main branch
2. Vercel auto-deploys
3. Configure production environment variables in Vercel dashboard

### Environment Variables for Production

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://moviechoice.vercel.app` |
| `MONGODB_URI` | Production MongoDB connection string |
| `NEXTAUTH_SECRET` | Production random secret |
| `TMDB_API_READ_ACCESS_TOKEN` | Production TMDB API Read Access Token (Bearer authentication) |
| `OPENAI_API_KEY` | Production OpenAI API key |
| `GOOGLE_CLIENT_ID` | Production Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Production Google OAuth client secret |
| `RESEND_API_KEY` | Production Resend API key |
| `EMAIL_FROM` | `admin@mail.thinkroman.com` |
| `CACHE_TTL` | `3600` |

---

## Security

| Aspect | Approach |
|--------|----------|
| **Authentication** | NextAuth with Google OAuth + Resend email magic-link |
| **Authorization** | Profile-scoped API routes |
| **Data Encryption** | MongoDB at-rest encryption; TLS in transit |
| **API Security** | CORS restrictions, rate limiting, input validation (zod) |
| **Secrets** | Environment variables via Vercel; never hardcoded |

---

## License

Proprietary — ThinkRoman
