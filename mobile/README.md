# Source Stays Mobile

Cross-platform customer app for Android and iOS, built with Expo, React Native, TypeScript and Expo Router.

## Development from GitHub

The source code is maintained in the `mobile-app-foundation` branch. GitHub Codespaces can provide a cloud development terminal without requiring a local Node.js installation.

1. Open the repository on GitHub and select the `mobile-app-foundation` branch.
2. Open **Code → Codespaces → Create codespace on mobile-app-foundation** (if Codespaces is enabled for the GitHub account).
3. In the Codespaces terminal, run:
   ```bash
   cd mobile
   npm install
   cp .env.example .env
   ```
4. Add the existing Source Stays Supabase project URL and publishable key to `.env`.
5. Run `npx expo start --tunnel`.
6. Install Expo Go from Google Play on the Android phone and scan the QR code shown in the Codespaces terminal/browser.

If Codespaces is unavailable, GitHub Actions validates the TypeScript project and exports the Android JavaScript bundle on pushes to this branch. A standalone installable APK can be produced with an Expo Application Services (EAS) account using the preview profile in `eas.json`.

## Local commands

- `npm run start` — start Expo.
- `npm run typecheck` — run TypeScript validation.
- `npx expo export --platform android` — produce an Android JS bundle.
- `npx eas-cli build --platform android --profile preview` — build an installable preview APK after configuring the Expo project and EAS credentials.

## Configuration and security

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the existing Source Stays Supabase project values.
3. Never put a Supabase secret/service-role key, Paystack secret key, Dojah credentials or other server credentials in the mobile app. Variables prefixed with `EXPO_PUBLIC_` are bundled into the client and are public.

## Existing platform integration

The existing website is a static HTML/CSS/JavaScript application in the repository root. It remains in place and is not replaced by this app.

The website reads published listings from `properties`, property photos from `property_images`, public hotel room rates from `hotel_room_categories_public`, and public villa package prices from `villa_packages_public`. It creates bookings through `create_customer_booking`, checks availability through `check_property_availability`, and inserts enquiries into `enquiries`.

The mobile app currently implements home navigation, division listing discovery, customer-safe starting-rate reads, property detail pages, hotel room category display, customer account sign-in/sign-up and read-only rewards history. Booking/payment writes are not implemented yet.

## Architecture rules

- One Supabase project and shared data model for web and mobile.
- Use the publishable key only with correct Row Level Security policies.
- Keep privileged operations in Supabase Edge Functions or secure database functions.
- Payments must be initialized and verified server-side; never trust a client-submitted amount or payment status.
- Preserve the existing website booking, guest verification, hotel room-category, property-sale, partner-protection and rewards flows.
- Do not run schema migrations or alter production policies until the current database schema and RLS policies have been audited.

## Delivery phases

1. Foundation and navigation.
2. Discovery: shortlets, hotels, real estate, filters and listing details.
3. Accounts: sign-in, profiles, bookings and guest verification.
4. Transactions: availability, booking requests, Paystack checkout and verified receipts.
5. Rewards: credit ledger, balance, eligibility and redemption.
6. Partner/admin operations, push notifications, accessibility, security review and store release.
