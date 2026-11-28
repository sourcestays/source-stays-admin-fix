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


## Mobile app code audit and safe availability pre-check removal — 2026-11-27

- Inspected `mobile/app/division/[type].tsx`: directly selects customer listings and private fields from `public.properties`; this cannot work in the test project with no anon/authenticated SELECT and the currently reported 13-column properties schema.
- Inspected `mobile/app/property/[id].tsx`: directly selects the same properties base table, then queries `property_images`, `hotel_room_categories_public`, and `villa_packages_public`. Those supporting objects were absent from the supplied public relation inventory.
- Found the mobile booking submit handler directly calling `check_property_availability` before `create_customer_booking`. This direct customer RPC is incompatible with missing SELECT on bookings because the function is SECURITY INVOKER. The booking RPC already performs the authoritative availability check internally.
- Safely removed only the redundant client-side pre-check from `mobile/app/property/[id].tsx`, retaining the server-side `create_customer_booking` call and its internal availability validation. Added an explanatory code comment. Commit: `fdfb10f13e7c2ffa8f0bd7deb19755d864396cda`.
- Inspected `mobile/app/account.tsx`: customer dashboard directly selects from `bookings` filtered by `customer_user_id`, and then directly selects property titles from `properties`. User's privilege checks showed no SELECT for authenticated on either table. Thus customer booking history and property-name lookup also lack a working direct-table read path in this test project. Do not grant broad SELECT; design narrow user-scoped RPCs/views for customer booking summaries and safe property labels.
- `mobile/app/index.tsx` also performs a direct count query on `properties`, which will fail with current privileges; its UI already has a fallback status message.


## Follow-up home screen data-access cleanup — 2026-11-28

- CI run #119 for the booking pre-check removal passed.
- Removed the home-screen direct count query against `properties`. That query cannot succeed with the currently verified customer grants and the app does not need it to navigate or discover content. Removed the unused imports as well.
- The home screen now avoids a predictable denied database request until a restricted public listing/count contract is available.
- Commit: `3a5ea705d72c000f31505a91b24c86e404846262` (plus import cleanup).
- No production or test database changes were made.


## Expanded schema result and CI correction — 2026-11-28

- User repeated the information_schema.columns result for the requested set of five relations. The returned rows contain only public.bookings and public.properties; no columns were returned for property_images, hotel_room_categories, or hotel_availability_requests. This indicates those relations are absent from the queried public schema or not included in the result; confirm with a relation inventory before writing any dependent view/RPC migration.
- The supplied properties columns are only id,title,public_title,published,price,caution_fee,extra_guest_fee,cleaning_fee,service_fee,other_fee,event_enabled,event_price,event_caution_fee. Mobile listing screens currently expect many more fields (category, price_period, location, public_location, bedrooms, guests, amenities, image_url, featured, verification flags, hide_partner_identity). Do not create a view referencing these absent columns. Need reconcile test-project schema vs migrations/website schema first.
- CI runs #121 and #122 failed TypeScript because the cleanup accidentally removed the isSupabaseConfigured import while the home screen still uses it for its environment hint. Restored the import in commit 076086151c0059f10858de27d34da9d066d97ed6. Run #120 passed. Await CI for the import correction.
- No database changes applied.


## Supabase public relation inventory confirmed — 2026-11-28

- User supplied Supabase SQL Editor screenshot for project source-stays-testing, branch main (Production badge). The public schema inventory contains exactly four relations: bookings (table), properties (table), shortlet_payment_transactions (table), and shortlet_paystack_webhook_events (table). No hotel request/category/media relations and no public views were listed.
- Repository migrations include hotel_availability_requests, hotel_room_categories, room media, and public hotel room view migrations, but the inventory shows these have not been applied to this database (or are otherwise absent from public). The hotel room view migration also depends on properties.category being present; the supplied test properties column inventory did not include category. Do not apply this hotel migration chain blindly until the base properties schema is reconciled.
- Repository currently has no migration that creates/extends the full properties base schema in this branch. The live test project's 13-column properties table is materially behind the schema assumed by the mobile UI and several existing migrations. Need compare with the intended Source Stays production schema and recover missing base migrations before attempting app data-access migrations.
- This confirms the mobile app cannot yet load listings or hotel requests from this Supabase project's public schema. No production database changes were made.


