# Source Stays Mobile — Development Log

Last updated: 2026-11-27

## Repository and working branch

- Repository: `sourcestays/source-stays-admin-fix`
- Mobile app directory: `mobile/`
- Active development branch: `mobile-app-foundation`
- Default branch: `main`
- Keep mobile work on the active mobile branch. Do not replace or destabilize the existing website in the repository root.

## Product and design decisions

- Build one Android/iOS customer app with Expo, React Native, TypeScript and Expo Router.
- Use Source Stays brand styling: deep green, warm gold and premium, uncluttered layouts.
- Support light, dark and system appearance modes; persist the user's choice with Expo SecureStore.
- Use the Source Stays logo for app icon and splash/onboarding branding; splash background is brand green.
- Improve every app screen consistently, not only the home screen.
- Preserve existing customer journeys, website behavior and Supabase integrations.
- Do not generate the final APK until wider app development and validation are complete.

## Existing app foundation

- Expo SDK 54, React Native 0.81, React 19, TypeScript and Expo Router.
- Supabase client uses the public publishable key and SecureStore-backed auth storage.
- Theme provider: `mobile/src/theme/ThemeProvider.tsx`.
- Shared section icon component: `mobile/src/components/SectionIcon.tsx`.
- App routes include home, account, rewards, verification, about, RECB, reviews, division listings and property details.
- Branding assets and Expo splash/app icon configuration are present.

## Backend and security guardrails

- Existing website and mobile app share the Source Stays Supabase project and data model.
- Public listing reads use `properties`; images use `property_images`.
- Customer-safe hotel room pricing uses `hotel_room_categories_public`.
- Customer-safe villa package pricing uses `villa_packages_public`.
- Existing booking contracts include `create_customer_booking` and `check_property_availability`; enquiries use `enquiries`.
- Hotel payment initialization uses the existing `initialize-hotel-payment` Edge Function; payment status must be confirmed server-side/webhook-side.
- Never embed service-role, Supabase secret, Paystack secret, Dojah or other privileged credentials in the app.
- Never expose private guest verification documents or their storage bucket.
- Do not trust client-submitted prices, balances, totals or payment status.
- A property sale/land/rent listing must not be routed through accommodation booking/payment checkout.
- Preserve partner-identity protection rules.
- Audit live schema, RLS, grants, RPC signatures and Edge Function versions before adding or changing backend writes. Do not make production schema migrations without that audit.

## Work completed in this session (2026-11-27)

1. Confirmed repository and branch. The repository connection has push/admin permissions.
2. Confirmed the latest pre-session app commit was `51a92faf58a28883c57a4ee93d5c0a725b682efc`, “Extend Source Stays theme across customer information screens”. Its mobile CI run #76 passed.
3. Updated `mobile/app/division/[type].tsx`:
   - Applied theme tokens to RECB banner, real-estate filter chips, empty state, listing placeholders, verification labels and card surfaces.
   - Added a location-search icon, section icon heading and visible listing count.
   - Added accessible selected state to real-estate filters.
   - Preserved listing queries, customer-safe starting-rate reads, location filtering, hidden partner identity behavior and property-detail navigation.
   - Commit: `4160411390e931945f78d92035ac43dcc0515c17`.
4. Updated `mobile/app/property/[id].tsx`:
   - Made the property detail screen's reusable styles theme-aware for light and dark appearance.
   - Themed room cards, form fields, selection controls, price breakdowns, status cards, call-to-action buttons, verification labels, notices and error states.
   - Preserved existing hotel availability, villa enquiry, shortlet booking, event enquiry, real-estate inspection and WhatsApp enquiry logic.
   - Commit: `752decc52f74a0ac3a93a92ce4afc589f6b00327`.
   - Follow-up theme-token correction for notice text: `b114b910d28f7ece4077eb49a47dbcd9e060c13b`.
5. Follow-up verification: GitHub Actions mobile CI run #79 completed successfully. Runs #80 and #82–#83 also completed successfully, including TypeScript, Android export and Deno Edge Function checks. An intermediate package-only commit run #81 failed because it was triggered before the lockfile update; the immediately subsequent lockfile and icon commits passed.

## Next actions

