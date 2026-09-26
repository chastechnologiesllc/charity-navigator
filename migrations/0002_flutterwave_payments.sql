create table if not exists payment_intents (
  id text primary key,
  tx_ref text not null unique,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency = 'USD'),
  customer_email text not null,
  customer_name text,
  items_json text not null,
  note text,
  anonymous boolean not null default false,
  status text not null default 'pending',
  flutterwave_transaction_id text,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists payment_events (
  id text primary key,
  tx_ref text,
  event_type text,
  payload_json text not null,
  received_at timestamptz not null default current_timestamp
);

create index if not exists payment_intents_status_idx on payment_intents (status);
create index if not exists payment_events_tx_ref_idx on payment_events (tx_ref);
