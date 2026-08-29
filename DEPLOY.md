# Deploy checklist — FitFlow Home

## Antes do deploy

1. Projeto Supabase criado
2. SQL Editor: rodar as migrations `001` → `006` em ordem
3. Auth → Email habilitado; (opcional) desativar confirmação de e-mail no MVP
4. `.env.local` com URL e anon key reais (substituir o placeholder)

## Vercel

1. `git init` + push para GitHub (se ainda não tiver remote)
2. Importar o repo em [vercel.com/new](https://vercel.com/new)
3. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. No Supabase → Authentication → URL Configuration, adicionar:
   - Site URL: `https://fitflow.davicosystems.ia.br`
   - `https://fitflow.davicosystems.ia.br/**`
   - `https://fitflow.davicosystems.ia.br/auth/callback`
   - `https://SEU-PROJETO.vercel.app/**`
   - `http://localhost:3000/**`

## Smoke test pós-deploy

- [ ] Abrir landing `/`
- [ ] Criar conta em `/signup`
- [ ] Login em `/login` e “Esqueci a senha”
- [ ] Ver treino do dia em `/hoje`
- [ ] Iniciar `/treino/A` ou `/treino/B`, avançar exercícios, concluir
- [ ] Ver log em `/historico`
- [ ] Editar nome/data e senha em `/perfil` e logout

## Segurança

- [ ] Sem `service_role` no client / env pública
- [ ] RLS ativo (migration)
- [ ] Bucket `exercises` só com leitura pública
