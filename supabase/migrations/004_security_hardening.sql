-- Security hardening: close Storage writes, tighten checks, force ownership

-- 1) Remove authenticated upload to public exercises bucket
-- Media ships via repo/public or admin tooling — not end-user upload.
drop policy if exists "exercises_media_auth_upload" on storage.objects;

-- 2) Workout log duration bounds (early finish allowed, spam capped)
update public.workout_logs
set duration_seconds = 1
where duration_seconds < 1;

update public.workout_logs
set duration_seconds = 3600
where duration_seconds > 3600;

alter table public.workout_logs
  drop constraint if exists workout_logs_duration_seconds_check;

alter table public.workout_logs
  add constraint workout_logs_duration_seconds_check
  check (duration_seconds >= 1 and duration_seconds <= 3600);

-- 3) Tighter body metrics ranges (aligned with app UI)
alter table public.body_metrics
  drop constraint if exists body_metrics_height_cm_check;

alter table public.body_metrics
  drop constraint if exists body_metrics_weight_kg_check;

alter table public.body_metrics
  add constraint body_metrics_height_cm_check
  check (height_cm >= 100 and height_cm <= 250);

alter table public.body_metrics
  add constraint body_metrics_weight_kg_check
  check (weight_kg >= 30 and weight_kg <= 300);

-- 4) Force user_id + recorded_at from auth/session (ignore client spoofing)
create or replace function public.enforce_body_metrics_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  new.user_id := auth.uid();
  if tg_op = 'INSERT' then
    new.recorded_at := current_date;
  end if;
  return new;
end;
$$;

drop trigger if exists body_metrics_enforce_owner on public.body_metrics;
create trigger body_metrics_enforce_owner
  before insert or update on public.body_metrics
  for each row execute function public.enforce_body_metrics_owner();

create or replace function public.enforce_workout_log_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  new.user_id := auth.uid();
  new.completed_at := now();
  return new;
end;
$$;

drop trigger if exists workout_logs_enforce_owner on public.workout_logs;
create trigger workout_logs_enforce_owner
  before insert on public.workout_logs
  for each row execute function public.enforce_workout_log_owner();
