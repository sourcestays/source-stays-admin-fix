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
