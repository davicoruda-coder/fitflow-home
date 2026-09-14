-- Technique review: better cues (spine/shoulder safety) + Treino A order
-- (afundo before prancha; plank closes the round)

-- Cues — empurrar
update public.exercises set cues =
  'Cotovelos a ~45° do tronco, punhos neutros nos apoios. Desça o peito abaixo da linha das mãos (2s), suba em 2s. Abdômen contraído; joelhos no chão se precisar.'
where slug = 'flexao-apoios';

update public.exercises set cues =
  'Apoios próximos e paralelos, cotovelos junto ao tronco. Desça controlado e suba sem travar os cotovelos. Se doer o ombro, reduza a amplitude.'
where slug = 'mergulho-diamante';

-- Cues — rodinha (retroversão + glúteo)
update public.exercises set cues =
  'Antes de rolar: expire, contraia o glúteo e "encaixe" o quadril (retroversão). Role só até onde a lombar não arqueia. Movimento lento a partir dos joelhos.'
where slug = 'ab-wheel-rollout';

update public.exercises set cues =
  'Mesma preparação: glúteo contraído e quadril encaixado. Pause 1–2s no ponto mais longo em que ainda segura o quadril. Se o quadril cair, encurte a amplitude.'
where slug = 'ab-wheel-pausa';

-- Cues — cadeia posterior (cervical neutra)
update public.exercises set cues =
  'De bruços, eleve o peito e puxe os cotovelos às costelas. Olhar para o chão, queixo levemente recolhido — não estique o pescoço.'
where slug = 'superman-w-row';

update public.exercises set cues =
  'Eleve peito e braços em Y ou T com polegares para cima; pause 2s no topo. Olhar para o chão, cervical neutra.'
where slug = 'superman-yt';

update public.exercises set cues =
  'Corpo alinhado da cabeça aos calcanhares, queixo levemente recolhido. Não deixe o quadril cair nem subir. Respire normal.'
where slug = 'prancha';

update public.exercises set cues =
  'Empurre o quadril para cima e contraia o glúteo 2s no topo. Costelas "fechadas": suba até a linha do corpo, sem hiperextender a lombar.'
where slug = 'glute-bridge';

-- Cues — pernas (cadência)
update public.exercises set cues =
  'Pés na largura dos ombros. Desça em 3s até as coxas quase paralelas, joelhos na direção dos pés, e suba empurrando o chão. Lombar neutra.'
where slug = 'agachamento';

-- Treino A: afundo (4) antes da prancha (5)
update public.workout_exercises we
set sort_order = 99
from public.workouts w, public.exercises e
where we.workout_id = w.id
  and we.exercise_id = e.id
  and w.code = 'A'
  and e.slug = 'prancha';

update public.workout_exercises we
set sort_order = 4
from public.workouts w, public.exercises e
where we.workout_id = w.id
  and we.exercise_id = e.id
  and w.code = 'A'
  and e.slug = 'afundo-alternado';

update public.workout_exercises we
set sort_order = 5
from public.workouts w, public.exercises e
where we.workout_id = w.id
  and we.exercise_id = e.id
  and w.code = 'A'
  and e.slug = 'prancha';
