-- Recreates the `products` table with the exact column names the API expects.
-- Run this in the Supabase SQL Editor if the import reports missing columns
-- (e.g. "Could not find the 'createdAt' column"). The table is safe to drop:
-- it is refilled by `node supabase/import-products.mjs` right after.

drop table if exists public.products cascade;

create table public.products (
  id bigint primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  category text,
  brand text,
  popularity integer default 0,
  "createdAt" date,
  "requiresPrescription" boolean default false,
  dosage text,
  image text,
  reviews jsonb default '[]'::jsonb
);

alter table public.products enable row level security;

create policy "products: public read" on public.products
  for select using (true);
