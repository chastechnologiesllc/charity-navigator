do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'payment_intents'
      and column_name = 'flutterwave_transaction_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'payment_intents'
      and column_name = 'provider_transaction_id'
  ) then
    alter table payment_intents
      rename column flutterwave_transaction_id to provider_transaction_id;
  end if;
end
$$;