## Main website public hotel/villa view permissions verified — 2026-11-28

- User supplied catalog results for public.hotel_room_categories_public and public.villa_packages_public: both owned by postgres, reloptions include security_barrier=true, and anon/authenticated can SELECT both.
- Previously inspected view definitions return customer-facing calculated rates and omit hotel_net_rate/partner_net_rate and markup input columns. Hotel view includes active room categories joined to published hotel properties; villa view includes active packages joined to published properties.
- security_barrier=true is not equivalent to security_invoker=true. These are postgres-owned views; assess underlying table access/RLS using view-owner semantics and the explicit projection/filter. Do not claim the barrier itself enforces RLS.
- Mobile should reuse these existing public views for hotel/villa customer rates, not duplicate markup formulas or query partner net rates.
- Critical unresolved issue from grants audit: anon has INSERT on bookings and an INSERT policy with WITH CHECK (true); authenticated has broad INSERT/UPDATE/DELETE grants on bookings and properties (subject to RLS policies). Need inspect triggers, constraints, and exact app booking creation flow before proposing a least-privilege grant/policy migration. No changes to main production database.



## Main website production booking security audit — 2026-11-28

- User confirmed the main website Supabase project is distinct from `source-stays-testing`. Findings in this section apply to the main website production project only. No production database changes were made.
- Production RLS is enabled (not forced) on `bookings`, `guest_verifications`, `hotel_availability_requests`, `hotel_room_categories`, `properties`, and `villa_packages`.
- Production customer-safe views `hotel_room_categories_public` and `villa_packages_public` are readable by anon/authenticated. Their supplied definitions expose customer-calculated rates and approved display fields, not partner net rates or markup inputs. Both are postgres-owned and have `security_barrier=true`; this is not equivalent to `security_invoker=true`.
- Production trigger `set_booking_customer_user` runs BEFORE INSERT and sets `NEW.customer_user_id := auth.uid()`.
- Production trigger `trg_guard_hotel_availability_request_changes` calls `guard_hotel_availability_request_changes()`. The function allows admins through (checks `admin_users`) and otherwise rejects changes to ownership, property, customer details, room details, dates, quantities, notes, status, availability confirmation/expiry, hotel confirmation note and payment URL.
- Production trigger `trg_set_hotel_availability_request_room_category` calls a SECURITY DEFINER function with empty search_path. It requires a room_category_id, verifies the selected room belongs to the requested property and is active, verifies the property is published and category=hotel, then copies the room name into the request.
- Production trigger `trg_hotel_availability_requests_updated_at` updates `updated_at` on request updates.
- Production `create_customer_booking(p_payload jsonb)` is SECURITY DEFINER, empty search_path, and requires a signed-in user. It validates required fields, dates, positive amount and email equality with the signed-in account; locks the published property row; checks availability; and inserts a pending/unpaid booking with customer_user_id set to auth.uid(). Its EXECUTE privileges are authenticated/postgres/service_role; anon and PUBLIC do not have EXECUTE.
- Important correction to earlier log statements: the exact production function definition supplied by the user accepts `amount_due` from `p_payload` and checks only that it is positive. It does **not** calculate the shortlet booking total from database property prices/fees. Any earlier statement that this production function derives or calculates the booking amount server-side is superseded and incorrect. Before mobile integration, inspect the website's trusted pricing/payment flow and design server-side amount calculation/verification; do not trust client-submitted totals.
- Production `check_property_availability` is executable by PUBLIC, anon, authenticated, postgres and service_role. It is SECURITY INVOKER, so direct API calls depend on caller access to underlying bookings; the customer booking RPC performs the check internally in its definer context.
- Production `get_booking_id_by_verification_token(uuid)` is SECURITY DEFINER and executable by PUBLIC, anon, authenticated, postgres and service_role. It returns a booking ID matching the supplied token. This public lookup is an intentional or potentially sensitive flow that requires review of callers, response handling, rate limiting and token exposure before reuse by mobile.
- Production bookings trigger inventory shows only `set_booking_customer_user`.
- Production `bookings.verification_token` is nullable UUID with default `gen_random_uuid()` and has unique index `bookings_verification_token_idx`. This gives automatic random UUID generation on inserts that omit the token and uniqueness for non-null values, but does not establish that every booking has a token or that the lookup endpoint is rate-limited.
- User supplied production booking RLS policy `Public can submit bookings` with anon/authenticated INSERT and `WITH CHECK (true)`, plus anon INSERT table grant. The secure authenticated RPC is available to signed-in users, but the broad anonymous insert path remains a separate item to inspect alongside constraints and trusted website flows. Do not remove or alter it without tracing production website dependencies.
- Production `bookings` trigger does not validate submitted amount, property, dates, guest count or payment status; validation in the RPC covers several fields, but the RPC accepts client-provided amount. Do not treat the trigger as a full booking validation boundary.
- Next: trace the website's existing shortlet booking/payment path and payment initialization/webhook amount checks; inspect the anonymous booking insert use case and verification-token lookup caller. Then implement app integration against verified existing contracts. Keep production read-only during audit.



