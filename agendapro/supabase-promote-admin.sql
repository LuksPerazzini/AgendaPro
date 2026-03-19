-- Execute este SQL no editor do Supabase se a conta do admin já existir.
-- Troque o email abaixo pelo email real do administrador.

update public.profiles
set
  role = 'admin',
  plan = 'business',
  booking_enabled = true
where id = (
  select id
  from auth.users
  where email = 'admin@agendapro.com'
);
