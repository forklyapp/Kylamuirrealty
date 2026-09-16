# Lead alerts setup — get leads to Kyla's phone

Every form on the site posts to `/api/lead`. That function does three things in
parallel, and none depends on the others:

1. **Saves to Supabase** (`leads` table) — permanent record, already working
2. **Texts Kyla** via Twilio — fastest, needs setup below
3. **Emails Kyla** via Resend — backup with full details, needs setup below

If one channel is down the others still fire. A lead is never lost.

---

## DO THIS FIRST: Email alerts (5 minutes, free)

Email arrives on her phone as a push notification almost instantly, so this gets
her covered today while SMS registration processes.

1. Go to **resend.com** and sign up (free tier: 100 emails/day — plenty).
2. **API Keys → Create API Key.** Copy it (starts with `re_`).
3. In **Vercel → Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = the `re_...` key
   - `NOTIFY_EMAIL` = `kylamuirrealty@gmail.com`
4. Redeploy.

That's it — test a form and she gets an email with the lead's name, phone
(tap-to-call), email, and everything they filled out. Hitting reply goes
straight back to the lead.

**Optional polish:** by default the email comes from Resend's shared sender.
To send from her own domain, in Resend go to **Domains → Add Domain**, enter
`kylamuirrealty.com`, add the DNS records it gives you in Squarespace, then add
`RESEND_FROM` = `Kyla Muir Realty <leads@kylamuirrealty.com>` in Vercel.

---

## THEN: Text message alerts (Twilio)

### Heads up before you start
US carriers require business SMS to be registered — it's called **A2P 10DLC**.
Twilio walks you through it, but expect:
- A few dollars in fees (one-time brand registration + ~$1.15/mo for the number)
- **A few days for carrier approval** before texts will actually send
- Per-text cost around a penny

This is a carrier requirement, not a Twilio upsell. Every SMS provider has it.
Skipping registration means your texts get filtered and silently fail.

### Setup
1. Sign up at **twilio.com**, verify your email and phone.
2. **Phone Numbers → Buy a number.** Get a local Utah number (801/385 area code
   looks right on her phone). Make sure it has **SMS** capability.
3. Complete **A2P 10DLC registration** when Twilio prompts you:
   - Brand: Kyla Muir Realty (sole proprietor works)
   - Campaign use case: **Customer Care** or **Account Notification**
   - Sample message: `New BUYER lead: Jane Smith, 801-555-1234 - kylamuirrealty.com`
   - Wait for approval (a few days).
4. From the Twilio Console dashboard, grab **Account SID** and **Auth Token**.
5. In **Vercel → Settings → Environment Variables**, add:
   - `TWILIO_ACCOUNT_SID` = `AC...`
   - `TWILIO_AUTH_TOKEN` = the auth token
   - `TWILIO_FROM` = your Twilio number in E.164 format, e.g. `+13855551234`
   - `NOTIFY_SMS` = `+18017879540`  ← Kyla's cell, **E.164 format matters**
6. Redeploy and submit a test lead.

### E.164 format
Phone numbers must be `+1` then the ten digits, no spaces, dashes, or parens:
- ✅ `+18017879540`
- ❌ `801-787-9540`, `(801) 787-9540`, `8017879540`

Wrong format is the #1 reason Twilio silently fails.

---

## What the text looks like

```
BUYER lead: Jane Smith
801-555-1234
jane@email.com
ASAP - I'm ready
$400k - $550k
- kylamuirrealty.com
```

Short on purpose — enough to decide whether to call back immediately, without
making her scroll. Full details are in the email and in Supabase.

---

## Testing & troubleshooting

Submit a test lead from the site, then check in this order:

1. **Supabase → Table Editor → leads** — is the row there? If yes, the function
   ran fine and any problem is with the alert channels specifically.
2. **Vercel → your project → Logs** — filter to `/api/lead`. Errors from Twilio
   or Resend are logged with their status codes and response text.
3. The API response itself tells you what worked:
   `{"ok":true,"saved":true,"texted":true,"mailed":true}`
   Any `false` shows you exactly which channel to fix.

**Common causes:**
- Text never arrives → phone numbers not in E.164 format, or 10DLC still pending
- Email never arrives → check spam; verify `NOTIFY_EMAIL` has no typo
- Nothing at all → env vars added but **not redeployed**

---

## Cost summary

| Service | Cost |
|---|---|
| Supabase | Free tier is plenty |
| Resend email | Free (100/day) |
| Twilio number | ~$1.15/month |
| Twilio texts | ~$0.01 each |
| A2P registration | A few dollars, one time |

Realistically a few dollars a month. Worth folding into the hosting fee you
charge clients.