## Shortlet website-to-Paystack flow traced — 2026-11-28

- Inspected current branch files `booking.html`, `app.js`, `admin.html`, mobile `mobile/app/property/[id].tsx`, `mobile/app/account.tsx`, and shortlet payment Edge Functions.
- Website customer booking flow (`booking.html`):
  - Browser fetches the published property and calculates the estimate client-side from price × nights, extra guest fees, cleaning/service/other fees and caution fee; event bookings use event price × nights plus event caution fee.
  - Browser sends `amount_due` and other booking fields to `SourceStays.submitBooking`, which calls `create_customer_booking(p_payload)`.
  - Browser checks availability before submit and again immediately before RPC; the RPC performs its own authoritative availability check.
  - Customer must be signed in and booking email must match account email.
  - Website displays booking request received and tells the customer Source Stays will confirm availability/final amount and send payment instructions. It does not collect payment at booking submission.
- Production RPC definition supplied by user still accepts `amount_due` from payload and only checks it is positive. Therefore the website's browser-calculated amount is not independently recalculated by the deployed production RPC. The client can potentially tamper with the amount. This is a confirmed pricing-integrity gap, not just a theoretical concern.
- Repository contains a proposed migration `20261126180000_secure_customer_booking_pricing.sql` that replaces the RPC with server-side price calculation from the locked `properties` row (including event/accommodation price, nights, extra guest and one-off fees). This migration's comments say apply manually after testing in non-production; it is source code only and is NOT evidence that the production function has been replaced. Live function definition supplied by user takes precedence and shows it has not yet been applied there.
- Current mobile booking screen also calculates `amountDue` client-side and passes it to the same RPC. It explicitly tells customer final amount will be confirmed by Source Stays, no payment is taken yet. Thus mobile inherits the same amount-integrity gap until the server-side pricing migration is tested and applied to the correct project.
- Mobile customer account uses `initialize-shortlet-payment` and `verify-shortlet-payment` Edge Functions. It only renders Pay button when `payment_status != paid` and `payment_request_status = requested`. It opens the returned Paystack authorization URL with Linking and supports a separate verify action.
- `initialize-shortlet-payment` (tracked in repo):
  - Requires valid bearer-authenticated Supabase user.
  - Loads booking using service role but filters by booking ID AND authenticated customer_user_id.
  - Rejects missing/paid booking and requires `payment_request_status=requested`.
  - Reads `amount_due` from the booking row, validates positive NGN amount, creates/reuses a pending `shortlet_payment_transactions` row, generates a random reference, and calls Paystack initialize with amount in kobo and booking/customer metadata.
  - Client cannot set amount in request body. The payment amount is the stored booking amount, so it protects payment initialization from client tampering after booking, but it does not repair a bad amount originally inserted into bookings.
- `verify-shortlet-payment` (tracked):
  - Requires authenticated customer and selects payment transaction by booking ID plus customer_user_id.
  - Verifies the reference with Paystack and compares transaction ID/reference/currency/amount against stored transaction.
  - Re-reads the customer's booking and checks payment_request_status, currency and amount_due match the transaction before marking transaction and booking paid.
- `paystack-shortlet-webhook` (tracked):
  - Validates Paystack HMAC SHA-512 signature against raw request body using constant-time comparison.
  - Independently verifies transaction with Paystack.
  - Matches reference/transaction ID/currency/amount against local transaction and booking, checks payment request state, uses webhook event ledger for duplicate delivery handling, then marks transaction and booking paid.
  - Supabase config sets `verify_jwt=false` for this webhook; the function performs its own Paystack signature validation.
