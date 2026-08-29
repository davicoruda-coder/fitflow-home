-- FitFlow Home — schema, RLS, seed
-- Run this in Supabase SQL Editor (or via supabase db push)

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  start_date date not null default (current_date),
  created_at timestamptz not null default now()
);

-- Exercises catalog
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  muscles text[] not null default '{}',
  cues text not null default '',
  equipment text[] not null default '{}',
  thumbnail_url text,
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

-- Workouts A / B
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('A', 'B')),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Workout ↔ exercise ordering
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sort_order int not null,
  target_reps int,
  target_seconds int,
  unique (workout_id, sort_order)
);

create index if not exists workout_exercises_workout_id_idx
  on public.workout_exercises (workout_id);

-- Completion logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete restrict,
  completed_at timestamptz not null default now(),
  duration_seconds int not null default 0
    check (duration_seconds >= 1 and duration_seconds <= 3600)
);

create index if not exists workout_logs_user_completed_idx
  on public.workout_logs (user_id, completed_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, start_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    current_date
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;

-- Profiles: own row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Catalog: authenticated read
drop policy if exists "exercises_select_auth" on public.exercises;
create policy "exercises_select_auth"
  on public.exercises for select
  to authenticated
  using (true);

drop policy if exists "workouts_select_auth" on public.workouts;
create policy "workouts_select_auth"
  on public.workouts for select
  to authenticated
  using (true);

drop policy if exists "workout_exercises_select_auth" on public.workout_exercises;
create policy "workout_exercises_select_auth"
  on public.workout_exercises for select
  to authenticated
  using (true);

-- Logs: own rows
drop policy if exists "logs_select_own" on public.workout_logs;
create policy "logs_select_own"
  on public.workout_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "logs_insert_own" on public.workout_logs;
create policy "logs_insert_own"
  on public.workout_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "logs_delete_own" on public.workout_logs;
create policy "logs_delete_own"
  on public.workout_logs for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for exercise media (public read)
insert into storage.buckets (id, name, public)
values ('exercises', 'exercises', true)
on conflict (id) do update set public = true;

drop policy if exists "exercises_media_public_read" on storage.objects;
create policy "exercises_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'exercises');

-- No authenticated upload policy: exercise media is shipped via app deploy / admin.

-- Seed placeholders (replace URLs after uploading real media to Storage)
-- Using placehold.co until real GIFs/photos are uploaded.

insert into public.exercises (name, slug, muscles, cues, equipment, thumbnail_url, image_url)
values
  (
    'Flexão nos Apoios',
    'flexao-apoios',
    array['Peitoral', 'Tríceps', 'Deltoides anteriores'],
    'Manter punhos neutros nos apoios e abdômen contraído. Pode apoiar os joelhos para ajustar a intensidade.',
    array['Push-up bars'],
    'https://placehold.co/400x400/1a6b4a/f2f5f1?text=Flexao',
    'https://placehold.co/800x800/1a6b4a/f2f5f1?text=Flexao+Apoios'
  ),
  (
    'Superman W-Row',
    'superman-w-row',
    array['Lombar', 'Eretores da espinha', 'Romboides'],
    'Deitado de bruços, elevar peito e puxar os cotovelos em direção às costelas.',
    array['Peso corporal'],
    'https://placehold.co/400x400/0f3d2e/f2f5f1?text=W-Row',
    'https://placehold.co/800x800/0f3d2e/f2f5f1?text=Superman+W-Row'
  ),
  (
    'Rodinha Abdominal',
    'ab-wheel-rollout',
    array['Reto abdominal', 'Core profundo'],
    'Movimento controlado a partir dos joelhos; nunca deixar a lombar arquear para baixo.',
    array['Ab wheel'],
    'https://placehold.co/400x400/e85d04/f2f5f1?text=Ab+Wheel',
    'https://placehold.co/800x800/e85d04/f2f5f1?text=Ab+Wheel'
  ),
  (
    'Prancha Estática',
    'prancha',
    array['Core', 'Estabilização de coluna'],
    'Corpo alinhado da cabeça aos calcanhares; não deixar o quadril cair nem subir demais.',
    array['Peso corporal'],
    'https://placehold.co/400x400/14201a/f2f5f1?text=Prancha',
    'https://placehold.co/800x800/14201a/f2f5f1?text=Prancha'
  ),
  (
    'Superman Y/T Isométrico',
    'superman-yt',
    array['Cadeia posterior', 'Escápulas'],
    'Eleve peito e braços em Y ou T; pause 2 segundos no topo para aliviar tensão postural.',
    array['Peso corporal'],
    'https://placehold.co/400x400/1a6b4a/f2f5f1?text=Y%2FT',
    'https://placehold.co/800x800/1a6b4a/f2f5f1?text=Superman+YT'
  ),
  (
    'Mergulho / Flexão Diamante',
    'mergulho-diamante',
    array['Tríceps', 'Peitoral interno'],
    'Mergulho em cadeira/apoio ou flexão diamante nos apoios. Cotovelos próximos ao tronco.',
    array['Push-up bars', 'Cadeira'],
    'https://placehold.co/400x400/0f3d2e/f2f5f1?text=Triceps',
    'https://placehold.co/800x800/0f3d2e/f2f5f1?text=Mergulho'
  ),
  (
    'Ponte de Glúteos',
    'glute-bridge',
    array['Glúteos', 'Posteriores', 'Lombar'],
    'Empurre o quadril para cima e contraia no topo. Não hiperextenda a lombar.',
    array['Peso corporal'],
    'https://placehold.co/400x400/e85d04/f2f5f1?text=Ponte',
    'https://placehold.co/800x800/e85d04/f2f5f1?text=Glute+Bridge'
  ),
  (
    'Rodinha com Pausa',
    'ab-wheel-pausa',
    array['Core', 'Estabilização pélvica'],
    'Rollout controlado com 1 segundo de retenção no ponto mais longo, sem arquear a lombar.',
    array['Ab wheel'],
    'https://placehold.co/400x400/14201a/f2f5f1?text=Pausa',
    'https://placehold.co/800x800/14201a/f2f5f1?text=Ab+Wheel+Pausa'
  )
on conflict (slug) do update set
  name = excluded.name,
  muscles = excluded.muscles,
  cues = excluded.cues,
  equipment = excluded.equipment,
  thumbnail_url = coalesce(public.exercises.thumbnail_url, excluded.thumbnail_url),
  image_url = coalesce(public.exercises.image_url, excluded.image_url);

insert into public.workouts (code, title, description)
values
  (
    'A',
    'Treino A — Peito, Tríceps e Core',
    'Circuito de 15 minutos focado em peitoral, tríceps e estabilidade de core.'
  ),
  (
    'B',
    'Treino B — Costas, Postura e Lombar',
    'Circuito de 15 minutos focado em cadeia posterior, postura e core.'
  )
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description;

-- Link exercises to workouts (idempotent via delete+insert for seed)
delete from public.workout_exercises
where workout_id in (select id from public.workouts where code in ('A', 'B'));

insert into public.workout_exercises (workout_id, exercise_id, sort_order, target_reps, target_seconds)
select w.id, e.id, v.sort_order, v.target_reps, v.target_seconds
from public.workouts w
join (
  values
    ('A', 'flexao-apoios', 1, 10, null::int),
    ('A', 'superman-w-row', 2, 12, null),
    ('A', 'ab-wheel-rollout', 3, 8, null),
    ('A', 'prancha', 4, null, 30),
    ('B', 'superman-yt', 1, 12, null),
    ('B', 'mergulho-diamante', 2, 10, null),
    ('B', 'glute-bridge', 3, 15, null),
    ('B', 'ab-wheel-pausa', 4, 8, null)
) as v(code, slug, sort_order, target_reps, target_seconds)
  on w.code = v.code
join public.exercises e on e.slug = v.slug;
