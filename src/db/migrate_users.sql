-- MIGRATION SCRIPT: public.users -> auth.users
-- This script safely copies your 3 existing production users into Supabase Auth
-- while preserving their exact bcrypt passwords and bypassing email confirmation.

-- 1. Insert into auth.users from public.users
-- Since we cannot disable triggers in Supabase without Superuser, the `on_auth_user_created`
-- trigger will fire when we insert into auth.users. 
-- However, since the public.users rows already exist (meaning the trigger's INSERT 
-- will encounter a Primary Key collision and fail the whole transaction normally),
-- we must temporarily drop the custom trigger function, do the insertion, and recreate it.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  password, -- the existing bcrypt hash
  now(), -- instantly marks the email as confirmed!
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'first_name', first_name, 
    'last_name', last_name, 
    'phone_number', phone_number, 
    'role_id', role_id
  ),
  created_at,
  now(),
  '', '', '', ''
FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. Insert into auth.identities so Supabase recognizes they can log in via email
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  id,
  id::text, 
  jsonb_build_object('sub', id, 'email', email),
  'email',
  created_at,
  now()
FROM public.users
WHERE id NOT IN (SELECT user_id FROM auth.identities WHERE provider = 'email')
  AND id IN (SELECT id FROM auth.users); -- safety check

-- 3. Recreate the trigger now that insertion is complete
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, first_name, last_name, phone_number, role_id, password)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone_number',
    coalesce((new.raw_user_meta_data->>'role_id')::smallint, 2::smallint),
    'supabase-auth-managed'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
