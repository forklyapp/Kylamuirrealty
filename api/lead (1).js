// /api/lead.js — Vercel serverless function
//
// Every form on the site posts here. This function does three things:
//   1. Saves the lead to Supabase (permanent record — never lost)
//   2. TEXTS Kyla's phone via Twilio (fastest — speed to lead wins deals)
//   3. Emails Kyla via Resend (backup + full details)
//
// Nothing blocks anything else: if SMS fails, email still sends and the lead is
// still saved. A lead is never dropped because one channel is down.
//
// ── ENV VARS (Vercel -> Settings -> Environment Variables) ───────────────────
// REQUIRED (already set):
//   SUPABASE_URL              https://bbvyhqjwundqtrlendiw.supabase.co
//   SUPABASE_SERVICE_KEY      the sb_secret_... key
//
// FOR TEXT ALERTS (Twilio):
//   TWILIO_ACCOUNT_SID        starts with AC...
//   TWILIO_AUTH_TOKEN         from the Twilio console
//   TWILIO_FROM               your Twilio number, E.164: +13855550123
//   NOTIFY_SMS                Kyla's cell, E.164: +18017879540
//
// FOR EMAIL ALERTS (Resend - free, 5 min setup):
//   RESEND_API_KEY            from resend.com
//   NOTIFY_EMAIL              kylamuirrealty@gmail.com
//   RESEND_FROM               optional; defaults to Resend's shared sender
// ────────────────────────────────────────────────────────────────────────────

const LABELS = {
  home_value: "Home value request",
  buyer: "BUYER lead",
  seller: "SELLER lead",
  contact: "Contact form",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const b = req.body || {};

  // Honeypot - bots fill the hidden "company" field. Pretend success, drop it.
  if (b.company) return res.status(200).json({ ok: true });

  const type = String(b.type || "contact").slice(0, 40);
  const name = String(b.name || "").slice(0, 120).trim();
  const phone = String(b.phone || "").slice(0, 60).trim();
  const email = String(b.email || "").slice(0, 120).trim();

  if (!name || (!phone && !email)) {
    return res.status(400).json({ error: "Name and a phone or email are required." });
  }

  const { type: _t, name: _n, phone: _p, email: _e, company: _c, ...payload } = b;
  const label = LABELS[type] || "New lead";

  // Run all three in parallel so the visitor isn't waiting on any of them
  const results = await Promise.allSettled([
    saveToSupabase({ type, name, phone, email, payload }),
    textKyla({ label, name, phone, email, payload }),
    emailKyla({ label, name, phone, email, payload }),
  ]);

  const saved = results[0].status === "fulfilled" && results[0].value;
  const texted = results[1].status === "fulfilled" && results[1].value;
  const mailed = results[2].status === "fulfilled" && results[2].value;

  // Only a hard failure if the lead reached NOBODY and wasn't stored
  if (!saved && !texted && !mailed) {
    console.error("lead delivery failed", JSON.stringify(results));
    return res.status(500).json({ error: "Lead could not be delivered" });
  }

  return res.status(200).json({ ok: true, saved, texted, mailed });
}

/* ───────────────────────── Supabase ───────────────────────── */
async function saveToSupabase({ type, name, phone, email, payload }) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return false;
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
  return r.ok;
}

/* ───────────────────────── Twilio SMS ─────────────────────── */
async function textKyla({ label, name, phone, email, payload }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.NOTIFY_SMS;
  if (!sid || !token || !from || !to) return false;

  // Short and scannable - she just needs enough to call back fast
  const bits = [`${label}: ${name}`];
  if (phone) bits.push(phone);
  if (email) bits.push(email);
  if (payload.address) bits.push(String(payload.address).slice(0, 60));
  if (payload.q1) bits.push(String(payload.q1).slice(0, 40));
  if (payload.q2) bits.push(String(payload.q2).slice(0, 40));
  bits.push("- kylamuirrealty.com");
  const body = bits.join("\n").slice(0, 600);

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!r.ok) console.error("twilio error", r.status, await r.text().catch(() => ""));
  return r.ok;
}

/* ───────────────────────── Resend email ───────────────────── */
async function emailKyla({ label, name, phone, email, payload }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return false;

  const rows = Object.entries(payload)
    .map(([k, v]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#888">${esc(k)}</td><td>${esc(String(v).slice(0, 400))}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px">${esc(label)}</h2>
      <p style="color:#888;margin:0 0 18px">from kylamuirrealty.com</p>
      <table style="font-size:15px;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#888">Name</td><td><strong>${esc(name)}</strong></td></tr>
        ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#888">Phone</td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>` : ""}
        ${email ? `<tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>` : ""}
        ${rows}
      </table>
      <p style="color:#999;font-size:13px;margin-top:22px">Reply fast - online leads go cold in hours, not days.</p>
    </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Kyla Muir Realty <onboarding@resend.dev>",
      to,
      reply_to: email || undefined,
      subject: `${label}: ${name}${phone ? " - " + phone : ""}`,
      html,
    }),
  });
  if (!r.ok) console.error("resend error", r.status, await r.text().catch(() => ""));
  return r.ok;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
