# Batista Beauty

Site responsivo para divulgar os serviços e preços do catálogo Batista Beauty e solicitar reservas online. A reserva exige o envio de comprovante do sinal de 50%; a equipe recebe o anexo por e-mail e confirma o horário no painel privado em `/gestao/`. Este projeto deve usar um projeto Supabase próprio, separado de qualquer outro site.

## Preparar a agenda

1. Use o projeto Supabase da Batista Beauty (`tzhyymajrcqbqynijhgo`).
2. Instale o Node.js LTS e, no PowerShell aberto nesta pasta, autentique e vincule a CLI ao projeto:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref tzhyymajrcqbqynijhgo
   npx supabase@latest db query --file .\supabase\schema.sql --remote
   ```

   O último comando cria as tabelas, permissões e políticas de acesso. Como alternativa, execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor desse mesmo projeto. Se a agenda já estava instalada, execute o schema novamente para adicionar o registro do aceite da política do sinal.
3. Em **Authentication → Users**, crie a conta administrativa da Batista Beauty com um e-mail controlado por ela. Copie o UUID desse usuário.
4. No SQL Editor desse mesmo projeto, conceda acesso ao painel:

   ```sql
   insert into public.admins (user_id) values ('UUID-DO-USUARIO-ADMINISTRADOR');
   ```

5. `config.js` já contém a URL do projeto, sua chave pública `publishable` e a chave Pix `42298943842`. Configure o e-mail público e a região/bairros atendidos quando essas informações estiverem disponíveis. O Instagram, o WhatsApp e o link de localização enviados pela Batista Beauty já estão configurados. Nunca coloque a chave `service_role`, a senha do banco ou a string de conexão nesse arquivo.
6. Publique as funções de agenda:

   ```powershell
   npx supabase@latest functions deploy booking-slots --no-verify-jwt
   npx supabase@latest functions deploy create-booking --no-verify-jwt
   npx supabase@latest functions deploy confirm-booking
   ```

   O projeto já está escolhido; não vincule nem execute o schema em outro projeto, como o da DMM Montagens.

## E-mails de agendamento

Para enviar e-mails, configure no projeto Supabase os segredos `RESEND_API_KEY`, `ADMIN_EMAIL` e `EMAIL_FROM`. `ADMIN_EMAIL` é o endereço da equipe; `EMAIL_FROM` deve ser um endereço de um domínio próprio verificado no Resend, por exemplo `Batista Beauty <agenda@seudominio.com>`. Uma conta Gmail verificada não substitui a verificação de domínio exigida pelo Resend. Não envie a chave de API pelo chat nem a coloque no `config.js`.

No PowerShell, depois de vincular a CLI ao projeto:

```powershell
npx supabase secrets set RESEND_API_KEY="SUA_CHAVE_RESEND" ADMIN_EMAIL="EMAIL_DA_BATISTA_BEAUTY" EMAIL_FROM="Batista Beauty <agenda@SEU_DOMINIO_VERIFICADO>"
npx supabase functions deploy create-booking --no-verify-jwt
npx supabase functions deploy confirm-booking
```

O comprovante JPG, PNG, WEBP ou PDF (até 5 MB) é mantido apenas em memória durante o processamento e anexado aos e-mails da cliente e da equipe; o arquivo não é armazenado no Supabase. O pedido permanece salvo mesmo se o envio falhar. `/gestao/` mostra o valor, o sinal, o meio de pagamento e se o e-mail com comprovante foi enviado à equipe. A confirmação fica bloqueada até esse envio; depois, a equipe confere o anexo recebido por e-mail e confirma o agendamento pelo painel. O formulário exige que a cliente aceite a política do sinal e registra a data/hora do aceite. O cliente recebe um e-mail de confirmação sem o comprovante, informando que faltas ou cancelamentos não geram devolução, salvo hipóteses previstas em lei, e deve falar com a equipe pelo WhatsApp para comunicar o cancelamento.

## Serviços e agenda

O catálogo inclui os volumes e manutenções de cílios, design de sobrancelhas, tratamentos labiais, estética facial e corporal. Os valores do catálogo são calculados no servidor; o sinal corresponde a 50% arredondado para baixo ao real inteiro, sem centavos. Planos estéticos personalizados precisam de orçamento e não podem ser reservados online sem valor definido. A administradora configura no painel as durações de extensão de cílios (120 min), manutenção (90 min) e os demais procedimentos (90 min). Os horários são oferecidos em intervalos de 30 minutos, de segunda a sábado, entre 08:00 e 18:00; não há agendamento aos domingos. Pedidos com comprovante pendentes e reservas confirmadas ocupam o horário até serem confirmados ou cancelados.

O carrossel mostra a foto de cílios enviada pela Batista Beauty e seis imagens ilustrativas do Pexels. As imagens do Pexels são apenas referências e não representam clientes nem procedimentos realizados pela clínica. Quando as outras fotos próprias forem enviadas, elas podem ser adicionadas à pasta `assets/` e ao carrossel.

## Publicar

Publique o conteúdo desta pasta em um repositório Git separado e habilite o GitHub Pages para a branch principal e a raiz. Configure as variáveis públicas em `config.js` antes de abrir o agendamento. A área `/gestao/` usa a mesma conta Supabase e exige uma conta administrativa cadastrada; não compartilhe credenciais.
