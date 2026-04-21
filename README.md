

# Orbital-Noir Premium

## Vercel
Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Supabase SQL
```sql
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  description text,
  buy_link text,
  image text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "public can view products"
on public.products for select to anon, authenticated using (true);

create policy "users can insert own products"
on public.products for insert to authenticated
with check (auth.uid() = user_id);

create policy "users can update own products"
on public.products for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own products"
on public.products for delete to authenticated
using (auth.uid() = user_id);

create policy "users can upload images"
on storage.objects for insert to authenticated
with check (bucket_id = 'images');

create policy "users can delete images"
on storage.objects for delete to authenticated
using (bucket_id = 'images');

create policy "public can view images"
on storage.objects for select to public
using (bucket_id = 'images');
```

## Storage
Bucket `images` anlegen und public setzen.
deploy test 123