1. Verify the public listing privacy boundary before release. Current app queries read `title` and `location` from `properties` and apply `hide_partner_identity` masking in the UI; if public RLS allows those columns, the raw values are still present in the client response. Do not rely on client-side masking as a security boundary. Inspect live RLS/grants and implement a server-side sanitized public view/RPC before release if needed. The website listing code appears to use a similar client-side masking pattern, so assess both surfaces together.
2. Review app navigation and customer discovery flows end-to-end.
3. Test Supabase authentication, published listing reads, pricing, partner privacy, booking requests and payment verification against the existing contracts.
4. Complete accessibility, loading/error/empty states and mobile layout checks.
5. Only after the wider app is ready, prepare Android APK and iOS TestFlight/store release steps.

## Additional work completed (2026-11-27)

- Replaced the placeholder Unicode glyph icon system with Material Community vector icons using `@expo/vector-icons` 15.1.1.
- Added direct `@expo/vector-icons` and `expo-font` dependencies compatible with the existing Expo SDK 54 package set and synchronized the npm lockfile.
- Updated `mobile/src/components/SectionIcon.tsx` with consistent line-style icons for shortlets, hotels, real estate, rewards, search, account, bed, location, calendar, security, theme modes, buildings and keys.
- Applied theme-aware styling to:
  - `mobile/app/rewards.tsx` — rewards balance panel, ledger rows, amounts, labels and empty/loading states.
  - `mobile/app/reviews.tsx` — published reviews, review form, rating selector, inputs, buttons and feedback messages.
  - `mobile/app/about.tsx` — branded hero, content cards, founder section and calls to action.
  - `mobile/app/verify.tsx` — secure verification reference form and privacy notice; preserves the existing secure website flow and does not expose uploaded ID files to the app.
  - `mobile/app/account.tsx` — profile, booking dashboard, hotel request details, redemption UI, login/signup form and payment-related UI styling.
  - `mobile/app/recb.tsx` — RECB information and consultant referral guidance, preserving its official portal links and financial-risk disclosures.
- Theme styling uses the shared `useAppTheme` palette; the screen data flows and existing Supabase/website integrations were left intact.
- CI results after these changes: runs #90–#98 completed successfully. The final home-screen commit run #98 passed dependency installation, TypeScript, Android JavaScript bundle export and Deno checks for the shortlet payment Edge Functions. Vercel check for the latest home-screen commit also passed.


## Final status for the visual/theme milestone

- Home screen now uses the shared icon library for section cards, arrows and the appearance selector; appearance options have accessible labels and selected state.
- Latest code commit: `1c6eda8f897ae3b4140d0b2a271fa2d32d185223`.
- Latest GitHub Actions mobile CI run #98: success.
- Latest Vercel check for the home-screen commit: success.
- Visual milestone is complete at source-code and automated-build level. Physical device review (small Android/iPhone screens, safe areas, image loading and actual light/dark appearance) remains outstanding.


## Security and customer-flow audit — 2026-11-27

- Confirmed the privacy concern in the current mobile code:
  - `mobile/app/division/[type].tsx` selects raw `title` and `location` from `properties`, then applies `hide_partner_identity` masking in React Native.
  - `mobile/app/property/[id].tsx` also selects raw `title` and `location` and masks them only after the response reaches the app.
  - `mobile/app/account.tsx` fetches `title` and `public_title` for the customer's own booking history.
  - This proves the raw values are requested by the client; it does **not** prove they are exposed to anonymous customers because live RLS, column grants and policies have not been inspected. Treat partner-identity exposure as an unresolved release blocker until verified.
- Reviewed the tracked Supabase migrations. They define customer-safe hotel room pricing through `hotel_room_categories_public`, exposing the calculated customer rate while excluding hotel net rate and markup inputs. The tracked migration set does not contain a `properties_public` view or equivalent sanitized property-listing contract.
- Reviewed `create_customer_booking(p_payload jsonb)`: it requires an authenticated user, verifies the submitted email against the signed-in account, locks the published property row, calculates the amount from database pricing, and rechecks availability before inserting. The mobile client also performs a preflight availability check, but the RPC performs the authoritative check again. Client-submitted totals in the payload are not used by this SQL function.
- Privilege-hardening item: the tracked `create_customer_booking` migration does not explicitly revoke default function EXECUTE privileges from PUBLIC or grant EXECUTE only to authenticated. The function's internal authentication check is present, but deployed function privileges must be inspected and explicitly restricted as part of the backend audit.
- Reviewed the hotel customer flow: the app creates an availability request first, tells the customer payment is not taken, and only exposes the Paystack payment action after an availability status and unexpired confirmation are present. The payment initializer is an Edge Function, not a client-side Paystack secret integration.
- Latest branch-head CI run #100 passed: dependency install, TypeScript check, Android JS bundle export and shortlet payment Edge Function checks. This is automated build validation, not proof of live Supabase policies or real payment behavior.
- No production SQL, RLS policies or app data queries were changed during this audit. A safe fix requires a read-only inspection of the live Supabase table/view grants, RLS policies, deployed RPC signatures/privileges and Edge Function versions first. After that, implement a customer-safe property view/RPC and update both website and mobile clients together if the live policy permits raw identity fields.


