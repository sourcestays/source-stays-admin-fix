# Source Stays Mobile Architecture

## Product decision

Build Android and iOS apps while keeping the existing public website at https://sourcestays.com.ng/. The website and app are separate clients of the existing Source Stays Supabase project. The current website files at the repository root must remain intact.

## Technology

- Expo + React Native + TypeScript + Expo Router for one Android/iOS codebase.
- Supabase Auth, PostgreSQL, Storage, Realtime and Edge Functions as shared backend services.
- Paystack for Nigerian naira payments, with initialization and verification performed server-side.
- Expo SecureStore for persisted mobile authentication sessions.
- Expo push notifications in a later release phase.

## Product areas

1. Shortlets: browse published properties, dates, guest count, availability, booking, payment, guest verification and booking history.
2. Hotels: hotel discovery, room categories, date/room/guest selection, availability request, manual confirmation where required, payment and booking history.
3. Real estate: sale, land and rental listings, property details, inspection requests and enquiries. A sale listing must not enter the accommodation booking/payment flow.
4. Rewards: available credit, ledger history, eligible booking credit, redemption request and redemption status.

## Existing website contracts discovered in repository

- Public property discovery reads `properties`, filters `published = true`, and uses categories including `shortlet`, `hotel`, `sale`, `land` and `rent`.
- Public property images are read from `property_images`.
- Customer-safe hotel room rates are exposed through `hotel_room_categories_public`.
- Customer-safe villa package prices are exposed through `villa_packages_public`.
- Booking creation uses the `create_customer_booking` RPC.
- Availability checks use the `check_property_availability` RPC.
- Enquiries are inserted into `enquiries`.
- Hotel payment initialization has an existing Edge Function named `initialize-hotel-payment`; the Paystack webhook is responsible for payment status confirmation.
- The repository history also documents a separate `initialize-payment` flow for standard bookings.
- Hotel payment transaction states include `pending`, `paid`, `failed`, `refund_pending` and `refunded`.

These are integration leads, not a substitute for auditing the live database definitions, grants, RLS policies, RPC argument/return types and current deployed Edge Function versions before implementing writes.

## Security requirements

- Only the Supabase publishable key may be embedded in the app. Never embed a service-role/secret key, Paystack secret key, Dojah secret, email provider secret or AI provider key.
- Configure strict RLS for every table and storage bucket accessed by the mobile client.
- Keep privileged booking, payment initialization, payment verification, rewards credit/debit and partner/admin operations server-side.
- Never trust client-provided prices, totals, payment statuses, reward balances or partner identities.
- Use idempotency and server-side verification for all payment and reward mutations.
- Keep partner identity hidden wherever the existing listing protection rules require it.
- Preserve private guest verification documents and never expose their storage bucket publicly.
- Do not create production schema migrations until the live schema and current website behavior have been audited.

## Delivery sequence

### Phase 1 — Foundation
App shell, theme, Supabase client, environment configuration and navigation.

### Phase 2 — Discovery
Published shortlet/hotel/real-estate feeds, search filters, customer-safe pricing, image gallery and property detail pages.

### Phase 3 — Identity
Sign-up/sign-in, session persistence, customer profile, account recovery and secure guest verification.

### Phase 4 — Booking and payment
Shortlet booking and availability, hotel room-category selection and manual confirmation, secure Paystack initialization, webhook-confirmed payment state, booking history and receipts.

### Phase 5 — Real estate
Sale/rent/land details, enquiries and inspection requests, deliberately separate from stay booking checkout.

### Phase 6 — Rewards
Read-only ledger/balance first, then secure earning and redemption workflows after auditing the existing credit-ledger schema and RPCs.

### Phase 7 — Release readiness
Push notifications, analytics/consent, accessibility, error monitoring, performance, security review, Android internal testing, iOS TestFlight and store submission.

## Current implementation status

The `mobile/` directory contains the initial Expo app scaffold, Supabase client using SecureStore, environment example and a branded home-screen foundation. The home screen performs a read-only count of published properties when local Supabase environment variables are configured. The four division cards are currently visual placeholders; their routes and transactional workflows are not implemented yet.
