-- LAUNCH UF — full schema (orders + payments + admin access)
-- Run this whole file in Supabase → SQL Editor → New query → Run

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  package text not null check (package in ('GROW', 'SCALE')),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  instagram text,
  tiktok text,
  business_description text not null,
  colors text,
  style text,
  website_feel text,
  pages text,
  "references" text,
  extra_information text,
  launch_date date,
  domain_status text,
  logo_url text,
  status text not null default 'new' check (status in ('new','contacted','in_progress','review','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  amount_kr integer,
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Anyone (anonymous website visitor) can create an order
drop policy if exists "public can create orders" on public.orders;
create policy "public can create orders" on public.orders
  for insert to anon with check (true);

-- Only logged-in admins (you + William) can read orders — this powers admin.html
drop policy if exists "admins can read orders" on public.orders;
create policy "admins can read orders" on public.orders
  for select to authenticated using (true);

-- Only logged-in admins can update order/payment status
drop policy if exists "admins can update orders" on public.orders;
create policy "admins can update orders" on public.orders
  for update to authenticated using (true) with check (true);

-- Logo storage bucket
insert into storage.buckets (id, name, public)
values ('launch-logos', 'launch-logos', true)
on conflict (id) do nothing;

drop policy if exists "public can upload launch logos" on storage.objects;
create policy "public can upload launch logos" on storage.objects
  for insert to anon with check (bucket_id = 'launch-logos');

drop policy if exists "public can read launch logos" on storage.objects;
create policy "public can read launch logos" on storage.objects
  for select to anon using (bucket_id = 'launch-logos');
