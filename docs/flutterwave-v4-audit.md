# Flutterwave v4 Integration Audit

**Audit date:** 2026-09-27  
**Repository:** `chastechnologiesllc/charity-navigator` (`main`, starting commit `a339842`)  
**Scope:** Static review of the original payment integration against Flutterwave's current v4 documentation, followed by implementation of the selected v4 direct-charge migration.

## Executive summary

The starting repository was **not integrated with Flutterwave v4**. It used an older hosted-checkout integration and its corresponding verification/webhook flow. The user selected migration to v4 direct/orchestrated card payments, so the implementation now includes v4 OAuth2, `/orchestration/direct-charges`, charge retrieval/authorization, AES-GCM client encryption, v4 webhook HMAC verification, forward-only database migrations, and a server-verified payment status page.

**This is not a drop-in version update.** The documented v4 card flow collects card details on the donor's device and encrypts them before they reach this site's server. The old hosted checkout is replaced. Public v4 documentation reviewed here did not establish a v4 equivalent of the hosted-payment-link endpoint.

Flutterwave's published v4 docs describe v4 as a public beta. A production payment integration is not proven until the merchant's v4 credentials, account permissions, test environment, webhook dashboard, and complete sandbox transaction matrix have been exercised.

## Implementation changes made

- Replaced the old static-key calls with OAuth2 client-credentials token handling (short-lived, in-memory cached token with refresh-before-expiry and one 401 retry).
- Added environment-specific v4 API hosts: sandbox by default, production only when `FLW_ENVIRONMENT=production`.
- Added the v4 direct charge orchestrator request and persisted Flutterwave charge IDs; added forward migrations (`0003` and `0004`) without deleting existing payment history. The transaction-ID column is renamed generically while preserving existing values.
- Added browser-side AES-GCM encryption for card number, expiry month/year, CVV, and PIN using a random 12-character nonce. The server receives ciphertext, not card numbers or security codes.
- Found the app-builder head injector placed `https://grok.com/grok-app-builder/extensions.js` on every HTML route, including the direct card-entry page. Updated the shared injector and server/build paths to omit that external script and its project identifiers from `/basket` and `/payment-result`, with regression tests. The checkout remains a direct-card page, so the merchant must confirm PCI DSS scope/SAQ, inventory all remaining scripts, and establish CSP/script/change/tamper controls with its acquirer/qualified assessor before live launch.
- Added runtime Zod validation for basket, encrypted-card, and authorization inputs.
- Added PIN, OTP, AVS, and provider redirect authorization actions as described by the v4 guide.
- Replaced result-query-string success claims with a status lookup that re-verifies the provider charge and requires exact reference, charge ID, amount, currency, and `succeeded` status.
- Replaced the old webhook handling with raw-body v4 HMAC-SHA256/base64 verification against `flutterwave-signature`, bounded webhook request bodies, minimal event storage, provider-event ID deduplication, and charge re-verification before success.
- Rewrote the production setup document with v4 credentials, environments, webhook requirements, and a sandbox acceptance checklist.
- Added focused regression tests for signature verification and exact charge matching.

## Pre-migration findings and risk treatment

| Finding                                                           | Change                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Older hosted-checkout endpoints/auth were not v4                  | Replaced with OAuth2 and v4 charge resources                                   |
| Result page could show success from a forged query value          | Result is derived from server verification using stored intent and charge ID   |
| Amount comparison allowed overpayment (`>=`) and float comparison | Exact amount equality uses integer minor units                                 |
| Webhook used an older static hash and payload shape               | v4 raw-body HMAC signature and event structure                                 |
| Duplicate events were retained without deduplication              | Unique `provider_event_id` index and `ON CONFLICT DO NOTHING`                  |
| Full event body could retain donor PII                            | Stores a reduced event record only                                             |
| Request validation was only a TypeScript assertion                | Runtime Zod validation added                                                   |
| Network/JSON failures could strand intents                        | Bounded fetches, typed/safe errors, and checkout-error state transitions added |

## Important qualification: credentials and integration not yet exercised

