-- Guest checkout support. Run this in the Supabase SQL Editor on projects
-- created before guest checkout was added (safe to re-run).

alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists customer_email text;
