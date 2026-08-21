# kylamuirrealty.com

Kyla Muir · Utah County REALTOR® · Real Estate Essentials
Built by Muir Web Co. — static HTML on Vercel, Supabase for leads + listings.

---

## WHAT I NEED FROM YOU (blocking items)

**1. Real testimonials.** The fake placeholder quotes have been REMOVED and replaced
with a factual "Why Kyla" section. Publishing invented client reviews is an FTC
violation and a license risk, so I won't generate them. Send me 3–5 real ones —
from her Google reviews, Facebook recommendations, or texts clients sent her — with
first name + last initial and city, and permission to publish. I'll build the section.

**2. New listings + the price change.** Send addresses, prices, beds/baths/sqft, and
listing URLs — or just paste her UtahRealEstate links. See "Listings" below; you can
also enter them yourself in Supabase in about 60 seconds each.

**3. Her social URLs.** Instagram and YouTube are still `#` placeholders in the footer.
Facebook is live.

---

## Site structure

```
/                          homepage
/santaquin-realtor         <- local SEO
/payson-realtor
/spanish-fork-realtor
/salem-realtor
/springville-realtor
/mapleton-realtor
/sell-your-home            <- service SEO
/buy-a-home
/home-value-report
/sitemap.xml  /robots.txt
/api/lead.js               lead capture -> Supabase + email
/api/listings.js           listings feed <- Supabase (+ og:image cover photos)
```

Upload everything to the repo root, preserving folder names. Vercel serves
`/santaquin-realtor/index.html` at `/santaquin-realtor` automatically.

## Listings — how to add/edit

Supabase -> Table Editor -> `listings` -> Insert row:

| field | example | notes |
|---|---|---|
| title | `Payson 6-bed` | any short label |
| address | `302 S 1150 E, Payson, UT` | shown on card |
| price | `$547,000` | text, include the $ |
| beds / baths / sqft | `6` / `3` / `2996` | numbers only |
| listing_url | UtahRealEstate/Zillow page URL | **cover photo is pulled from this automatically** |
| featured | `true` | must be true to appear |
| sold | `false` | flip to true to retire it |

**To change a price:** edit the `price` cell on that row. Live within 6 hours (the
edge cache window), or instantly in a fresh incognito window.

The homepage no longer hardcodes any listings. If the table is empty, the section
shows a clean "see live listings" state instead of stale fake homes.

## SEO — what was built and what you do next

Built: unique title/meta/canonical/OG per page, `RealEstateAgent` + `FAQPage` +
`BreadcrumbList` schema, 670–750 words of unique local copy per city page, internal
linking hub (`/#areas`), sitemap, robots.

**Your next steps (these matter more than the code):**
1. **Google Business Profile** — claim/verify it for Kyla at google.com/business.
   This is the single biggest factor for "santaquin realtor" type searches. Category:
   Real Estate Agent. Add the site URL, real photos, service areas.
2. **Google Search Console** — add kylamuirrealty.com, verify, submit
   `https://www.kylamuirrealty.com/sitemap.xml`.
3. **Reviews** — ask past clients for Google reviews. Local ranking leans on them
   heavily, and they double as the testimonials this site needs.
4. **NAP consistency** — name, address, phone identical everywhere online.

Local SEO takes weeks to months, not days. The pages are the foundation; the
Business Profile and reviews are what actually move rankings.

## Photos in use
- `hero-car.jpg` — homepage hero (dissolves on scroll)
- `rosey-fin.jpg` — interlude band + subpage hero backgrounds
- `about-kyla.jpg` — About section
- (removed: the two contact-section photos and the 4 slideshow images)

## Deploy
Push to `main`. Vercel auto-deploys. Env vars needed (already set):
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, optionally `RESEND_API_KEY` + `NOTIFY_EMAIL`.
