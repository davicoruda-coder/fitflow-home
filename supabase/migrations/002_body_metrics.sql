-- Body metrics for progress tracking (height + weight)

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_at date not null default (current_date),
  height_cm numeric(5, 2) not null check (height_cm >= 100 and height_cm <= 250),
  weight_kg numeric(5, 2) not null check (weight_kg >= 30 and weight_kg <= 300),
  created_at timestamptz not null default now(),
  unique (user_id, recorded_at)
);

create index if not exists body_metrics_user_recorded_idx
  on public.body_metrics (user_id, recorded_at desc);

alter table public.body_metrics enable row level security;

drop policy if exists "body_metrics_select_own" on public.body_metrics;
create policy "body_metrics_select_own"
  on public.body_metrics for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "body_metrics_insert_own" on public.body_metrics;
create policy "body_metrics_insert_own"
  on public.body_metrics for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "body_metrics_update_own" on public.body_metrics;
create policy "body_metrics_update_own"
  on public.body_metrics for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