## RPC privilege finding and remediation prepared — 2026-11-27

- User supplied the live Supabase result for `create_customer_booking(jsonb)`: `proacl = NULL`, `anon_can_execute = true`, and `authenticated_can_execute = true`.
- This confirms the function currently inherits PostgreSQL's default function EXECUTE privilege for PUBLIC, which includes anon. The function body rejects calls with a null `auth.uid()`, so this result alone does not prove anonymous booking creation is possible; nevertheless, the anon EXECUTE grant is unnecessary and has been removed in a new migration.
- Added `supabase/migrations/20261127150000_restrict_customer_booking_rpc.sql`: revoke all privileges from PUBLIC and anon, then grant EXECUTE to authenticated. This preserves the existing signed-in website/mobile RPC flow and does not alter the function body or booking schema.
- Migration is committed but has **not** been applied to the live Supabase project. Apply only after reviewing the migration; then rerun the function privilege query and confirm anon=false, authenticated=true.
- Partner identity privacy remains unresolved until the user supplies the properties RLS, table grants and public-view query results. Do not infer those permissions from this RPC result.


## Booking RPC privilege fix verified in live Supabase — 2026-11-27

- User subsequently supplied the post-migration live privilege result for `create_customer_booking(jsonb)`: `proacl = {postgres=X/postgres,authenticated=X/postgres}`, `anon_can_execute = false`, and `authenticated_can_execute = true`.
- This verifies the live database now denies anonymous EXECUTE while preserving authenticated customer execution. The earlier note that the migration was committed but unapplied is superseded by this verification.
- Branch-head CI run #103 passed after the migration and audit-log updates; run #102 for the migration commit also passed.
- Remaining release blocker: live `properties` RLS status/policies, table grants and public property-view results have not yet been supplied. The app currently requests raw `title` and `location` values before applying partner-identity masking client-side; do not treat that as safe until live database permissions and the intended public contract are verified.


## Live properties-table security inspection — 2026-11-27

