# 💎 Tech Shop PREMIUM Version

## Features
- Next.js App
- Supabase Auth (Login/Register)
- Produkt Upload (mit Bild Upload vorbereitet)
- Modernes Premium Design (Dark Tech Style)

## Setup

npm install
npm run dev

## Supabase

1. Auth aktivieren (Email Login)
2. Storage Bucket erstellen: images
3. Tabelle:

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text,
  price numeric,
  image text,
  user_id uuid
);

## ENV

.env.local:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
