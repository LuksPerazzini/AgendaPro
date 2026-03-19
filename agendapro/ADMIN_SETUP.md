# Admin setup

1. Aplique primeiro o schema atualizado em `supabase-schema.sql`.
2. Defina no terminal:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Execute:
   - `npm run create-admin -- admin@agendapro.com SenhaForte123! "Administrador AgendaPro" "Administrador"`
4. Se a conta já existir, use `supabase-promote-admin.sql` no SQL Editor.

Observações:
- O script cria o usuário no Auth e promove o perfil para `role = 'admin'` e `plan = 'business'`.
- O projeto não deve armazenar `SUPABASE_SERVICE_ROLE_KEY` no frontend nem no `.env` do Vite.
