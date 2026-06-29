-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.admin_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.design_versions enable row level security;
alter table public.votes enable row level security;

-- ============================================================
-- HELPER: check if the current user is an admin
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- ============================================================
-- admin_allowlist policies
-- ============================================================
create policy "admins can read allowlist"
  on public.admin_allowlist for select
  using (public.is_admin());

create policy "admins can insert allowlist"
  on public.admin_allowlist for insert
  with check (public.is_admin());

create policy "admins can delete allowlist"
  on public.admin_allowlist for delete
  using (public.is_admin());

-- ============================================================
-- profiles policies
-- ============================================================
create policy "admins can read profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "user can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "user can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- ============================================================
-- projects policies
-- ============================================================
-- Public: only live projects
create policy "public can read live projects"
  on public.projects for select
  using (public.is_project_live(status, deadline));

-- Admins: full access to own projects
create policy "admins can read own projects"
  on public.projects for select
  using (public.is_admin() and created_by = auth.uid());

create policy "admins can insert projects"
  on public.projects for insert
  with check (public.is_admin() and created_by = auth.uid());

create policy "admins can update own projects"
  on public.projects for update
  using (public.is_admin() and created_by = auth.uid())
  with check (public.is_admin() and created_by = auth.uid());

create policy "admins can delete own projects"
  on public.projects for delete
  using (public.is_admin() and created_by = auth.uid());

-- ============================================================
-- design_versions policies
-- ============================================================
create policy "public can read versions of live projects"
  on public.design_versions for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_project_live(p.status, p.deadline)
    )
  );

create policy "admins can read versions of own projects"
  on public.design_versions for select
  using (
    public.is_admin() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

create policy "admins can insert versions for own projects"
  on public.design_versions for insert
  with check (
    public.is_admin() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

create policy "admins can update versions of own projects"
  on public.design_versions for update
  using (
    public.is_admin() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

create policy "admins can delete versions of own projects"
  on public.design_versions for delete
  using (
    public.is_admin() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

-- ============================================================
-- votes policies
-- ============================================================
-- Public: insert only (no select)
create policy "public can insert votes"
  on public.votes for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_project_live(p.status, p.deadline)
    )
  );

-- Admins: select votes for own projects only
create policy "admins can read votes for own projects"
  on public.votes for select
  using (
    public.is_admin() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

-- ============================================================
-- STORAGE RLS
-- ============================================================
create policy "public read designs bucket"
  on storage.objects for select
  using (bucket_id = 'designs');

create policy "admins can upload to designs bucket"
  on storage.objects for insert
  with check (bucket_id = 'designs' and public.is_admin());

create policy "admins can update designs bucket"
  on storage.objects for update
  using (bucket_id = 'designs' and public.is_admin());

create policy "admins can delete from designs bucket"
  on storage.objects for delete
  using (bucket_id = 'designs' and public.is_admin());
