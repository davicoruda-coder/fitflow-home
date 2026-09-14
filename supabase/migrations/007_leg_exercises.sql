-- One leg movement per circuit (A: lunge, B: squat) — keeps catalog lean

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
    'Afundo Alternado',
    'afundo-alternado',
    array['Quadríceps', 'Glúteos', 'Equilíbrio'],
    'Passo à frente, joelho de trás desce em direção ao chão, tronco ereto. Alternar as pernas; joelho da frente alinhado com o peito do pé.',
    array['Peso corporal'],
    '/exercises/afundo-alternado.webp',
    '/exercises/afundo-alternado.webp',
    '/exercises/afundo-alternado.mp4'
  ),
  (
    'Agachamento',
    'agachamento',
    array['Quadríceps', 'Glúteos', 'Core'],
    'Pés na largura dos ombros, quadril para trás e para baixo até as coxas quase paralelas ao chão. Empurre o chão e volte em pé sem arredondar a lombar.',
    array['Peso corporal'],
    '/exercises/agachamento.webp',
    '/exercises/agachamento.webp',
    '/exercises/agachamento.mp4'
  )
on conflict (slug) do update set
  name = excluded.name,
  muscles = excluded.muscles,
  cues = excluded.cues,
  equipment = excluded.equipment,
  thumbnail_url = excluded.thumbnail_url,
  image_url = excluded.image_url,
  video_url = excluded.video_url;

-- Remove previous links for these slugs (idempotent)
delete from public.workout_exercises we
using public.exercises e
where we.exercise_id = e.id
  and e.slug in ('afundo-alternado', 'agachamento');

insert into public.workout_exercises (
  workout_id,
  exercise_id,
  sort_order,
  target_reps,
  target_seconds,
  is_warmup
)
select w.id, e.id, v.sort_order, v.target_reps, null, false
from (
  values
    ('A', 'afundo-alternado', 5, 10),
    ('B', 'agachamento', 5, 12)
) as v(code, slug, sort_order, target_reps)
join public.workouts w on w.code = v.code
join public.exercises e on e.slug = v.slug;

update public.workouts
set
  title = 'Treino A — Peito, Braços, Core e Pernas',
  description = 'Circuito de 15 minutos com peitoral, tríceps, core, coluna e afundos.'
where code = 'A';

update public.workouts
set
  title = 'Treino B — Costas, Postura, Core e Pernas',
  description = 'Circuito de 15 minutos com cadeia posterior, postura, core e agachamentos.'
where code = 'B';
