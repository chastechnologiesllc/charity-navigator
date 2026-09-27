alter table payment_intents
  add column if not exists flutterwave_charge_id text;

alter table payment_events
  add column if not exists provider_event_id text;

create unique index if not exists payment_intents_flutterwave_charge_id_uidx
  on payment_intents (flutterwave_charge_id)
  where flutterwave_charge_id is not null;

create unique index if not exists payment_events_provider_event_id_uidx
  on payment_events (provider_event_id)
  where provider_event_id is not null;
