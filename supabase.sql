-- Supabase schema for AI Sentiment Analyzer
-- Run this in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.sentiment_analyses (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null
    check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null
    check (confidence between 0 and 100),
  reasons jsonb not null
    check (
      jsonb_typeof(reasons) = 'array'
      and jsonb_array_length(reasons) between 1 and 3
    ),
  created_at timestamptz not null default now()
);

alter table public.sentiment_analyses enable row level security;

-- No public policies are created.
-- The Node.js/Vercel server writes through the Supabase server client.
-- Keep SUPABASE_SERVICE_ROLE_KEY server-side only.

create index if not exists sentiment_analyses_created_at_idx
  on public.sentiment_analyses (created_at desc);

create index if not exists sentiment_analyses_sentiment_idx
  on public.sentiment_analyses (sentiment);