- Potential deployment/repository mismatch discovered in `admin.html`: admin `requestPayment(id)` invokes Edge Function `initialize-payment` (not found in tracked `supabase/functions` directory), then updates `bookings.payment_request_status='requested'`. The tracked customer initializer `initialize-shortlet-payment` requires that status to already be requested. The live deployed implementation of `initialize-payment` is not in the repo and must be identified before assuming the admin payment request path is consistent. Do not change either flow until the deployed function is confirmed.
- The tracked `initialize-shortlet-payment` requires request status='requested', whereas admin.html's legacy request flow calls a differently named `initialize-payment` function first and only then sets status. This is a critical workflow/deployment reconciliation item.
- The repository's tracked shortlet transaction migration creates `shortlet_payment_transactions` and `shortlet_paystack_webhook_events`, locks them to service_role (no anon/authenticated table grants), and enables RLS. This schema is consistent with the tracked Edge Functions, but actual production deployment still needs separate confirmation.
- No source files or databases were changed as part of this audit section. Production remains untouched.
- Next: user to check Supabase Dashboard > Edge Functions for deployed `initialize-payment`, `initialize-shortlet-payment`, `verify-shortlet-payment`, and `paystack-shortlet-webhook`, including deployed status/version. Also confirm whether migration `20261126180000_secure_customer_booking_pricing.sql` has been applied to main production (do not apply it until tested in test project and schema compatibility is verified).



## Production initialize-payment function inspected from user-provided source — 2026-11-28

- User supplied the deployed `initialize-payment` Edge Function source from the main production Supabase project.
- The function requires POST, a Bearer token, validates the session through Supabase Auth, and checks the caller's UUID exists in `admin_users`; non-admins are rejected.
- It loads the booking and checks it exists, checkout date has not passed, payment_status is not paid, booking status is not declined, and `owner_availability_status='available'`.
- It requires the latest `guest_verifications` row for the booking to have status approved.
- It reads `amount_due` from the booking row, requires positive amount and customer email, and only supports NGN.
- It checks approved `source_stays_credit_redemptions` for this booking, ensures at most one and that it belongs to the booking customer, validates amount and prevents credits covering/exceeding amount in this cash-payment path.
- It calculates cash due after credits, creates a unique Paystack reference, inserts a pending row in legacy `payment_transactions`, and relies on a database unique index to prevent concurrent active payment attempts before contacting Paystack.
- It initializes Paystack with the computed amount in kobo and booking/customer/credit metadata; it emails the authorization URL using Resend when configured. It returns authorization URL, reference, booking amount, credits applied and cash due.
- The function does not itself update `bookings.payment_request_status` in the supplied source. The previously inspected admin.html caller updates that field after invoking the function. Therefore inspect the exact caller's error handling and ordering; don't assume payment request state and transaction creation are atomic.
- This function is admin-only and represents a payment request from Source Stays staff after owner availability and guest verification. It is not the customer-facing `initialize-shortlet-payment` function tracked in the mobile branch.
- It trusts `bookings.amount_due`; it does not recalculate property pricing. This preserves the previously identified upstream pricing-integrity issue: correctness depends on how the booking amount was created/approved. Approved credits are deducted from the stored amount, but this does not correct an incorrect stored amount.
- It uses legacy `payment_transactions`, while the newer repository shortlet flow uses `shortlet_payment_transactions` and `shortlet_paystack_webhook_events`. Do not mix the two ledgers or wire mobile to the newer functions until their deployment and corresponding webhook path are confirmed.
- Next: inspect production `paystack-webhook` and admin.html's caller/updates; confirm deployed function list further down for any shortlet-specific functions. No production changes made.



## Production paystack-webhook source inspected from user-provided source — 2026-11-28