- User supplied screenshots/results from the Supabase project shown as `source-stays-testing`, branch `main`, marked `PRODUCTION`.
- Live catalog result for `public.properties`: `relrowsecurity = false`, `relforcerowsecurity = false`.
- Live `pg_policies` query for `public.properties` returned zero rows.
- Supplied `information_schema.role_table_grants` output lists `REFERENCES`, `TRIGGER`, and `TRUNCATE` for `anon`, `authenticated`, and `service_role`; it lists no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` grants for those roles. The output alone does not settle effective privileges inherited from PUBLIC, column-level grants, or other role membership, so do not infer that client reads are either allowed or denied yet.
- This is a release-blocking security configuration concern: RLS is disabled and no policies exist. Do not change live RLS, grants, or client queries until effective table/column privileges and existing public views are inspected. Then design a least-privilege customer-safe property contract and coordinate website/mobile changes.


## Customer read-access and public-view audit — 2026-11-27

- User supplied effective privilege checks from the Source Stays test project: `anon_table_select=false`, `anon_column_select=false`, `authenticated_table_select=false`, `authenticated_column_select=false`, and `service_role_table_select=false`.
- User also supplied a `pg_views` search for public views with names matching `%property%`; it returned zero rows.
- Combined with the prior results (RLS disabled, no policies, and no listed SELECT grants), the supplied checks establish that the `anon` and `authenticated` API roles do not currently have effective SELECT access to `public.properties`. The app's direct customer-side queries to this table therefore have no demonstrated supported read path in this test project.
- No property-named public view was found. This search does not rule out views with other names, RPCs, or other schemas.
- Do not grant broad SELECT on the base table: it contains partner/private identity fields and the app currently masks those values client-side. Next inspect table ACL/schema usage, all public views, and relevant read RPCs/migrations. Then implement a least-privilege sanitized read contract and update mobile + website together. Keep live production untouched.


## Schema usage and complete public-view inventory — 2026-11-27

- User supplied test-project results: `anon` and `authenticated` both have USAGE on schema `public`; neither has SELECT on `public.properties`.
- User's complete `pg_views` inventory for schema `public` returned zero rows.
- This confirms schema USAGE is present but no public-schema views are available in this project. The customer property-read contract must be added deliberately; do not open direct base-table access.


## Public customer-view object existence check — 2026-11-27

- User queried `pg_class` for `hotel_room_categories_public`, `villa_packages_public`, and `properties_public` in schema `public`; zero rows returned.
- Therefore none of these three named objects currently exists in the Source Stays test project's public schema. This corroborates the earlier empty public-view inventory.
- Before applying or replaying view migrations, inspect Supabase migration history and the actual underlying hotel/villa tables and columns. Do not assume the migrations have or have not run solely from GitHub source files.


## Supabase migration-history lookup — 2026-11-27

- User attempted to query `supabase_migrations.schema_migrations` in the Source Stays test project; PostgreSQL returned `42P01: relation does not exist`.
- This means that exact migration-history relation is unavailable in the queried database. It does not establish that no migrations were applied; inspect catalog for migration-related schemas/tables and confirm the project's migration workflow before drawing conclusions.


## Migration catalog discovery — 2026-11-27

- User's catalog query found `auth.schema_migrations`, `realtime.schema_migrations`, and `storage.migrations`; it did not find a `supabase_migrations` schema/table.
- These are Supabase service-schema migration tables and must not be treated as the Source Stays application migration ledger without verifying their purpose. Application SQL may have been applied manually in SQL Editor and not recorded in a CLI migration history.
- Use Supabase Dashboard's project migration tooling/history if available and compare with actual object definitions; do not query or alter internal auth/realtime/storage migration records.


## Test-project base schema inspection — 2026-11-27

- User queried `information_schema.columns` for `properties`, `hotel_room_categories`, and `villa_packages`.
- Returned rows contain 13 columns for `properties`: `id bigint`, `title text`, `public_title text`, `published boolean`, `price numeric`, `caution_fee numeric`, `extra_guest_fee numeric`, `cleaning_fee numeric`, `service_fee numeric`, `other_fee numeric`, `event_enabled boolean`, `event_price numeric`, `event_caution_fee numeric`.
- No columns were returned for `hotel_room_categories` or `villa_packages`. This does not conclusively prove those relations are absent (they may be views, use different names/schemas, or the result may be partial); inspect relation existence separately.
- Compared with current mobile queries, fields such as `category`, `location`, `image_url`, `price_period`, `bedrooms`, `guests`, `amenities`, and partner privacy/verification flags were not present in the supplied result. This is a potentially significant schema drift issue; do not create a property view or grant privileges until the full actual `properties` schema and relation inventory are confirmed.


## Public relation inventory — 2026-11-27

- User supplied `pg_class` inventory for public relations of kinds table/view/materialized view/partitioned table. Exactly four objects were returned: `bookings` (table), `properties` (table), `shortlet_payment_transactions` (table), and `shortlet_paystack_webhook_events` (table).
- No public views or materialized views were returned; no hotel/villa package relation appeared in the inventory.
- GitHub branch contains migrations for hotel availability, hotel room categories and their public rate view, hotel room media, hotel payment transactions, property exact address, hotel credits, inspection notes, secure customer booking pricing, shortlet Paystack transactions, and booking RPC privilege restriction. The live test schema inventory is substantially narrower than the branch's expected schema. Do not bulk-apply migrations until prerequisites, ordering, and current object definitions are compared.


## Full four-table column inventory — 2026-11-27

- User supplied complete `information_schema.columns` output for `properties`, `bookings`, `shortlet_payment_transactions`, and `shortlet_paystack_webhook_events`.
- `bookings` includes the fields used by the secure booking RPC: property/customer/date/guest/amount/payment/status fields plus `customer_user_id`, `booking_option`, `booking_option_label`, `booking_base_price`, and `booking_caution_fee`.
- `shortlet_payment_transactions` includes booking/user/reference/gateway/currency/amount/status, authorization/access codes, gateway transaction ID/response, and timestamps.
- `shortlet_paystack_webhook_events` includes event ID/reference/type/payload and receive/process timestamps.
- `properties` has only 13 reported columns: id, title, public_title, published, price, caution_fee, extra_guest_fee, cleaning_fee, service_fee, other_fee, event_enabled, event_price, event_caution_fee. Many fields queried by mobile listing/detail screens are absent from the supplied inventory, including category/location/image and partner-identity controls. Do not apply a view migration or grant direct table access based on the expected app schema until the base table schema and function dependencies are verified.
- Preserve all existing bookings and payment records; no reset/drop/recreate operations.


## Public function and properties constraint audit — 2026-11-27

- User supplied public function inventory: `check_property_availability(p_property_id bigint, p_check_in date, p_check_out date)` with `prosecdef=false` (SECURITY INVOKER), and `create_customer_booking(p_payload jsonb)` with `prosecdef=true` (SECURITY DEFINER).
- User supplied properties constraints/index inventory: only `properties_pkey PRIMARY KEY (id)` and its unique btree index were returned.
- Need inspect exact function definitions and EXECUTE privileges, especially whether direct authenticated calls to the availability function are needed and how it reads property/booking data. Do not alter function security mode or grants without reviewing definitions and dependencies.


## Live test-project booking function definitions reviewed — 2026-11-27

- User supplied exact definition of `check_property_availability(bigint,date,date)`: SQL, STABLE, SECURITY INVOKER (prosecdef=false), empty search_path, checks overlapping rows in `public.bookings` where `status <> 'declined'`.
- It is executable by both anon and authenticated according to `has_function_privilege`. Because it is SECURITY INVOKER and queries `public.bookings`, direct calls depend on the caller's SELECT privileges on bookings (and any applicable RLS). Those privileges/policies have not yet been inspected. Its boolean return reveals availability only, but the function could fail for API roles lacking underlying SELECT.
- User supplied exact definition of `create_customer_booking(jsonb)`: PL/pgSQL SECURITY DEFINER, empty search_path, explicitly requires `auth.uid()`, validates signed-in account email, reads/locks a published property row, derives price and fees server-side, checks availability, inserts pending/unpaid booking, and returns booking id.
- Its current EXECUTE privileges are anon=false, authenticated=true. This matches the earlier verified RPC permission fix.
- Inference: when the SECURITY DEFINER booking function calls the invoker availability function, the nested call executes in the current effective definer context, so it can read bookings as the function owner, assuming owner privileges. Confirm owner and grants before relying on this.
- Potential correctness edge case for later review: `b.status <> 'declined'` does not include rows with NULL status because the predicate evaluates UNKNOWN. Do not change until existing booking status semantics/data are inspected.
- Next inspect effective SELECT privileges and RLS for `public.bookings`; no changes to function grants or definitions until then.


## Bookings table permissions/RLS audit — 2026-11-27

- User supplied test-project result: `anon_can_read_bookings=false`, `authenticated_can_read_bookings=false`, `bookings_rls_enabled=false`, `bookings_force_rls=false`.
- Since `check_property_availability` is SECURITY INVOKER and selects from `public.bookings`, direct calls by anon/authenticated are expected to fail due to missing SELECT privilege (subject to any other role membership/ownership context; has_table_privilege reported false).
- Do not grant customer SELECT on bookings: the table contains customer PII and booking/payment information.
- The nested call from SECURITY DEFINER `create_customer_booking` may execute under the definer's effective privileges. Verify function owner and whether owner has SELECT on bookings/properties before concluding nested behavior.
- Safe public availability should be exposed as a narrowly scoped function that returns only a boolean and uses a carefully reviewed SECURITY DEFINER implementation, or keep availability check internal to booking RPC. Avoid direct customer access to booking rows.


## Booking function owner privileges verified — 2026-11-27

- User supplied owner privilege check for both public functions: owner is `postgres`; owner can SELECT from `public.bookings` and `public.properties` (true for both functions).
- This supports the expected nested execution path: `create_customer_booking` runs SECURITY DEFINER as postgres, and its nested call to the SECURITY INVOKER availability function inherits the effective definer context; therefore the nested availability query can read bookings. The customer does not need SELECT on bookings for this internal path.
- Direct calls to `check_property_availability` by anon/authenticated remain unable to read bookings because their own SELECT privileges are false. If the app needs a pre-booking availability preview, expose a narrowly scoped boolean-only SECURITY DEFINER endpoint with a fixed search_path and strict input validation, or avoid direct preflight calls and rely on the booking RPC response.
- Preserve current customer booking RPC permissions: anon=false, authenticated=true. No changes to booking table grants.
