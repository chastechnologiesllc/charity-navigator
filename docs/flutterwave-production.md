# Flutterwave production setup

The application now targets Flutterwave **v4**. v4 uses OAuth 2.0 and does not expose the v3 hosted-checkout endpoint used by the previous integration. This repository therefore uses the v4 Orders API and fails closed until the merchant has configured the v4 customer and reusable payment-method identifiers required by that API. No Flutterwave credential is committed to this repository.

## Vercel environment variables

Add these variables to the production environment only:

| Variable | Value | Exposure |
| --- | --- | --- |
| `FLW_CLIENT_ID` | Flutterwave v4 OAuth client ID | Server-only |
| `FLW_CLIENT_SECRET` | Flutterwave v4 OAuth client secret | Server-only; never commit or expose it in browser code |
| `FLW_ENVIRONMENT` | `sandbox` for testing or `live` for production | Server-only |
| `FLW_V4_CUSTOMER_ID` | v4 customer identifier used by the Orders API | Server-only |
| `FLW_V4_PAYMENT_METHOD_ID` | v4 reusable payment-method identifier used by the Orders API | Server-only |
| `FLW_SECRET_HASH` | Random webhook secret hash configured in Flutterwave Dashboard → Settings → Webhooks | Server-only |
| `DATABASE_URL` | Production Neon/Postgres connection string | Server-only |
| `APP_URL` | Final production domain | Server-side callback URL source |

The payment button intentionally fails closed until the database and all required v4 settings exist. This prevents the public preview from implying that a donation was accepted when no durable payment record can be written or when Flutterwave v4 is not configured.

## Flutterwave dashboard settings

Set the webhook URL to:

`https://charity-navigator-nu.vercel.app/api/flutterwave/webhook`

Configure the same random value in the dashboard webhook secret-hash field and `FLW_SECRET_HASH`. v4 webhook signatures are validated with HMAC-SHA256 against the raw request body using the `flutterwave-signature` header. Enable webhook retries.

## Flow coverage

The basket sends the selected charities, one-time amounts, fee-coverage choice, anonymity choice, supporter name, receipt email, and optional giving note into a server-side payment intent. The v4 order request includes the server-generated reference and callback URL. The callback and webhook retrieve the v4 order before marking the intent successful. A payment is accepted only when the order is completed/succeeded, its reference matches the stored reference, its currency is USD, and its amount is at least the stored expected amount.

## Important v4 limitation

Flutterwave’s v4 API has a different payment model from v3. The old `POST https://api.flutterwave.com/v3/payments` hosted-checkout flow is not used. v4 Orders require a v4 customer and payment-method relationship; configure those identifiers from the Flutterwave v4 environment and test them in sandbox before enabling live charges. If the product needs a fresh hosted checkout for each donor without storing a reusable payment method, that requires a separate v4-supported checkout design or Flutterwave’s currently supported hosted UI—not a v3 endpoint renamed to v4.

This configuration routes funds to the one Flutterwave merchant account. It does not automatically transfer money to the listed charities. Confirm that the merchant account, nonprofit authorization, donor receipts, tax language, refund policy, and fund-disbursement process match the organization operating this site before enabling live charges.
