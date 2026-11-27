# Source Stays shortlet payment test setup

Target Supabase project: `vhggebtflomcmepduogt`

This guide is for the test project only. Do not use these steps against the production project.

## 1. Confirm the target

Open the Supabase dashboard and confirm the project reference in the URL is exactly:

`vhggebtflomcmepduogt`

Before running any SQL or deploying functions, confirm the project is the test project.

## 2. Apply the shortlet payment migration

Open **SQL Editor** in the test project. Copy the complete contents of:

`supabase/migrations/20261127140000_shortlet_paystack_transactions.sql`

from this branch and run it in the test project. The migration creates the shortlet payment transaction ledger and the idempotent webhook event ledger. It does not modify hotel or real-estate payment tables.

After execution, confirm these tables exist:
- `public.shortlet_payment_transactions`
- `public.shortlet_paystack_webhook_events`

The migration expects the existing `public.bookings` table to have a bigint `id` and `customer_user_id`, and the Supabase Auth users table to exist. If the SQL reports a foreign-key/type mismatch, stop and inspect the test schema rather than changing the migration blindly.

## 3. Configure Edge Function secrets

In **Project Settings → Edge Functions → Secrets** (or the Edge Functions secrets page), configure:

- `PAYSTACK_SECRET_KEY`: Paystack **test** secret key
- `SUPABASE_URL`: `https://vhggebtflomcmepduogt.supabase.co` (if not already supplied by the runtime)
- `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY`: test project's public/publishable key (if not already supplied)
- `SUPABASE_SERVICE_ROLE_KEY`: test project's service-role key (if not already supplied by the runtime)

Never put the Paystack secret or service-role key in the mobile app, Expo public variables, GitHub source files, or customer-facing code. Supabase provides some platform variables automatically; only add a variable if it is not already available.

## 4. Deploy only the three shortlet functions

From the repository root, authenticate with the Supabase CLI and link explicitly to the test project:

```sh
supabase login
supabase link --project-ref vhggebtflomcmepduogt
supabase functions deploy initialize-shortlet-payment
supabase functions deploy verify-shortlet-payment
supabase functions deploy paystack-shortlet-webhook --no-verify-jwt
```

Do not run `supabase functions deploy` without a function name: that would deploy every function in the repository, including unrelated hotel or other workflows.

The repository's `supabase/config.toml` also sets `verify_jwt = false` for the webhook only. The webhook authenticates Paystack using its HMAC signature.

## 5. Configure Paystack test webhook

In the Paystack test dashboard, set the webhook URL to:

`https://vhggebtflomcmepduogt.supabase.co/functions/v1/paystack-shortlet-webhook`

Use Paystack test mode. Do not configure the production Paystack webhook during this test.

## 6. Point a local mobile build at the test project

Copy `mobile/.env.test.example` to `mobile/.env` and replace the placeholder with the test project's publishable key. Run the mobile app locally from the `mobile` directory. Do not overwrite production build environment variables.

## 7. Test cases

Use a dedicated test customer and a test shortlet booking. In the admin/site workflow, approve the booking and set `payment_request_status = 'requested'` with the final amount before attempting payment.

Test:
1. Customer cannot pay before payment is requested.
2. Customer can initialize Paystack after payment is requested.
3. Successful Paystack test payment updates the transaction and booking to paid through the webhook.
4. Customer returning to the app can also use **I have paid — verify payment**.
5. Repeated webhook delivery does not create duplicate settlement.
6. Failed or pending Paystack payment does not mark the booking paid.
7. A changed booking amount does not mark the booking paid; it must be reconciled by Source Stays.

Do not use real card details or live Paystack mode. Do not deploy to production until all tests pass and production deployment is separately approved.
