# MovieChoice — Production Environment Checklist

Set these in **Vercel → Project → Settings → Environment Variables**. Never commit real values.

## Required

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (e.g. `moviechoice`) |
| `NEXTAUTH_SECRET` | Random 32+ char secret |
| `NEXTAUTH_URL` | Production URL (`https://your-domain`) |
| `OWNER_EMAIL` | Owner login email |
| `OWNER_PIN` | Owner 6-digit PIN |
| `TMDB_API_READ_ACCESS_TOKEN` | TMDB Bearer token |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` |
| `OPENAI_API_KEY` | Personalized pick blurbs |
| `RESEND_API_KEY` | Invite PIN emails |
| `EMAIL_FROM` | Verified Resend from-address |

## Recommended

| Variable | Purpose |
|----------|---------|
| `OPENAI_DEFAULT_MODEL` | Default `gpt-4o` |
| `OPENAI_MAX_TOKENS` | Default `1000` |
| `CACHE_TTL` | Catalog enrichment cache seconds (default `3600`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL for emails / PWA |

## After deploy

- [ ] Owner can sign in with email + PIN
- [ ] Invite a member; they get their own picks history
- [ ] Settings load on `/settings` and `/for-you`
- [ ] Add to Home Screen works on iPhone Safari
- [ ] Recommend Now returns movies + shows on selected services