At audit time, this environment had no configured/exported `FLW_CLIENT_ID`, `FLW_CLIENT_SECRET`, `FLW_ENCRYPTION_KEY`, `FLW_SECRET_HASH`, or `DATABASE_URL`. Therefore:

The reported live message, “Flutterwave live checkout is not configured yet,” comes from the current `main` branch's old checkout guard returning when its old secret-key setting is absent. The v4 implementation is on an open, unmerged pull request; production still runs the prior branch until the change is merged and deployed. This workspace has no access to deployment settings, so it cannot configure production credentials.

- No real Flutterwave test/live API call or full browser charge could be performed.
- No v4 merchant/dashboard permissions or webhook delivery settings could be inspected.
- No live payment is enabled here; the checkout fails closed unless production Neon/database and v4 configuration are present.
- The v4 encryption key is returned by a server function to the browser because Flutterwave's documented AES-GCM example performs encryption in the browser. Configure only the provider's specific encryption key for that environment; never put OAuth client secrets, the webhook secret, or database credentials in browser code.
- No PCI assessment, acquirer approval, CSP review, or production script-inventory approval was available in this repository audit. Removing the known platform-injected third-party script on payment routes is a targeted code mitigation only, not proof of PCI DSS compliance or of an overall PCI scope.
- The callback query behavior and any account-specific extra authorization action should be validated in the v4 sandbox before production. The implementation treats the return as untrusted and still verifies server-side.

A clean install using `npm ci` was also blocked before typecheck/test because the repository's checked-in lockfile is already out of sync with `package.json` (unrelated `ajv`/`json-schema-traverse` tree). Do not refresh/commit the entire lockfile as part of this payment change without a separate dependency review.

## Verification results

- `npm run typecheck`: passed after the route tree was generated by the build.
- Targeted ESLint over changed TypeScript/JavaScript: passed.
- v4 crypto/payment-matching and migration regression tests passed; the additional PGlite migration test confirms the transaction-ID rename preserves the stored value and is repeatable. Three targeted PWA-route tests confirm the checkout and result pages omit the third-party extension script. A separate AES-GCM browser-crypto round-trip check for card fields and PIN passed.
- PGlite applied the payment migrations and confirmed the v4 charge-ID and webhook-event unique indexes.
- `npm run build`: passed; database migration step correctly skipped because this sandbox has no `DATABASE_URL`.
- Full `npm test`: **194 passed, 8 failed**. All eight failures are assertions in `scripts/grok-pwa-plugin.test.mjs` involving shared Grok PWA metadata/title injection; the new payment-route script-exclusion and migration-preservation tests pass.
- Production Flutterwave sandbox charge/webhook tests could not run because this environment has no v4 credentials, webhook setup, or configured database. Dependency installation for validation succeeded with `npm install --no-save --package-lock=false`; a clean `npm ci` remains blocked by the existing out-of-sync lockfile noted above.

## Official references reviewed

- [Flutterwave v4 Card Payments](https://developer.flutterwave.com/v4/docs/card) — card flow and encrypted card fields.
- [Flutterwave v4 Encryption](https://developer.flutterwave.com/v4/docs/encryption) — AES-256-GCM encryption and 12-character nonce example.
- [Flutterwave v4 Orchestrator Flow](https://developer.flutterwave.com/v4/docs/payment-orchestrator-flow) — direct charge, authorization actions, and verification expectations.
- [Flutterwave v4 Authentication](https://developer.flutterwave.com/v4/docs/authentication) — OAuth2 client-credentials tokens (documented 10-minute lifetime).
- [Flutterwave v4 Environments](https://developer.flutterwave.com/v4.0/docs/environments) — sandbox and production hosts/credentials.
- [Flutterwave v4 Webhooks](https://developer.flutterwave.com/v4/docs/webhooks) — HMAC-SHA256/base64 `flutterwave-signature`, raw-body signature verification, events/retries/idempotency.
- [Flutterwave v4 API beta and migration announcement](https://dev.to/flutterwaveeng/introducing-the-flutterwave-v4-api-faster-safer-easier-to-integrate-2dc9) — v4 beta status.
