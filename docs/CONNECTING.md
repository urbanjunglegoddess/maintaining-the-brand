# Connecting the services

The app is finished and runs right now with no accounts anywhere. Every
external service is behind a flag in [`lib/config.ts`](../lib/config.ts). When
the keys are present the feature turns on; when they're absent the app falls
back to something that still works.

| Service  | Absent (today)                              | Present                                      |
| -------- | ------------------------------------------- | -------------------------------------------- |
| Supabase | No sign-in. Answers in `localStorage`.       | Accounts, answers synced across devices.      |
| Stripe   | Nothing locked — the whole book is readable. | Free sample + paid unlock.                    |
| Fonts    | PDF uses Times/Helvetica.                    | PDF uses Fraunces + Inter.                    |

**You never edit code to turn these on.** You add environment variables and
redeploy. Do them in this order — each step works on its own, so you can stop
after any of them and still have a working product.

---

## Step 1 — Supabase (accounts + synced answers)

1. Create a project at [supabase.com](https://supabase.com). Free tier is fine.
2. Open **SQL Editor**, paste the whole of
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql),
   and run it. That creates the four tables and their security policies.
3. **Project Settings → API**, copy three values into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   The service-role key bypasses all security rules. It is only ever read on
   the server. Never put it in a `NEXT_PUBLIC_` variable, and never commit it.

4. **Authentication → URL Configuration → Redirect URLs**, add:

   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```

5. For Google sign-in: **Authentication → Providers → Google**, switch it on and
   paste in a Google OAuth client ID and secret. Skip this and email sign-in
   still works on its own.

Restart `npm run dev`. A **Sign in** button appears. Sign in and the badge in
the toolbar changes from "Saved in this browser" to "Saved to your account" —
and anything already filled in on that device is carried up automatically.

### Optional: serve the book from the database

By default the workbook text is read from `content/book_data.json` in the
bundle. Once Supabase exists you can publish it to the `book_content` table
instead, so copy edits ship without a redeploy:

```bash
npm run seed
```

Versions are append-only. To roll back, set `published = true` on the older
row. If the table is empty or unreachable the app silently uses the bundled
JSON, so this can never take the book down.

---

## Step 2 — Stripe (selling it)

Gating is deliberately tied to *both* Stripe and Supabase. Locking the book
when nobody can sign in would strand the reader, so Step 1 has to be done first.

1. Create a **Product** in Stripe with a **one-time** price. Copy the price ID
   (`price_...`), not the product ID.
2. **Developers → API keys**, copy the secret key.
3. Add to `.env.local`:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Add the webhook. **This is the step that actually grants access** — without
   it people can pay and stay locked out.

   **Developers → Webhooks → Add endpoint**

   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `charge.refunded`,
     `charge.dispute.created`

   Copy the signing secret into `.env.local`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

   To test locally, the Stripe CLI forwards real events to your machine:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   It prints its own `whsec_...` — use that one while testing.

5. Restart. Sections outside the free sample now show an unlock panel, and the
   button opens a real Checkout.

### What's free

Three sections, listed in [`lib/preview.ts`](../lib/preview.ts):

```ts
export const FREE_SECTIONS = ["1.1", "1.2", "1.3"];
```

That array is the whole policy. Add or remove section numbers to change what a
visitor can read before buying.

### How the lock actually works

Paid sections are removed on the server before the page is built — they are
never sent to a browser that hasn't paid. It isn't CSS, and it isn't a check
the browser could be talked out of. The only thing that writes an entitlement
is the Stripe webhook, using the service-role key, after verifying Stripe's
signature. A forged request can't reach the database.

---

## Step 3 — The brand fonts in the PDF

The export works today using the PDF standard fonts. To use the book's real
typefaces, download the **static TTFs** and drop them in:

```
public/fonts/Fraunces-Regular.ttf
public/fonts/Fraunces-SemiBold.ttf
public/fonts/Inter-Regular.ttf
public/fonts/Inter-SemiBold.ttf
public/fonts/Inter-Italic.ttf      (optional)
```

Both families are SIL Open Font License, so they can be embedded in a product
you sell. The export picks them up automatically on the next deploy — there is
no code change and no setting. If only some are present it stays on the
fallbacks rather than mixing metrics.

---

## Step 4 — Deploying

1. Push the repo to GitHub, import it at [vercel.com](https://vercel.com).
2. Paste every variable from `.env.local` into **Settings → Environment
   Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` to the real domain — Stripe's success and cancel
   URLs and the auth redirect are built from it.
4. Add the production `/auth/callback` URL to Supabase and the production
   webhook endpoint to Stripe. These are per-environment; the local ones don't
   carry over.

---

## What each variable does

| Variable                        | Needed for                      | Secret? |
| ------------------------------- | ------------------------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | accounts                        | no      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | accounts                        | no      |
| `SUPABASE_SERVICE_ROLE_KEY`     | granting access in the webhook  | **yes** |
| `STRIPE_SECRET_KEY`             | creating a checkout             | **yes** |
| `STRIPE_PRICE_ID`               | what's being sold               | no      |
| `STRIPE_WEBHOOK_SECRET`         | verifying Stripe's events       | **yes** |
| `NEXT_PUBLIC_SITE_URL`          | redirect URLs                   | no      |

`.env.local` is gitignored. Nothing secret should ever be committed.

---

## Checking it worked

| Check                                     | Where                                        |
| ----------------------------------------- | -------------------------------------------- |
| Accounts are on                           | A **Sign in** button in the workbook toolbar  |
| Answers are syncing                       | Toolbar reads "Saved to your account"         |
| Gating is on                              | 🔒 beside sections in the sidebar             |
| The webhook fired                         | A row in the `entitlements` table             |
| A buyer got in                            | `/welcome` says "The whole book is open."     |

If someone pays and stays locked out, the webhook is the thing to look at
first — Stripe's dashboard shows every delivery attempt and its response. The
entitlement upsert is idempotent, so it's always safe to replay an event.
