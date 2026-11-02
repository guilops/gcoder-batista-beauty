# Batista Beauty

Site responsivo para divulgar procedimentos de cílios e estética, cursos de extensão de cílios e agendamento online. O painel privado em `/gestao/` permite acompanhar pedidos, confirmar atendimentos, configurar durações e bloquear dias ou horários. Este projeto deve usar um projeto Supabase próprio, separado de qualquer outro site.

## Preparar a agenda

1. Use o projeto Supabase da Batista Beauty (`tzhyymajrcqbqynijhgo`).
2. Instale o Node.js LTS e, no PowerShell aberto nesta pasta, autentique e vincule a CLI ao projeto:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref tzhyymajrcqbqynijhgo
   npx supabase@latest db query --linked -f .\supabase\schema.sql
   ```

   O último comando cria as tabelas, permissões e políticas de acesso. Como alternativa, execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor desse mesmo projeto.
3. Em **Authentication → Users**, crie a conta administrativa da Batista Beauty com um e-mail controlado por ela. Copie o UUID desse usuário.
4. No SQL Editor desse mesmo projeto, conceda acesso ao painel:

   ```sql
   insert into public.admins (user_id) values ('UUID-DO-USUARIO-ADMINISTRADOR');
   ```

5. `config.js` já contém a URL do projeto e sua chave pública `publishable`. Configure o e-mail público e a região/bairros atendidos quando essas informações estiverem disponíveis. O Instagram, o WhatsApp e o link de localização enviados pela Batista Beauty já estão configurados. Nunca coloque a chave `service_role`, a senha do banco ou a string de conexão nesse arquivo.
6. Publique as funções de agenda:

   ```powershell
   npx supabase@latest functions deploy booking-slots --no-verify-jwt
   npx supabase@latest functions deploy create-booking --no-verify-jwt
   ```

   O projeto já está escolhido; não vincule nem execute o schema em outro projeto, como o da DMM Montagens.

## E-mails de agendamento

Para enviar e-mails, configure no projeto Supabase os segredos `RESEND_API_KEY`, `ADMIN_EMAIL` e `EMAIL_FROM`. `ADMIN_EMAIL` é o endereço da equipe; `EMAIL_FROM` deve ser um endereço de um domínio próprio verificado no Resend, por exemplo `Batista Beauty <agenda@seudominio.com>`. Uma conta Gmail verificada não substitui a verificação de domínio exigida pelo Resend. Não envie a chave de API pelo chat nem a coloque no `config.js`.

No PowerShell, depois de vincular a CLI ao projeto:

```powershell
npx supabase secrets set RESEND_API_KEY="SUA_CHAVE_RESEND" ADMIN_EMAIL="EMAIL_DA_BATISTA_BEAUTY" EMAIL_FROM="Batista Beauty <agenda@SEU_DOMINIO_VERIFICADO>" --project-ref SEU_PROJECT_REF
npx supabase functions deploy create-booking --no-verify-jwt
```

O pedido permanece salvo mesmo que o envio de e-mail falhe. A cliente recebe uma mensagem com os detalhes do pedido, e `/gestao/` mostra a agenda para a administradora. O horário só fica confirmado após o retorno da Batista Beauty.

## Serviços e agenda

O site vem com quatro opções iniciais: extensão de cílios (120 min), manutenção de cílios (90 min), procedimentos estéticos (90 min) e curso de extensão de cílios (360 min). A administradora pode ajustar essas durações no painel. Os horários são oferecidos em intervalos de 30 minutos, de segunda a sábado, com atendimentos entre 08:00 e 18:00; não há agendamento aos domingos. Bloqueios e pedidos pendentes ou confirmados são considerados na disponibilidade.

O carrossel mostra a foto de cílios enviada pela Batista Beauty e seis imagens ilustrativas do Pexels. As imagens do Pexels são apenas referências e não representam clientes nem procedimentos realizados pela clínica. Quando as outras fotos próprias forem enviadas, elas podem ser adicionadas à pasta `assets/` e ao carrossel.

## Publicar

Publique o conteúdo desta pasta em um repositório Git separado e habilite o GitHub Pages para a branch principal e a raiz. Configure as variáveis públicas em `config.js` antes de abrir o agendamento. A área `/gestao/` usa a mesma conta Supabase e exige uma conta administrativa cadastrada; não compartilhe credenciais.
