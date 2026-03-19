-- =============================================
-- AgendaPro - Schema SQL para Supabase
-- Cole e execute no SQL Editor do Supabase
-- =============================================

create extension if not exists pgcrypto;

-- 1. PROFILES (dados do profissional)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  profession text not null default '',
  bio text,
  phone text,
  public_phone boolean not null default false,
  city text,
  state text,
  avatar_url text,
  cover_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  role text not null default 'user' check (role in ('user', 'admin')),
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  slug text unique not null,
  referred_by text,
  schedule jsonb not null default '{}'::jsonb,
  booking_enabled boolean not null default true,
  booking_requires_confirmation boolean not null default true,
  whatsapp_settings jsonb not null default '{"confirmacao": true, "lembrete24h": true, "lembrete1h": false, "cancelamento": true, "avaliacaoPos": true}'::jsonb,
  whatsapp_templates jsonb not null default '{"confirmacao": "Ola, {nome}! Seu agendamento foi confirmado.\n\nServico: {servico}\nData: {data} as {hora}\n\nAte la!", "lembrete24h": "Ola, {nome}! Lembrete: voce tem um agendamento amanha.\n\nServico: {servico}\nHorario: {hora}\n\nAte amanha!"}'::jsonb,
  marketing_settings jsonb not null default '{"coupon": {"code": "PROMO10", "discount": "10", "type": "percent"}, "selectedPost": 0}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists public_phone boolean not null default false;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists referred_by text;
alter table public.profiles add column if not exists schedule jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists booking_enabled boolean not null default true;
alter table public.profiles add column if not exists booking_requires_confirmation boolean not null default true;
alter table public.profiles add column if not exists whatsapp_settings jsonb not null default '{"confirmacao": true, "lembrete24h": true, "lembrete1h": false, "cancelamento": true, "avaliacaoPos": true}'::jsonb;
alter table public.profiles add column if not exists whatsapp_templates jsonb not null default '{"confirmacao": "Ola, {nome}! Seu agendamento foi confirmado.\n\nServico: {servico}\nData: {data} as {hora}\n\nAte la!", "lembrete24h": "Ola, {nome}! Lembrete: voce tem um agendamento amanha.\n\nServico: {servico}\nHorario: {hora}\n\nAte amanha!"}'::jsonb;
alter table public.profiles add column if not exists marketing_settings jsonb not null default '{"coupon": {"code": "PROMO10", "discount": "10", "type": "percent"}, "selectedPost": 0}'::jsonb;
alter table public.profiles add column if not exists photos jsonb not null default '[]'::jsonb;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));

-- 2. SERVICES (servicos oferecidos pelo profissional)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_minutes int not null default 60,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. APPOINTMENTS (agendamentos)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles on delete cascade not null,
  service_id uuid references public.services on delete set null,
  client_name text not null,
  client_phone text not null,
  client_email text,
  date date not null,
  time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

