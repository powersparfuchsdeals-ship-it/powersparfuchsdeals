# Orbital Noir Store

Eigenständiger futuristischer Stil für deinen Technik-Shop.

## Setup
1. npm install
2. Umgebungsvariablen setzen:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
3. npm run dev

## Supabase SQL
```sql
create extension if not exists "uuid-ossp";

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null default 0,
  description text,
  image text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
```

## Storage
Bucket:
- images
- Public aktivieren
