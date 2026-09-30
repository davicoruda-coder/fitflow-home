-- Migration 010: Alinhamento preciso dos textos (cues) com a execução real dos vídeos
--
-- 1. Agachamento: especifica que os braços ficam estendidos à frente na altura dos ombros para contrapeso
-- 2. Mergulho / Tríceps: especifica o uso da cadeira/banco (conforme mostrado no vídeo)
-- 3. Superman W-Row: detalha os braços estendidos à frente antes da puxada em W

-- Agachamento
update public.exercises set cues =
  'Pés na largura dos ombros, pontas levemente para fora. Braços estendidos à frente na altura dos ombros para contrapeso. Desça o quadril para trás e para baixo até as coxas quase paralelas ao chão, joelhos na direção dos pés. Suba empurrando o chão com a lombar neutra.'
where slug = 'agachamento';

-- Mergulho (Tríceps Banco / Cadeira)
update public.exercises set cues =
  'Mãos apoiadas na borda de uma cadeira firme (ou banco), pernas estendidas à frente. Desça flexionando os cotovelos para trás e suba empurrando sem travar a articulação. Se doer o ombro, reduza a amplitude.'
where slug = 'mergulho-diamante';

-- Superman W-Row
update public.exercises set cues =
  'De bruços com braços estendidos à frente, eleve o peito e puxe os cotovelos às costelas formando um W. Olhar para o chão, queixo levemente recolhido — não estique o pescoço.'
where slug = 'superman-w-row';
