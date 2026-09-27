# Flutterwave v4 production setup

The application uses Flutterwave's **v4 direct-charge orchestrator** for a single verified merchant account and a **USD-only, card-only, one-time** donation flow. Card details are collected in the browser and AES-GCM encrypted with Flutterwave's encryption key before submission. The app server handles only encrypted card fields; it never stores a card number or security code. Checkout collects the customer's email, name, and mobile number for the v4 customer object; the phone number is sent to Flutterwave but is not retained in the local intent table. A v4 charge is verified server-side before a payment-result page can confirm success.

**This direct card-entry flow increases the merchant's PCI DSS responsibilities** compared with a fully hosted checkout. Payment and result pages explicitly omit the platform-injected `https://grok.com/grok-app-builder/extensions.js` script because any third-party JavaScript on a card-entry document can access card fields before encryption. That exclusion is defense in depth, not PCI certification: the merchant must have its acquirer/qualified assessor confirm the correct PCI DSS scope and SAQ, secure the checkout origin, inventory and authorize every remaining script, establish script/change/tamper monitoring, and review CSP and deployment controls before accepting live card data.

> The donor enters card details on this site's checkout page. Flutterwave's public v4 docs reviewed for this integration document direct/orchestrator charge flows; ask Flutterwave support/account management if you require a hosted v4 checkout instead.

## Environment variables

Set these on the deployment platform, never in browser-prefixed variables and never in committed files:

| Variable             | Purpose                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FLW_CLIENT_ID`      | Flutterwave v4 OAuth2 Client ID for the selected environment                                                                                                                                                          |
| `FLW_CLIENT_SECRET`  | Flutterwave v4 OAuth2 Client Secret; server-only                                                                                                                                                                      |
| `FLW_ENCRYPTION_KEY` | Flutterwave v4 AES-256 encryption key; the checkout needs the provider encryption key to encrypt card fields in-browser, so treat it as a provider-defined client encryption key and never reuse it for other secrets |
| `FLW_SECRET_HASH`    | Random secret configured in the Flutterwave webhook settings; used as the HMAC-SHA256 key for v4 `flutterwave-signature` verification                                                                                 |
| `FLW_ENVIRONMENT`    | `test` for the v4 sandbox; set to `production` only after the sandbox checklist passes                                                                                                                                |
| `DATABASE_URL`       | Production Neon/Postgres connection string; payment is deliberately disabled without Neon                                                                                                                             |
| `APP_URL`            | Final public HTTPS origin used for v4 charge returns, e.g. `https://charity-navigator-nu.vercel.app`                                                                                                                  |

Configure only the environment variables listed above. Do not expose `FLW_CLIENT_SECRET`, the access token, webhook secret, or database URL to the browser. The v4 encryption key is specifically used by the documented browser-side AES-GCM encryption and is returned only by a server function to the checkout.

Existing payment databases receive migration `0004_provider_transaction_id.sql`, which renames the historical provider transaction-ID column to the generic `provider_transaction_id` name without dropping or rewriting stored IDs. Deploy through the normal migration runner; do not edit migrations already applied to a database.

## Environments

Flutterwave's v4 environment reference documents:

- Test API: `https://developersandbox-api.flutterwave.com`
- Production API: `https://f4bexperience.flutterwave.com`
- OAuth token endpoint: `https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token`

The app selects the test API unless `FLW_ENVIRONMENT=production`. The access token is cached only in server memory and renewed before its documented 10-minute expiry; no token is persisted or returned to the browser.

## Dashboard webhook settings

Set the v4 webhook URL to:

`https://<your-production-host>/api/flutterwave/webhook`

Configure the same cryptographically random secret as `FLW_SECRET_HASH`, enable retries, and select charge-completion events. The endpoint validates the base64 HMAC-SHA256 in `flutterwave-signature` against the **exact raw request body**, deduplicates by provider webhook event ID, and stores a reduced payload without donor email/card details. Successful states are accepted only after re-querying the v4 charge and matching its exact reference, exact USD amount, charge ID, and `succeeded` status.

## Sandbox acceptance checklist (required before live mode)

1. Use v4 **test** Client ID/Client Secret and the v4 sandbox card-encryption key. Keep `FLW_ENVIRONMENT=test`.
2. Configure a test `DATABASE_URL`, HTTPS `APP_URL`, and the same random webhook secret in the Flutterwave test dashboard.
3. Test a completed payment, decline, cancellation, 3-D Secure redirect, and any PIN/OTP/AVS authorization models Flutterwave enables for this account.
4. Replay the same webhook; it must not create duplicate event work. Alter a byte in the raw webhook payload; signature verification must reject it.
5. Confirm reference, charge ID, amount, USD currency, and terminal status are verified from Flutterwave before the UI says “Thank you.” Check under/overpayment and mismatched-reference cases.
6. Confirm card number, expiry, CVV, PIN, access tokens, client secret, and database URL do not appear in logs or database rows. Do not use real card data during development.
7. Only after Flutterwave's v4 production approval and sandbox sign-off, switch to production credentials, set `FLW_ENVIRONMENT=production`, and verify the production dashboard webhook.

The repository audit and reviewed provider references are in `docs/flutterwave-v4-audit.md`.

## Merchant responsibility

Payments are routed to the one Flutterwave merchant account. They are **not automatically transferred** to the charities listed in this directory. Before enabling production charges, confirm merchant authorization, charity relationships, donor receipts, tax language, refunds, and fund-disbursement processes with the organization operating the site.