- User supplied the deployed main-production `paystack-webhook` Edge Function source.
- Handler is configured for unauthenticated webhook invocation (`withSupabase({ auth: "none" })`) and accepts POST only; this is expected for a payment gateway webhook because it authenticates with Paystack's signature.
- Verifies `x-paystack-signature` as HMAC-SHA512 over the exact raw request body using `PAYSTACK_SECRET_KEY`; rejects missing/invalid signatures and malformed JSON. Ignores events other than `charge.success`.
- Supports separate hotel path when metadata contains `hotel_request_id`: looks up `hotel_payment_transactions` by reference, checks request ID and gateway, compares event amount/currency to transaction amount/currency, marks pending transaction paid using conditional status update, and checks hotel request remains awaiting payment with unexpired availability and no confirmed reservation. It deliberately does not confirm the hotel's reservation or release identity; otherwise responds paid_needs_review for expired/ineligible request.
- Shortlet path requires numeric booking ID from metadata, finds legacy `payment_transactions` by reference, verifies booking ID and gateway, compares event amount/currency with local transaction, and loads booking. It verifies currency and reconciles amount due minus credits applied against event amount.
- Uses conditional update from pending to paid and checks latest state if another webhook delivery won the race. If transaction already paid, continues recovery steps rather than returning early.
- Rechecks current booking owner-availability state, declined status and latest guest-verification status before applying credits, confirming booking, or sending receipt. If no longer eligible, leaves payment recorded as paid but returns paid_needs_review for manual refund/resolution.
- Credit redemption is revalidated against booking, customer, amount and approved status; ledger insertion is guarded by checking for an existing redemption ledger entry and validating the winner, supporting duplicate delivery recovery.
- Updates booking to payment_status=paid and status=confirmed only after eligibility and credit handling. Sends receipt email with Resend idempotency key `booking-receipt-<reference>`.
- Important difference from the newer shortlet-specific webhook tracked in the mobile branch: the production webhook shown does **not** call Paystack's transaction verification API. It relies on a valid HMAC signature over Paystack's event payload plus comparison with the locally created payment transaction. This is an authentic signed event, but should be explicitly documented as the production trust model; do not claim the production webhook independently re-verifies transaction status with Paystack.
- The production webhook has no explicit separate webhook event-ID ledger in this source. It implements idempotency/recovery through conditional transaction status updates, credit ledger uniqueness/checks, booking status checks, and email idempotency key. Distinguish this from the newer repository migration that adds `shortlet_paystack_webhook_events`.
- No changes to production or deployed functions. No deployment performed.
- Current mobile recommendation: preserve existing production architecture and legacy transaction ledger unless/until a separately tested migration plan replaces it. Mobile must not call admin-only `initialize-payment`; it should request payment only when the existing admin workflow has completed and customer-facing payment state is available. Before selecting a customer initializer, reconcile the actual deployed Edge Function list and the customer authorization contract.
- Remaining checks: inspect `admin.html` caller behavior for `initialize-payment` and payment_request_status update order; verify production Edge Functions list below current viewport for any customer-facing shortlet initializer; inspect live production function source/behavior only through read-only review. Keep production unchanged.



## Production-only backend policy and app alignment — 2026-11-28

- User explicitly directed that mobile app development must use ONLY the main website production Supabase project. The separate `source-stays-testing` project must not be used for app development, app integration, testing, or deployment.
- Main website Supabase project ref confirmed from the user's production dashboard screenshot/function URL: `mrvckkzwhuoylxycaim`.
- Updated `mobile/src/lib/supabase.ts` to fail closed unless `EXPO_PUBLIC_SUPABASE_URL` exactly matches `https://mrvckkzwhuoylxycaim.supabase.co` and a publishable key is present. Existing `isSupabaseConfigured` export is retained for compatibility and now means the approved main production project is configured. Dev builds log an explicit warning when another project URL is configured. No service-role key is used in the app.
- Updated `mobile/.env.example` to identify the main website production URL and explicitly prohibit use of `source-stays-testing`.
- Commits: `34e333724ab217280820bf033cc3d928bb4792fb` (production project lock), `7eba6ce04d79441d55800f65c05522cacaffa1e7` (production env example).
- No Supabase database, Edge Function, secret, migration, or production website file was changed.
- Critical alignment work still required before app can be called production-ready:
  1. Replace mobile's newer shortlet payment calls/ledger assumptions with the existing deployed production customer-payment contract; do not call admin-only `initialize-payment` from the app.
  2. Confirm customer-facing payment request state update in deployed website admin flow and whether a customer-facing initializer exists in the production Edge Function list.
  3. Resolve the production booking pricing-integrity gap: live `create_customer_booking` accepts client `amount_due`; repository migration `20261126180000_secure_customer_booking_pricing.sql` is a candidate server-side pricing correction, but must not be deployed until reviewed against the actual production schema/business pricing rules. The user's instruction is production-only means no test-project rehearsal; any production schema change needs a separate explicit approval and careful backup/review.
  4. Audit every mobile table/view/RPC/Edge Function/storage bucket against the production schema and deployed functions before enabling the relevant screen.
  5. Remove/disable any app flow that writes to a table or invokes a function not confirmed to exist in main production.
