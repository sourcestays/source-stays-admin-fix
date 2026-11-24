# Source Stays Mobile

Cross-platform customer app for Android and iOS, built with Expo, React Native, TypeScript and Expo Router.

## Local setup

1. Install Node.js 20.19.4 or newer.
2. From this directory, run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the existing Source Stays Supabase project values.
5. Run `npx expo start` and open the app with Expo Go or a development build.

Never put a Supabase secret/service-role key, Paystack secret key, Dojah credentials, or other server credentials in the mobile app. Mobile environment variables prefixed with `EXPO_PUBLIC_` are bundled into the client and are public.

## Existing platform integration

The existing website is a static HTML/CSS/JavaScript application in the repository root. It remains in place and is not replaced by this app.

The website already reads published listings from `properties`, reads property photos from `property_images`, uses the public `hotel_room_categories_public` and `villa_packages_public` views, creates bookings through `create_customer_booking`, and checks availability through `check_property_availability`. The mobile app should reuse those established contracts where their authorization and response shapes are confirmed.

## Architecture rules

- One Supabase project and shared data model for web and mobile.
- Use the publishable key only with correct Row Level Security policies.
- Keep privileged operations in Supabase Edge Functions or secure database functions.
- Payments must be initialized and verified server-side; never trust a client-submitted amount or payment status.
- Preserve the existing website booking, guest verification, hotel room-category, property-sale, partner-protection and rewards flows.
- Do not run schema migrations or alter production policies until the current database schema and RLS policies have been audited.

## Delivery phases

1. Foundation: app shell, design tokens, Supabase client and environment setup.
2. Discovery: shortlets, hotels, property sales/rentals, filters and listing details.
3. Accounts: sign-in, profiles, bookings and guest verification.
4. Transactions: booking requests, availability, Paystack checkout and verified receipts.
5. Rewards: credit ledger, balance, eligibility and redemption.
6. Partner/admin operations, push notifications, accessibility, security review and store release.

The first screen is a visual foundation only. Division tiles become navigable features as each flow is implemented and tested against the live schema.
