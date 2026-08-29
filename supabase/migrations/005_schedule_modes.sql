-- Schedule modes: everyday | alternate (default) | weekdays

alter table public.profiles
  add column if not exists schedule_mode text not null default 'alternate';

alter table public.profiles
  drop constraint if exists profiles_schedule_mode_check;

alter table public.profiles
  add constraint profiles_schedule_mode_check
  check (schedule_mode in ('everyday', 'alternate', 'weekdays'));

alter table public.profiles
  add column if not exists schedule_weekdays smallint[] not null default '{}';

alter table public.profiles
  drop constraint if exists profiles_schedule_weekdays_check;

alter table public.profiles
  add constraint profiles_schedule_weekdays_check
  check (
    schedule_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    and (
      schedule_mode <> 'weekdays'
      or cardinality(schedule_weekdays) >= 1
    )
  );
