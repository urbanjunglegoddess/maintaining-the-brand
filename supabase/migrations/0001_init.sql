-- Maintaining the Brand — initial schema
-- Run in Supabase (SQL editor, or `supabase db push`).
--
-- Security model in one line: readers own their answers, nobody can write
-- themselves an entitlement, and paid content is never selectable by anon.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  display_name       text,
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── entitlements (proof of purchase; written only by the Stripe webhook) ─────
create table if not exists public.entitlements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  product        text not null default 'maintaining_the_brand',
  status         text not null default 'active',   -- 'active' | 'refunded'
  stripe_session text,
  granted_at     timestamptz not null default now(),
  unique (user_id, product)
);

-- ── answers (one row per user per field; upserted on autosave) ───────────────
create table if not exists public.answers (
  user_id    uuid not null references auth.users(id) on delete cascade,
  section    text not null,           -- e.g. '5.1'
  field_idx  int  not null,
  value      jsonb,                   -- text | bool | {Name,HEX,...} | [{date,what}]
  updated_at timestamptz not null default now(),
  primary key (user_id, section, field_idx)
);

create index if not exists answers_user_idx on public.answers (user_id);

-- ── book_content (parsed workbook, versioned; seeded from JSON) ──────────────
create table if not exists public.book_content (
  version    int primary key,
  data       jsonb not null,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.entitlements enable row level security;
alter table public.answers      enable row level security;
alter table public.book_content enable row level security;

-- profiles: a user sees/updates only their own row.
-- `to authenticated` matters: without it a policy applies to PUBLIC, which
-- includes the anon role.
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- answers: full CRUD, but only your own rows.
drop policy if exists "own answers" on public.answers;
create policy "own answers"
  on public.answers for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- entitlements: a user may READ their own. There is deliberately no insert or
-- update policy — the webhook writes with the service-role key, which bypasses
-- RLS. That is the only path to access.
drop policy if exists "own entitlement read" on public.entitlements;
create policy "own entitlement read"
  on public.entitlements for select to authenticated using (auth.uid() = user_id);

-- book_content: the workbook copy itself. Restricted to signed-in users so the
-- paid text can't be lifted straight off the REST endpoint by an anonymous
-- caller. Per-section gating happens in the app (lib/preview.ts), which strips
-- locked sections server-side before rendering.
drop policy if exists "read published content" on public.book_content;
create policy "read published content"
  on public.book_content for select to authenticated using (published = true);