- Existing mobile code still has direct calls to `initialize-shortlet-payment` and `verify-shortlet-payment` in `mobile/app/account.tsx`, and `initialize-hotel-payment` in `mobile/app/property/[id].tsx`. The latter appears in production function list screenshot; shortlet-specific calls are not yet confirmed in the production function list. Do not present payment integration as complete until corrected.
- User's instruction supersedes earlier plan to use `source-stays-testing` as a rehearsal target. Use static code review, CI/build checks, and read-only production schema/function inspection; never run app writes or payment tests against production without a separately agreed safe test plan.



## Mobile account shortlet payment alignment — 2026-11-28

- Removed mobile account calls to unconfirmed production functions `initialize-shortlet-payment` and `verify-shortlet-payment`. These functions exist in the app branch but are not confirmed deployed in the main website production project.
- Removed the in-app Paystack initialization and manual verification buttons for shortlet bookings. When the website's admin process has marked `payment_request_status='requested'`, the account screen now tells the customer to use the secure Paystack link sent to their registered email, consistent with the deployed production `initialize-payment` admin flow which emails the authorization URL.
- Kept booking status and payment status display. No calls to admin-only `initialize-payment` were added to the customer app.
- Commit: `5325a871dd128272c323242395ae11cde2b6460e`.
- Remaining payment integration decision depends on whether production has a distinct customer-facing function or whether the emailed Paystack link is the intended website flow. Do not re-enable in-app checkout until the deployed contract is confirmed.



## Main production object inventory received — 2026-11-28

- User supplied read-only SQL inventory from the main production project. This is now the canonical backend inventory for mobile alignment; do not use source-stays-testing.
- Confirmed production relations include:
  `admin_users`, `booking_payments`, `bookings`, `customer_profiles`, `enquiries`, `guest_verifications`, `hotel_availability_requests`, `hotel_payment_transactions`, `hotel_room_categories`, `hotel_room_categories_public` view, `hotel_source_stays_credit_redemptions`, `inspection_requests`, `payment_transactions`, `properties`, `property_date_blocks`, `property_images`, `property_inspections`, `property_partners`, `property_payment_instructions`, `property_payment_proofs`, `property_private_locations`, `property_sales`, `reviews`, `source_stays_credit_ledger`, `source_stays_credit_redemptions`, `villa_booking_requests`, `villa_packages`, `villa_packages_public`, plus Zylus-related sales/payment objects.
- Confirmed production functions relevant to mobile include `check_property_availability`, `create_customer_booking`, `get_booking_id_by_verification_token`, `submit_guest_verification`, `validate_villa_request`, `request_source_stays_credit_redemption`, `request_hotel_source_stays_credit_redemption`, `source_stays_credit_balance`, `admin_review_source_stays_redemption`, and `admin_review_hotel_source_stays_credit_redemption`.
- Confirmed production storage buckets: public `Property_images`, public `Property_videos`, private `guest-verification-documents`, private `inspection-evidence`, private `partner-property-payment-proofs`, private `zylus-payment-proofs`.
- Confirmed table/view presence resolves earlier uncertainty: `property_images`, `villa_booking_requests`, `reviews`, `hotel_source_stays_credit_redemptions` exist. The existence of an object does not establish column compatibility, RLS, grants, or customer access.
- Production public views `hotel_room_categories_public` and `villa_packages_public` are present, as previously confirmed.
- Production function inventory did not list newer test-branch `create_customer_booking` variant separately (same signature only); continue to rely on the live definition supplied earlier for pricing behavior.
- Next: get exact columns for mobile-used tables and views, and inspect deployed Edge Function inventory. Then compare all app queries and correct code without applying database changes.
- No production DB changes made.
