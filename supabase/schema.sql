-- Shazzar Pharmacy — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on your project.
--
-- Signups and logins are handled by Supabase Auth (the auth.users table) — no
-- custom users table is needed. The `profiles` trigger below mirrors each new
-- signup into an app-facing profile row.

-- ---------------------------------------------------------------------------
-- Profiles: one row per authenticated user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', 'Patient'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_app_meta_data ->> 'role', 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Products catalog (column names match the JSON the API already serves).
-- Import rows with supabase/import-products.mjs.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
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

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users (id) on delete cascade, -- nullable: guest checkout
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text not null,
  delivery_instructions text,
  payment_method text,
  coupon_code text,
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'received',
  payment_status text not null default 'pending',
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id),
  quantity integer not null check (quantity >= 1),
  unit_price numeric not null check (unit_price >= 0)
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Prescriptions
-- ---------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  delivery_address text,
  file_path text not null,
  status text not null default 'queued_for_pharmacist_review',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Consultations
-- ---------------------------------------------------------------------------
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_name text not null,
  patient_email text,
  patient_phone text,
  specialist_id bigint,
  specialist_name text not null,
  specialization text,
  consultation_date text not null,
  time_slot text not null,
  method text not null check (method in ('video', 'chat')),
  reason text not null,
  status text not null default 'booked',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Health profiles (one per user)
-- ---------------------------------------------------------------------------
create table if not exists public.health_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age integer check (age > 0),
  gender text,
  weight numeric check (weight > 0),
  allergies text,
  chronic_conditions text,
  medications text,
  emergency_contact text,
  preferred_checkin text,
  note text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The API uses the service-role key (bypasses RLS); these policies protect the
-- data from direct client-side access while letting users read their own rows.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.prescriptions enable row level security;
alter table public.consultations enable row level security;
alter table public.health_profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- profiles
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- products are public catalog
create policy "products: public read" on public.products
  for select using (true);

-- orders
create policy "orders: read own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

-- order_items follow their order
create policy "order_items: read own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- prescriptions
create policy "prescriptions: read own" on public.prescriptions
  for select using (auth.uid() = user_id or public.is_admin());

-- consultations
create policy "consultations: read own" on public.consultations
  for select using (auth.uid() = user_id or public.is_admin());

-- health_profiles
create policy "health_profiles: read own" on public.health_profiles
  for select using (auth.uid() = user_id or public.is_admin());
create policy "health_profiles: upsert own" on public.health_profiles
  for insert with check (auth.uid() = user_id);
create policy "health_profiles: update own" on public.health_profiles
  for update using (auth.uid() = user_id);
