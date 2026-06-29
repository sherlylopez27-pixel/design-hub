-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type project_status as enum ('draft', 'active', 'closed');
create type results_mode as enum ('after_vote', 'after_close', 'never');

-- ============================================================
-- TABLES
-- ============================================================

create table public.admin_allowlist (
  email       text primary key check (email = lower(email)),
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now() not null
);

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null unique,
  role        text not null default 'admin',
  created_at  timestamptz default now() not null
);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  status       project_status not null default 'draft',
  deadline     date,
  results_mode results_mode not null default 'after_close',
  slug         text not null unique,
  short_id     text not null unique,
  created_by   uuid not null references public.profiles(id) on delete restrict,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

create table public.design_versions (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  title          text not null,
  image_url      text not null default '',
  figma_link     text not null default '',
  xd_link        text not null default '',
  prototype_link text not null default '',
  position       int not null default 0,
  created_at     timestamptz default now() not null
);

create table public.votes (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  selected_version_id uuid not null references public.design_versions(id) on delete cascade,
  voter_name          text not null,
  voter_email         text not null check (voter_email = lower(voter_email)),
  reason              text not null,
  created_at          timestamptz default now() not null,
  unique (project_id, voter_email)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index votes_project_id_idx on public.votes(project_id);
create index votes_project_version_idx on public.votes(project_id, selected_version_id);
create index design_versions_project_position_idx on public.design_versions(project_id, position);
create index projects_slug_idx on public.projects(slug);
create index projects_short_id_idx on public.projects(short_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- AGGREGATE VOTE COUNTS (security definer — returns only counts)
-- ============================================================
create or replace function public.get_vote_counts(p_project_id uuid)
returns table (version_id uuid, vote_count bigint)
language sql security definer set search_path = public as $$
  select selected_version_id as version_id, count(*) as vote_count
  from votes
  where project_id = p_project_id
  group by selected_version_id;
$$;

create or replace function public.get_total_votes(p_project_id uuid)
returns bigint
language sql security definer set search_path = public as $$
  select count(*) from votes where project_id = p_project_id;
$$;

-- ============================================================
-- HELPER: is_project_live
-- ============================================================
create or replace function public.is_project_live(p project_status, d date)
returns boolean language sql immutable as $$
  select p = 'active' and (d is null or d >= current_date);
$$;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;
