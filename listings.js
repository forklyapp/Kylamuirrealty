// /api/listings.js — serves Kyla's featured listings to the site
//
// HOW AUTO-UPDATE WORKS, IN STAGES:
//
// STAGE 1 (live now): Supabase-managed.
//   Kyla (or you) adds/edits rows in the Supabase `listings` table
//   (Table Editor → listings). The site picks up changes automatically.
//   Columns used: title, address, price, beds, baths, sqft, photo_urls,
//   listing_url, featured, sold.
//
// STAGE 2 (true MLS auto-update): IDX feed.
//   UtahRealEstate.com (the Wasatch Front MLS) offers RESO Web API / IDX
//   feeds to member brokerages. Her broker at Real Estate Essentials signs
//   the IDX agreement, you get API credentials, and you replace the
//   fetchFromIDX stub below. Then her latest MLS listings flow in with zero
//   manual work. Do NOT scrape utahrealestate.com pages instead — it
//   violates their terms and can get her MLS access flagged.
//
// Env vars required: SUPABASE_URL, SUPABASE_SERVICE_KEY (already set for leads)

async function ogImage(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KylaMuirRealty/1.0)" },
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const head = (await r.text()).slice(0, 60000);
    const m =
      head.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      head.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
      head.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    return m ? m[1].replace(/&amp;/g, "&") : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // cache at the edge for 6h; serve stale while revalidating
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");

  // ---- Stage 2 stub: IDX/RESO feed (fill in when broker approves) ----
  // const idx = await fetchFromIDX();
  // if (idx) return res.status(200).json({ source: "idx", listings: idx });

  // ---- Stage 1: Supabase ----
  try {
    const url =
      `${process.env.SUPABASE_URL}/rest/v1/listings` +
      `?featured=eq.true&sold=eq.false&order=created_at.desc&limit=6` +
      `&select=title,address,price,beds,baths,sqft,photo_urls,listing_url`;
    const r = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
    });
    if (r.ok) {
      const rows = await r.json();
      if (rows.length) {
        // COVER PHOTOS: rows that have a listing_url but no photo get the
        // page's og:image — the same cover image the listing shows when
        // shared on Facebook/iMessage. Cached 6h with the response.
        await Promise.all(
          rows.map(async (row) => {
            if ((row.photo_urls && row.photo_urls.length) || !row.listing_url) return;
            const img = await ogImage(row.listing_url);
            if (img) row.photo_urls = [img];
          })
        );
        return res.status(200).json({ source: "supabase", listings: rows });
      }
    }
  } catch (e) {
    // fall through
  }

  // Nothing in the database yet — the site falls back to its built-in list
  return res.status(200).json({ source: "none", listings: [] });
}
