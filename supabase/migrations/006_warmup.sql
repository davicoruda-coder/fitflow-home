-- Short cat-cow warmup once before circuits A and B (not repeated in rounds)

alter table public.workout_exercises
  add column if not exists is_warmup boolean not null default false;

insert into public.exercises (
  name,
  slug,
  muscles,
  cues,
  equipment,
  thumbnail_url,
  image_url,
  video_url
)
values (
  'Aquecimento · Gato-vaca',
  'aquecimento-gato-vaca',
  array['Coluna', 'Core', 'Mobilidade'],
  'De quatro apoios, alterne arqueamento (gato) e extensão suave (vaca). Movimento lento, sem forçar o pescoço.',
  array['Peso corporal'],
  '/exercises/aquecimento-gato-vaca.webp',
  '/exercises/aquecimento-gato-vaca.webp',
  '/exercises/aquecimento-gato-vaca.mp4'
)
on conflict (slug) do update set
  name = excluded.name,
  muscles = excluded.muscles,
  cues = excluded.cues,
  equipment = excluded.equipment,
  thumbnail_url = excluded.thumbnail_url,
  image_url = excluded.image_url,
  video_url = excluded.video_url;

delete from public.workout_exercises we
using public.exercises e
where we.exercise_id = e.id
  and e.slug = 'aquecimento-gato-vaca';

insert into public.workout_exercises (
  workout_id,
  exercise_id,
  sort_order,
  target_reps,
  target_seconds,
  is_warmup
)
select w.id, e.id, 0, null, 60, true
from public.workouts w
join public.exercises e on e.slug = 'aquecimento-gato-vaca'
where w.code in ('A', 'B');
