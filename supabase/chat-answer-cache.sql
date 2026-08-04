-- Persistent cache for public web-grounded chat answers.
-- Run this migration after supabase/schema.sql.

create table if not exists public.chat_answer_cache (
  cache_key text primary key,
  query_text text not null,
  context_name text,
  reply text not null,
  sources jsonb not null default '[]'::jsonb,
  provider text not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint chat_answer_cache_sources_array_check
    check (jsonb_typeof(sources) = 'array')
);

create index if not exists chat_answer_cache_expires_at_idx
  on public.chat_answer_cache(expires_at);

alter table public.chat_answer_cache enable row level security;

-- Cache reads and writes happen only in the server route with the service-role key.
revoke all on public.chat_answer_cache from anon, authenticated;
grant all on public.chat_answer_cache to service_role;
