# MovieChoice — Production Environment Checklist

Set these in **Vercel → Project → Settings → Environment Variables**. Never commit real values.

## Required

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Full MongoDB Atlas connection string, including the database name in the path (e.g. `...mongodb.net/moviechoice?retryWrites=true&w=majority`). Must start with `mongodb://` or `mongodb+srv://`. **Do not wrap in quotes** in Vercel. **Do not use `MONGODB_DB`.** |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Random 32+ char secret |
| `NEXTAUTH_URL` / `AUTH_URL` | Production URL (`https://your-domain`) |
| `OWNER_EMAIL` | Owner login email |
| `OWNER_PIN` | Owner 6-digit PIN |
| `TMDB_API_READ_ACCESS_TOKEN` | TMDB Bearer token |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` |
| `OPENAI_API_KEY` | Personalized pick blurbs |
| `RESEND_API_KEY` | Invite PIN emails |
| `EMAIL_FROM` / `RESEND_FROM` | Verified Resend from-address |

### MONGODB_URI checklist

If Recommend Now / Invite show `Invalid scheme…`, open **Vercel → Settings → Environment Variables** and fix `MONGODB_URI`:

1. Value must look like: `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/moviechoice?retryWrites=true&w=majority`
2. Put the database name **in the URI path** (`/moviechoice`) — do not use `MONGODB_DB`
3. No leading/trailing quotes (`"..."` / `'...'`)
4. You can delete `MONGODB_DB` from Vercel if it exists — the app ignores it
5. Redeploy after saving


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
