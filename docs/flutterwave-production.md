# Flutterwave production setup

The application uses Flutterwave’s hosted checkout for a **single verified merchant account** and a **USD-only, card-only** payment flow. The application never receives card numbers. It creates a payment intent on the server, redirects the supporter to Flutterwave, verifies the redirect server-side, and accepts only signed webhooks that match a stored transaction reference, USD currency, and expected amount.

## Vercel environment variables

Add these variables to the production environment only:

| Variable | Value | Exposure |
| --- | --- | --- |
| `FLW_PUBLIC_KEY` | Live Flutterwave public key, if needed for future client-side features | Public-safe; not currently required by the server hosted-checkout flow |
| `FLW_SECRET_KEY` | Live Flutterwave secret key | Server-only; never commit or expose it in browser code |
| `FLW_SECRET_HASH` | Random webhook secret hash configured in Flutterwave Dashboard → Settings → Webhooks | Server-only |
| `DATABASE_URL` | Production Neon/Postgres connection string | Server-only |
| `APP_URL` | Final production domain | Server-side callback URL source |

The payment button intentionally fails closed until `FLW_SECRET_KEY` and `DATABASE_URL` exist. This prevents the public preview from implying that a donation was accepted when no durable payment record can be written.

No customer ID or payment-method ID is required or stored by this platform. Flutterwave collects card details on its hosted checkout page.

## Flutterwave dashboard settings

Set the webhook URL to:

`https://charity-navigator-nu.vercel.app/api/flutterwave/webhook`

Configure the same random value in the dashboard webhook secret-hash field and `FLW_SECRET_HASH`. Enable webhook retries. Keep the account in live mode only after the test flow has been completed with test keys and test cards.

## Flow coverage

The basket sends the selected charities, one-time amounts, fee-coverage choice, anonymity choice, supporter name, receipt email, and optional giving note into a server-side payment intent. The hosted payment is locked to `USD` and `card`. Monthly items are rejected until recurring billing is separately implemented and tested.

The callback and webhook both verify the transaction with Flutterwave before marking the intent successful. A payment is accepted only when the transaction is `successful`, its `tx_ref` matches the server-generated reference, its currency is `USD`, and its amount is at least the stored expected amount.

## Important merchant responsibility

This configuration routes funds to the one Flutterwave merchant account. It does not automatically transfer money to the listed charities. Confirm that the merchant account, nonprofit authorization, donor receipts, tax language, refund policy, and fund-disbursement process match the organization operating this site before enabling live charges.
