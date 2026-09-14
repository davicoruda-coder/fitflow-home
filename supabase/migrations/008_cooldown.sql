-- Short static cool-down after circuits A and B (desk-worker friendly)

alter table public.workout_exercises
  add column if not exists is_cooldown boolean not null default false;

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
values
  (
    'Alongamento · Postura da criança',
    'alongamento-crianca',
    array['Coluna', 'Ombros', 'Costas'],
    'Joelhos no chão, quadril em direção aos calcanhares, braços à frente. Respire devagar; solte o pescoço sem forçar.',
    array['Peso corporal'],
    '/exercises/alongamento-crianca.webp',
    '/exercises/alongamento-crianca.webp',
    '/exercises/alongamento-crianca.mp4'
  ),
  (
    'Alongamento · Peitoral na parede',
    'alongamento-peito',
    array['Peitoral', 'Ombros anteriores'],
    'Antebraço ou mão na parede na altura do ombro; gire o tronco suavemente para abrir o peito. Troque de lado.',
    array['Peso corporal', 'Parede'],
    '/exercises/alongamento-peito.webp',
    '/exercises/alongamento-peito.webp',
    '/exercises/alongamento-peito.mp4'
  ),
  (
    'Alongamento · Quadríceps em pé',
    'alongamento-quadriceps',
    array['Quadríceps', 'Flexores do quadril'],
    'Em pé, puxe o calcanhar em direção ao glúteo com o joelho próximo ao outro. Tronco ereto; apoie-se se precisar. Troque de perna.',
    array['Peso corporal'],
    '/exercises/alongamento-quadriceps.webp',
    '/exercises/alongamento-quadriceps.webp',
    '/exercises/alongamento-quadriceps.mp4'
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
  and e.slug in (
    'alongamento-crianca',
    'alongamento-peito',
    'alongamento-quadriceps'
  );

insert into public.workout_exercises (
  workout_id,
  exercise_id,
  sort_order,
  target_reps,
  target_seconds,
  is_warmup,
  is_cooldown
)
select w.id, e.id, v.sort_order, null, v.target_seconds, false, true
from (
  values
    ('alongamento-crianca', 90, 30),
    ('alongamento-peito', 91, 30),
    ('alongamento-quadriceps', 92, 40)
) as v(slug, sort_order, target_seconds)
cross join public.workouts w
join public.exercises e on e.slug = v.slug
where w.code in ('A', 'B');
