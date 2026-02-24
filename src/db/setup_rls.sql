-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. ENABLE RLS ON ALL TABLES
alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.invoices enable row level security;
alter table public.stock_snapshots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ==========================================
-- USERS TABLE POLICIES
-- ==========================================
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" 
on public.users for select 
using ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" 
on public.users for update
using ( auth.uid() = id );

-- Admins (role_id > 1) can view all users
-- Note: We read role_id from the secure JWT user_metadata to prevent infinite recursion on this table!
drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users" 
on public.users for select 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );

-- Admins (role_id > 1) can manage all users (update, delete) if needed
drop policy if exists "Admins can manage all users" on public.users;
create policy "Admins can manage all users" 
on public.users for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );

-- Note: Insert is still handled securely by our auth trigger with security definer!


-- ==========================================
-- BOOKS TABLE POLICIES
-- ==========================================
-- Anyone (even anonymous visitors) can view books in the catalog
drop policy if exists "Anyone can view books" on public.books;
create policy "Anyone can view books" 
on public.books for select 
using ( true );

-- Only Admins can insert, update, or delete books
drop policy if exists "Admins can manage books" on public.books;
create policy "Admins can manage books" 
on public.books for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );


-- ==========================================
-- CUSTOMERS TABLE POLICIES 
-- ==========================================
-- Admins can view and manage all customers
drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers" 
on public.customers for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );


-- ==========================================
-- SALES & SALE_ITEMS TABLE POLICIES 
-- ==========================================
-- Admins can view and manage all sales
drop policy if exists "Admins can manage sales" on public.sales;
create policy "Admins can manage sales" 
on public.sales for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );

drop policy if exists "Admins can manage sale_items" on public.sale_items;
create policy "Admins can manage sale_items" 
on public.sale_items for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );


-- ==========================================
-- INVOICES TABLE POLICIES 
-- ==========================================
drop policy if exists "Admins can manage invoices" on public.invoices;
create policy "Admins can manage invoices" 
on public.invoices for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );


-- ==========================================
-- STOCK SNAPSHOTS TABLE POLICIES 
-- ==========================================
drop policy if exists "Admins can manage stock snapshots" on public.stock_snapshots;
create policy "Admins can manage stock snapshots" 
on public.stock_snapshots for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );


-- ==========================================
-- ORDERS & ORDER_ITEMS TABLE POLICIES 
-- ==========================================
-- Admins can view and manage all orders
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" 
on public.orders for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );

drop policy if exists "Admins can manage order_items" on public.order_items;
create policy "Admins can manage order_items" 
on public.order_items for all 
using ( coalesce((auth.jwt() -> 'user_metadata' ->> 'role_id')::int, 0) > 1 );
