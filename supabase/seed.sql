-- Seed: add the first admin to the allowlist
-- Replace with the actual email of your first admin
insert into public.admin_allowlist (email, added_by)
values ('admin@company.com', null)
on conflict (email) do nothing;