-- 4. REVIEWS (avaliacoes)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles on delete cascade not null,
  appointment_id uuid references public.appointments on delete set null,
  client_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- 5. REFERRALS (indicacoes registradas)
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid references public.profiles on delete cascade not null,
  referred_profile_id uuid references public.profiles on delete cascade not null unique,
  referral_slug text not null,
  status text not null default 'registered' check (status in ('registered', 'converted')),
  converted_plan text check (converted_plan in ('pro', 'business')),
  credit_amount numeric(10,2) not null default 0,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_unique_appointment_idx
  on public.reviews (appointment_id)
  where appointment_id is not null;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.referrals enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.viewer_can_read_profile(profile_owner uuid, referral_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = profile_owner
    or public.is_admin()
    or exists (
      select 1
      from public.profiles viewer
      where viewer.id = auth.uid()
        and viewer.slug = referral_slug
    );
$$;


create or replace function public.can_accept_public_booking(profile_uuid uuid, service_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.services s on s.profile_id = p.id
    where p.id = profile_uuid
      and s.id = service_uuid
      and p.booking_enabled = true
      and s.active = true
  );
$$;

drop policy if exists "Profiles sao publicos" on public.profiles;
drop policy if exists "Dono edita proprio perfil" on public.profiles;
drop policy if exists "Dono insere proprio perfil" on public.profiles;
drop policy if exists "Owner or admin reads profile" on public.profiles;
drop policy if exists "Owner or admin updates profile" on public.profiles;
drop policy if exists "Owner or admin inserts profile" on public.profiles;

create policy "Owner or admin reads profile" on public.profiles
  for select
  using (public.viewer_can_read_profile(id, referred_by));

create policy "Owner or admin updates profile" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "Owner or admin inserts profile" on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Servicos sao publicos" on public.services;
drop policy if exists "Dono gerencia servicos" on public.services;
drop policy if exists "Owner or admin manages services" on public.services;

create policy "Servicos sao publicos" on public.services for select using (true);
create policy "Owner or admin manages services" on public.services
  for all
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

drop policy if exists "Dono ve agendamentos" on public.appointments;
drop policy if exists "Qualquer um pode criar agendamento" on public.appointments;
drop policy if exists "Dono atualiza agendamento" on public.appointments;
drop policy if exists "Owner or admin reads appointments" on public.appointments;
drop policy if exists "Validated public booking insert" on public.appointments;
drop policy if exists "Owner or admin inserts appointments" on public.appointments;
drop policy if exists "Owner or admin updates appointments" on public.appointments;

create policy "Owner or admin reads appointments" on public.appointments
  for select
  using (auth.uid() = profile_id or public.is_admin());

create policy "Validated public booking insert" on public.appointments
  for insert
  with check (
    public.can_accept_public_booking(appointments.profile_id, appointments.service_id)
    and char_length(regexp_replace(appointments.client_phone, '\D', '', 'g')) >= 10
  );

create policy "Owner or admin inserts appointments" on public.appointments
  for insert
  with check (
    auth.uid() = profile_id
    or public.is_admin()
  );

create policy "Owner or admin updates appointments" on public.appointments
  for update
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

drop policy if exists "Reviews sao publicas" on public.reviews;
drop policy if exists "Qualquer um pode criar review" on public.reviews;
drop policy if exists "Review only for completed appointment" on public.reviews;

create policy "Reviews sao publicas" on public.reviews for select using (true);
create policy "Review only for completed appointment" on public.reviews
  for insert
  with check (
    appointment_id is not null
    and exists (
      select 1
      from public.appointments a
      where a.id = reviews.appointment_id
        and a.profile_id = reviews.profile_id
        and a.status = 'completed'
    )
  );

drop policy if exists "Owner or admin reads referrals" on public.referrals;

create policy "Owner or admin reads referrals" on public.referrals
  for select
  using (auth.uid() = referrer_profile_id or auth.uid() = referred_profile_id or public.is_admin());

-- =============================================
-- SUPERFICIES PUBLICAS SEGURAS
-- =============================================

create or replace view public.public_profiles as
select
  id,
  full_name,
  profession,
  bio,
  city,
  state,
  avatar_url,
  cover_url,
  rating,
  review_count,
  slug,
  plan,
  booking_enabled,
  booking_requires_confirmation,
  schedule,
  case when public_phone then phone else null end as phone,
  coalesce(photos, '[]'::jsonb) as photos
from public.profiles
where booking_enabled = true
  and role <> 'admin';

grant select on public.public_profiles to anon, authenticated;

create or replace function public.get_public_booked_slots(profile_uuid uuid, slot_date date)
returns table (slot_time time)
language sql
stable
security definer
set search_path = public
as $$
  select a.time as slot_time
  from public.appointments a
  inner join public.services s on s.id = a.service_id
  inner join public.profiles p on p.id = a.profile_id
  where a.profile_id = profile_uuid
    and a.date = slot_date
    and a.status <> 'cancelled'
    and s.active = true
    and p.booking_enabled = true;
$$;

grant execute on function public.get_public_booked_slots(uuid, date) to anon, authenticated;

create or replace function public.get_public_referrer(ref_slug text)
returns table (
  profile_id uuid,
  full_name text,
  profession text,
  slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as profile_id,
    p.full_name,
    p.profession,
    p.slug
  from public.profiles p
  where p.slug = ref_slug
    and p.role <> 'admin'
  limit 1;
$$;

grant execute on function public.get_public_referrer(text) to anon, authenticated;

create or replace function public.get_public_review_request(review_appointment_id uuid)
returns table (
  appointment_id uuid,
  profile_id uuid,
  professional_name text,
  professional_slug text,
  service_name text,
  client_name text,
  appointment_date date,
  appointment_time time,
  review_exists boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id as appointment_id,
    a.profile_id,
    p.full_name as professional_name,
    p.slug as professional_slug,
    coalesce(s.name, 'Atendimento') as service_name,
    a.client_name,
    a.date as appointment_date,
    a.time as appointment_time,
    exists (
      select 1
      from public.reviews r
      where r.appointment_id = a.id
    ) as review_exists
  from public.appointments a
  join public.profiles p on p.id = a.profile_id
  left join public.services s on s.id = a.service_id
  where a.id = review_appointment_id
    and a.status = 'completed';
$$;

grant execute on function public.get_public_review_request(uuid) to anon, authenticated;

create or replace function public.sync_referral_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer_record public.profiles%rowtype;
  next_status text;
  next_credit numeric(10,2);
begin
  if new.referred_by is null or length(trim(new.referred_by)) = 0 then
    delete from public.referrals where referred_profile_id = new.id;
    return new;
  end if;

  select *
  into referrer_record
  from public.profiles
  where slug = new.referred_by
    and role <> 'admin'
  limit 1;

  if referrer_record.id is null or referrer_record.id = new.id then
    delete from public.referrals where referred_profile_id = new.id;
    return new;
  end if;

  next_status := case when new.plan in ('pro', 'business') then 'converted' else 'registered' end;
  next_credit := case when new.plan in ('pro', 'business') then 25 else 0 end;

  insert into public.referrals (
    referrer_profile_id,
    referred_profile_id,
    referral_slug,
    status,
    converted_plan,
    credit_amount,
    converted_at
  )
  values (
    referrer_record.id,
    new.id,
    new.referred_by,
    next_status,
    case when next_status = 'converted' then new.plan else null end,
    next_credit,
    case when next_status = 'converted' then now() else null end
  )
  on conflict (referred_profile_id) do update
  set
    referrer_profile_id = excluded.referrer_profile_id,
    referral_slug = excluded.referral_slug,
    status = excluded.status,
    converted_plan = excluded.converted_plan,
    credit_amount = excluded.credit_amount,
    converted_at = case
      when public.referrals.converted_at is not null then public.referrals.converted_at
      when excluded.converted_at is not null then excluded.converted_at
      else null
    end;

  return new;
end;
$$;

-- =============================================
-- TRIGGER: atualiza rating do perfil ao criar review
-- =============================================

create or replace function public.update_profile_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    rating = (select avg(rating) from public.reviews where profile_id = new.profile_id),
    review_count = (select count(*) from public.reviews where profile_id = new.profile_id)
  where id = new.profile_id;
  return new;
end;
$$;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_profile_rating();

drop trigger if exists on_profile_referral_sync on public.profiles;
create trigger on_profile_referral_sync
  after insert or update of referred_by, plan on public.profiles
  for each row execute procedure public.sync_referral_from_profile();




