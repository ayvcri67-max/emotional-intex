-- Supabase schema for AI Sentiment Analyzer
-- 위치: supabase/migrations/001_create_sentiment_analyses_table.sql
-- Supabase Dashboard > SQL Editor에서 이 쿼리를 실행하여 테이블을 생성하세요.

-- 1. UUID 생성을 위한 pgcrypto 확장 모듈 활성화
create extension if not exists pgcrypto;

-- 2. sentiment_analyses 테이블 생성
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

-- 3. Row Level Security(RLS) 활성화 (서버 전용 접근을 유도하여 보안 강화)
alter table public.sentiment_analyses enable row level security;

-- 4. 성능 최적화를 위한 인덱스 생성
create index if not exists sentiment_analyses_created_at_idx
  on public.sentiment_analyses (created_at desc);

create index if not exists sentiment_analyses_sentiment_idx
  on public.sentiment_analyses (sentiment);
