-- Maintaining the Brand — initial schema
-- Run in Supabase (SQL editor or `supabase db push`). Phases 1–2.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
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

-- ── entitlements (proof of purchase; written only by the Stripe webhook) ──────
create table if not exists public.entitlements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  product        text not null default 'maintaining_the_brand',
  status         text not null default 'active',   -- 'active' | 'refunded'
  stripe_session text,
  granted_at     timestamptz not null default now(),
  unique (user_id, product)
);

-- ── answers (one row per user per field; upserted on autosave) ────────────────
create table if not exists public.answers (
  user_id    uuid not null references auth.users(id) on delete cascade,
  section    text not null,           -- e.g. '5.1'
  field_idx  int  not null,
  value      jsonb,                    -- text | bool | {Name,HEX,...} | [{date,what}]
  updated_at timestamptz not null default now(),
  primary key (user_id, section, field_idx)
);

-- ── book_content (parsed workbook, versioned; seeded from JSON) ───────────────
create table if not exists public.book_content (
  version    int primary key,
  data       jsonb not null,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.entitlements enable row level security;
alter table public.answers      enable row level security;
alter table public.book_content enable row level security;

-- profiles: a user sees/updates only their own row
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- answers: full CRUD, but only your own rows
create policy "own answers" on public.answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- entitlements: user may READ their own; nobody may write via the client
-- (inserts happen server-side with the service-role key in the webhook route)
create policy "own entitlement read" on public.entitlements for select using (auth.uid() = user_id);

-- book_content: any authenticated user may read the published workbook
create policy "read published content" on public.book_content
  for select using (published = true);
