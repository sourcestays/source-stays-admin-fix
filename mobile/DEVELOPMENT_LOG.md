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

1. Confirm GitHub Actions run #79 result for commit `b114b910d28f7ece4077eb49a47dbcd9e060c13b`. If it fails, inspect logs and fix before continuing.
2. Continue screen-by-screen light/dark theme audit of remaining nested screens and any remaining inline hard-coded colours.
4. Review app navigation and customer discovery flows end-to-end.
5. Test Supabase authentication, published listing reads, pricing, partner privacy, booking requests and payment verification against the existing contracts.
6. Complete accessibility, loading/error/empty states and mobile layout checks.
7. Only after the wider app is ready, prepare Android APK and iOS TestFlight/store release steps.


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
- CI results after these changes: RECB run #95 and latest account run #96 were still running at the time this log was edited. Earlier theme screen runs #90–#92 and account run #93 passed; #94 was still running. Confirm the newest run before marking the full milestone complete.
