-- 1. Modify existing sales table constraints
-- Drop the existing constraint (Supabase might name it sales_payment_status_check, but we should do it safely)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_status_check CHECK (payment_status in ('PENDING', 'PAID', 'ORDERED'));

-- 2. Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references customers(id) on delete set null,
  total_amount numeric(10, 2) not null,
  status text not null check (status in ('CAPTURED', 'READY', 'COLLECTED')),
  invoice_file_url text, -- Supplier invoice
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Order Items Table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  book_id bigint references books(id) on delete set null,
  quantity integer not null,
  price numeric(10, 2) not null
);

-- Note: When an order becomes READY, we will create a corresponding sale record with 'ORDERED' payment_status,
-- and copy the order_items into sale_items.
