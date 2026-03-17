-- =============================================
-- AgendaPro - Schema SQL para Supabase
-- Cole e execute no SQL Editor do Supabase
-- =============================================

-- 1. PROFILES (dados públicos do profissional)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  profession text not null default '',
  bio text,
  phone text,
  city text,
  state text,
  avatar_url text,
  cover_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- 2. SERVICES (serviços oferecidos pelo profissional)
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

-- 4. REVIEWS (avaliações)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles on delete cascade not null,
  appointment_id uuid references public.appointments on delete set null,
  client_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;

-- Profiles: qualquer um pode ver, só o dono pode editar
create policy "Profiles são públicos" on public.profiles for select using (true);
create policy "Dono edita próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Dono insere próprio perfil" on public.profiles for insert with check (auth.uid() = id);

-- Services: qualquer um pode ver, só o dono pode gerenciar
create policy "Serviços são públicos" on public.services for select using (true);
create policy "Dono gerencia serviços" on public.services for all using (
  auth.uid() = (select id from public.profiles where id = profile_id)
);

-- Appointments: dono vê os próprios, qualquer um pode criar
create policy "Dono vê agendamentos" on public.appointments for select using (
  auth.uid() = profile_id
);
create policy "Qualquer um pode criar agendamento" on public.appointments for insert with check (true);
create policy "Dono atualiza agendamento" on public.appointments for update using (
  auth.uid() = profile_id
);

-- Reviews: públicas para leitura, qualquer um pode criar
create policy "Reviews são públicas" on public.reviews for select using (true);
create policy "Qualquer um pode criar review" on public.reviews for insert with check (true);

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

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_profile_rating();
