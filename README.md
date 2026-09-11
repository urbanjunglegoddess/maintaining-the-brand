# Maintaining the Brand — Web App

The interactive brand workbook: 16 parts, 101 guided sections, 382 things the
reader writes. Next.js + React + TypeScript, with accounts, cloud-synced
answers, one-time-purchase access, and a branded PDF export.

An Urban Jungle Goddess product.

> **Status: complete and running.** The whole application is built. It works
> today with no backend at all — no Supabase account, no Stripe account,
> nothing to sign up for. Adding those services later is an environment-variable
> change, not a code change. See **[docs/CONNECTING.md](docs/CONNECTING.md)**.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

You get the full workbook, navigable and fillable, with a live progress bar and
a real PDF download. Answers save to `localStorage`.

## How it degrades

Every external service sits behind a flag in [`lib/config.ts`](lib/config.ts).
Nothing is stubbed or commented out — the real code path runs, and falls back
when the keys are missing.

| Service  | Without it                              | With it                                  |
| -------- | --------------------------------------- | ---------------------------------------- |
| Supabase | No sign-in; answers in this browser.    | Accounts; answers synced across devices. |
| Stripe   | Nothing locked; the whole book is open. | Free sample + paid unlock.               |
| Fonts    | PDF uses Times/Helvetica.               | PDF uses Fraunces + Inter.               |

That's what makes the app sellable in stages: it's usable as a free tool the
day it deploys, and becomes a product when Stripe is added.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase
(Auth + Postgres + RLS) · Stripe Checkout, one-time · @react-pdf/renderer ·
Vercel.

## Structure

```
app/
  page.tsx                     → landing / sales page
  workbook/page.tsx            → the workbook; gating happens here, server-side
  login/page.tsx               → magic-link + Google sign-in
  account/page.tsx             → profile, access status, sign out
  welcome/page.tsx             → post-purchase landing (webhook-aware)
  auth/callback/route.ts       → exchanges the sign-in code for a session
  auth/signout/route.ts
  api/answers/route.ts         → GET all / PUT batch / DELETE, per user
  api/checkout/route.ts        → creates a Stripe Checkout session
  api/stripe/webhook/route.ts  → verifies the signature, grants the entitlement
  api/export/pdf/route.ts      → renders the filled workbook to PDF
components/
  Workbook.tsx                 → sidebar, section view, progress, export
  UnlockPanel.tsx              → what a locked section shows instead
  AuthForm.tsx                 → email link + Google
  fields/Field.tsx             → one renderer per field type
  pdf/WorkbookPdf.tsx          → the PDF document
lib/
  config.ts                    → which services are on. The switchboard.
  types.ts                     → content + answer types
  content.ts                   → loads the book (DB if present, bundle if not)
  sections.ts                  → flatten helper, kept free of content imports
  preview.ts                   → what's free, and how paid content is stripped
  store.ts                     → answers: localStorage or the API, same interface
  auth.ts / entitlement.ts     → who they are, what they're allowed
  supabase/{server,client}.ts  → clients, null when unconfigured
  stripe.ts · pdf-fonts.ts · answers-format.ts
content/book_data.json         → the parsed workbook (source of truth)
scripts/seed-content.ts        → publish the book into book_content
supabase/migrations/0001_init.sql
middleware.ts                  → refreshes the session cookie
```

## Two things worth knowing

**Locked content never ships.** Paid sections are removed on the server before
the page is rendered — `lib/preview.ts` replaces them with a title and a lock.
It is not a CSS trick. With gating on, the payload drops from ~110KB to ~21KB
for a reader who hasn't bought it.

**Only the webhook grants access.** `entitlements` has no client-writable
policy at all. The Stripe webhook verifies the signature and writes with the
service-role key. Nothing the browser sends can create an entitlement.

## The content is data

`content/book_data.json` is generated from the 156-page book by the parser
(`parse_book.py` in the workbook project). To revise the book: re-run the
parser, replace the file, and — once Supabase is connected — `npm run seed` to
publish a new version. Existing answers stay valid because they're keyed by
`section` + `field_idx`, not by content.

## What's left

- Connect Supabase, then Stripe — [docs/CONNECTING.md](docs/CONNECTING.md).
- Drop the Fraunces/Inter TTFs into `assets/fonts/` for the PDF.
- Set the price and write the listing.
- Later: image uploads for moodboards, an in-app template editor, and the rest
  of the Root System tools behind the same login.
