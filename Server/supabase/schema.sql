-- LibraEase Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push` if using the CLI)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ADMIN','EMPLOYEE','PATRON')),
  firstname text not null,
  lastname text not null,
  email text unique not null,
  password text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED'))
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  barcode text unique not null,
  cover text not null,
  title text unique not null,
  authors text[] not null,
  description text not null,
  subjects text[] not null,
  publication_date date not null,
  publisher text not null,
  pages int not null,
  genre text not null
);

create table if not exists library_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade
);

create table if not exists loan_records (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('AVAILABLE','LOANED')),
  loaned_date timestamptz not null,
  due_date timestamptz not null,
  returned_date timestamptz,
  patron uuid not null references users(id),
  employee_out uuid not null references users(id),
  employee_in uuid references users(id),
  item uuid not null references books(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loan_records_item on loan_records(item);
create index if not exists idx_loan_records_patron on loan_records(patron);
create index if not exists idx_books_barcode on books(barcode);

-- New signups land as PENDING and can't log in until an admin approves them
-- (see UserService.approveUser). Since there's no admin yet on a fresh
-- database, manually approve your first admin account after registering it:
--   update users set status = 'APPROVED' where email = 'you@example.com';
