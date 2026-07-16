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
      if (rows.length) return res.status(200).json({ source: "supabase", listings: rows });
    }
  } catch (e) {
    // fall through
  }

  // Nothing in the database yet — the site falls back to its built-in list
  return res.status(200).json({ source: "none", listings: [] });
}
