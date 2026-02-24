-- Function to automatically create a user profile in public.users when a new user signs up in auth.users
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

-- Trigger to call the function on insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
