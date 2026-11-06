# Batista Beauty

Site responsivo para divulgar os serviços e preços do catálogo Batista Beauty e solicitar reservas online. A reserva exige o envio de comprovante do sinal de 50%; o painel privado em `/gestao/` permite conferir o anexo e confirmar o horário. Este projeto deve usar um projeto Supabase próprio, separado de qualquer outro site.

## Preparar a agenda

1. Use o projeto Supabase da Batista Beauty (`tzhyymajrcqbqynijhgo`).
2. Instale o Node.js LTS e, no PowerShell aberto nesta pasta, autentique e vincule a CLI ao projeto:

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref tzhyymajrcqbqynijhgo
   npx supabase@latest db query --linked -f .\supabase\schema.sql
   ```

   O último comando cria as tabelas, permissões, armazenamento privado para comprovantes e políticas de acesso. Como alternativa, execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor desse mesmo projeto.
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
   ```

   O projeto já está escolhido; não vincule nem execute o schema em outro projeto, como o da DMM Montagens.

## E-mails de agendamento

Para enviar e-mails, configure no projeto Supabase os segredos `RESEND_API_KEY`, `ADMIN_EMAIL` e `EMAIL_FROM`. `ADMIN_EMAIL` é o endereço da equipe; `EMAIL_FROM` deve ser um endereço de um domínio próprio verificado no Resend, por exemplo `Batista Beauty <agenda@seudominio.com>`. Uma conta Gmail verificada não substitui a verificação de domínio exigida pelo Resend. Não envie a chave de API pelo chat nem a coloque no `config.js`.

No PowerShell, depois de vincular a CLI ao projeto:

```powershell
npx supabase secrets set RESEND_API_KEY="SUA_CHAVE_RESEND" ADMIN_EMAIL="EMAIL_DA_BATISTA_BEAUTY" EMAIL_FROM="Batista Beauty <agenda@SEU_DOMINIO_VERIFICADO>" --project-ref SEU_PROJECT_REF
npx supabase functions deploy create-booking --no-verify-jwt
```

O comprovante JPG, PNG, WEBP ou PDF (até 5 MB) é guardado em um bucket privado, anexado aos e-mails enviados à cliente e à equipe e acessível pelo painel apenas a administradores. O pedido permanece salvo mesmo que o envio de e-mail falhe. A cliente recebe os detalhes do pedido, e `/gestao/` mostra o valor, o sinal, o meio de pagamento e o link para abrir o comprovante. O horário só fica confirmado depois que a equipe confere o pagamento e aprova o pedido.

## Serviços e agenda

O catálogo inclui os volumes e manutenções de cílios, design de sobrancelhas, tratamentos labiais, estética facial e corporal. Os valores do catálogo são calculados no servidor; a tela mostra o total e o sinal exato de 50%. Planos estéticos personalizados precisam de orçamento e não podem ser reservados online sem valor definido. A administradora configura no painel as durações de extensão de cílios (120 min), manutenção (90 min) e os demais procedimentos (90 min). Os horários são oferecidos em intervalos de 30 minutos, de segunda a sábado, entre 08:00 e 18:00; não há agendamento aos domingos. Pedidos com comprovante pendentes e reservas confirmadas ocupam o horário até serem confirmados ou cancelados.

O carrossel mostra a foto de cílios enviada pela Batista Beauty e seis imagens ilustrativas do Pexels. As imagens do Pexels são apenas referências e não representam clientes nem procedimentos realizados pela clínica. Quando as outras fotos próprias forem enviadas, elas podem ser adicionadas à pasta `assets/` e ao carrossel.

## Publicar

Publique o conteúdo desta pasta em um repositório Git separado e habilite o GitHub Pages para a branch principal e a raiz. Configure as variáveis públicas em `config.js` antes de abrir o agendamento. A área `/gestao/` usa a mesma conta Supabase e exige uma conta administrativa cadastrada; não compartilhe credenciais.
