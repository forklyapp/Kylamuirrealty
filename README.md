# Kyla Muir Realty — kylamuirrealty.com

Single-file site + serverless lead capture. Same stack as Pantreo, minus the app complexity.

## Deploy (15 min)

1. **GitHub repo** — push this folder as-is (`index.html`, `api/lead.js`, `supabase-setup.sql`).
2. **Vercel** — New Project → import repo. No build settings needed; it's static + one function.
3. **Domain** — In Vercel → Domains, add `kylamuirrealty.com`. Point DNS at the registrar
   (A record → 76.76.21.21, CNAME www → cname.vercel-dns.com — same as muirwebco.com).
4. **Supabase** — New project (free tier). SQL Editor → paste `supabase-setup.sql` → Run.
5. **Env vars** — Vercel → Settings → Environment Variables:
   - `SUPABASE_URL` — project URL
   - `SUPABASE_SERVICE_KEY` — service_role key (NOT the anon key)
   - `RESEND_API_KEY` + `NOTIFY_EMAIL=kylamuirrealty@gmail.com` — sign up at resend.com,
     verify the domain, so Kyla gets an instant email per lead. Do this — a lead she
     sees 3 days later is a dead lead.
6. Redeploy. Test every form. Check the `leads` table in Supabase.

## Before launch — REQUIRED

- [ ] **License number** in the footer (`[ADD LICENSE NUMBER]`). Utah Division of Real Estate
      requires brokerage identification in advertising — have Kyla's broker at
      Real Estate Essentials review/approve the site.
- [ ] **Replace testimonials** — the three quotes are PLACEHOLDERS. Publishing fake
      testimonials is an FTC violation and a license risk. Get 3 real ones with permission.
- [ ] **Replace trust-strip stats** (150+ / $40M+ / 5.0★) with her real numbers.
- [ ] **Headshot** — drop her photo into the About section (`<img>` swap is commented in the HTML).
- [ ] **Social links** — Instagram/Facebook URLs in the footer are stubs; YouTube handle is a guess — verify it.
- [ ] **Sample listings** — clearly badged as samples; replace or hide before launch.

## Rosey upgrade path

The hero currently uses a stylized SVG Bel Air I drew. When you get high-res photos of Rosey:
- Best: a clean side-profile shot → cut out background → the scroll effect becomes
  photo → cross-fade → traced outline (I'll trace the outline SVG from the actual photo
  so the silhouette matches perfectly).
- The scroll engine won't change; we just swap the art layers.

## Phase 2 (next build)

- `admin.html` — password-protected page where Kyla pastes a listing URL; a serverless
  function pulls OpenGraph title/image/price to prefill a listing, saved to the
  `listings` table (schema already exists). Site renders them automatically.
- Phase 3: paid listing slots for other agents (`agent` column is already there).
- IDX/MLS feed if she wants full search — requires broker sign-off + an IDX provider (paid).
