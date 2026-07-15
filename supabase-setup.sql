-- Kyla Muir Realty — Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============ LEADS ============
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null default 'contact',        -- contact | home_value | buyer | seller
  name text not null,
  phone text,
  email text,
  payload jsonb not null default '{}'::jsonb,  -- funnel answers, address, message, source URL
  status text not null default 'new'           -- new | contacted | client | closed | dead
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_type_idx on public.leads (type);

-- Lock it down: no anon access at all. Only the serverless function
-- (using the service_role key) can read/write. This keeps lead data private.
alter table public.leads enable row level security;
-- (no policies created on purpose — service_role bypasses RLS)

-- ============ LISTINGS (phase 2 — admin page will manage these) ============
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  address text,
  price text,
  beds int,
  baths numeric,
  sqft int,
  photo_urls text[] default '{}',
  listing_url text,           -- her public MLS/utahrealestate.com link
  agent text default 'Kyla Muir',  -- future: other realtors paying for slots
  featured boolean default true,
  sold boolean default false
);

alter table public.listings enable row level security;

-- Public can READ active listings (the site fetches these client-side later)
create policy "public read listings" on public.listings
  for select using (true);
-- Writes only via service_role (admin page / serverless) — no insert/update policies for anon.
