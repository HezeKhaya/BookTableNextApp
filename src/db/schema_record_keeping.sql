-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Invoices Table
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  file_url text not null,
  supplier_name text not null,
  invoice_date date not null,
  amount numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Customers Table (for manual sales)
create table customers (
  id uuid default uuid_generate_v4() primary key,
  first_name text not null,
  last_name text not null,
  phone_number text not null,
  email text,
  linked_user_id uuid references auth.users(id), -- Optional link to real user
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sales Table
create table sales (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references customers(id) on delete set null,
  total_amount numeric(10, 2) not null,
  payment_type text not null check (payment_type in ('CASH', 'EFT')),
  payment_status text not null check (payment_status in ('PENDING', 'PAID')),
  pop_file_url text, -- Proof of Payment URL
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Sale Items Table
create table sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade not null,
  book_id bigint references books(id) on delete set null, -- Assuming books.id is bigint
  quantity integer not null,
  price_at_sale numeric(10, 2) not null
);

-- 5. Stock Snapshots Table
create table stock_snapshots (
  id uuid default uuid_generate_v4() primary key,
  snapshot_date timestamp with time zone default timezone('utc'::text, now()) not null,
  total_books_count integer not null,
  total_value numeric(10, 2) not null,
  created_by uuid references users(id),
  data jsonb default '{}'::jsonb -- Stores the full inventory state
);

-- Storage Buckets (Run these in Supabase Storage dashboard or via Policy)
-- insert into storage.buckets (id, name) values ('invoices', 'invoices');
-- insert into storage.buckets (id, name) values ('proofs_of_payment', 'proofs_of_payment');
