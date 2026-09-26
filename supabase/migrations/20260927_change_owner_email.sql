-- Switch production owner email to namaual@gmail.com
-- Safe to run before or after creating the new Auth user.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,''), '@', 1)),
    case when lower(coalesce(new.email,'')) = 'namaual@gmail.com' then 'owner' else 'staff' end,
    case when lower(coalesce(new.email,'')) = 'namaual@gmail.com' then true else false end
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    role = case
      when lower(excluded.email) = 'namaual@gmail.com' then 'owner'
      else public.profiles.role
    end,
    is_active = case
      when lower(excluded.email) = 'namaual@gmail.com' then true
      else public.profiles.is_active
    end;
  return new;
end;
$$;

update public.profiles p
set email = u.email,
    role = 'owner',
    is_active = true
from auth.users u
where p.id = u.id
  and lower(coalesce(u.email,'')) = 'namaual@gmail.com';
