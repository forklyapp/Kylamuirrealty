// /api/lead.js — Vercel serverless function
// Captures leads from all site forms:
//  1. Inserts the lead into Supabase (table: leads)
//  2. Emails Kyla instantly via Resend (optional but STRONGLY recommended — speed to lead wins deals)
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_URL          e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  service_role key (Settings → API) — server-side only, never in client code
// Optional:
//   RESEND_API_KEY        from resend.com (free tier: 100 emails/day, plenty)
//   NOTIFY_EMAIL          kylamuirrealty@gmail.com

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const b = req.body || {};

  // Honeypot — bots fill hidden "company" field
  if (b.company) return res.status(200).json({ ok: true });

  const type = String(b.type || "contact").slice(0, 40);
  const name = String(b.name || "").slice(0, 120).trim();
  const phone = String(b.phone || "").slice(0, 60).trim();
  const email = String(b.email || "").slice(0, 120).trim();

  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: "Name and a phone or email are required." });
  }

  // Everything else (funnel answers, address, message, source URL) goes in payload
  const { type: _t, name: _n, phone: _p, email: _e, company: _c, ...payload } = b;

  const errors = [];

  // 1) Store in Supabase
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ type, name, phone, email, payload }),
    });
    if (!r.ok) errors.push(`supabase:${r.status}`);
  } catch (e) {
    errors.push("supabase:unreachable");
  }

  // 2) Instant email to Kyla
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    try {
      const lines = Object.entries(payload)
        .map(([k, v]) => `<b>${k}:</b> ${String(v).slice(0, 300)}`)
        .join("<br>");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kyla Muir Realty <leads@kylamuirrealty.com>", // domain must be verified in Resend
          to: process.env.NOTIFY_EMAIL,
          subject: `🏠 New ${type.replace("_", " ")} lead: ${name}`,
          html: `<h2>New lead from the website</h2>
                 <p><b>Type:</b> ${type}<br><b>Name:</b> ${name}<br><b>Phone:</b> ${phone}<br><b>Email:</b> ${email}</p>
                 <p>${lines}</p>
                 <p style="color:#888">Reply fast — leads go cold in hours, not days.</p>`,
        }),
      });
    } catch (e) {
      errors.push("email:failed");
    }
  }

  // Lead is "captured" if at least one channel worked
  if (errors.length >= 2 || (errors.length === 1 && errors[0].startsWith("supabase") && !process.env.RESEND_API_KEY)) {
    return res.status(500).json({ error: "Lead could not be saved", detail: errors });
  }
  return res.status(200).json({ ok: true });
}
