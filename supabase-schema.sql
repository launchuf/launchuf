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
  description text not null,
  colors text,
  style text,
  website_references text,
  notes text,
  pages text,
  launch_date date,
  domain text,
  logo_url text,
  status text not null default 'new' check (status in ('new','contacted','in_progress','review','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "public can create orders" on public.orders;
create policy "public can create orders" on public.orders for insert to anon with check (true);

insert into storage.buckets (id, name, public)
values ('launch-logos', 'launch-logos', true)
on conflict (id) do nothing;

drop policy if exists "public can upload launch logos" on storage.objects;
create policy "public can upload launch logos" on storage.objects for insert to anon with check (bucket_id = 'launch-logos');
