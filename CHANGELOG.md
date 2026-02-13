# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-13

### Fixed
- **Critical Payment Flow**: Resolved issue where Stripe payments succeeded but subscriptions were not created in Supabase.
  - **Supabase RPC**: Recreated `handle_join_group_card` to correctly return UUIDs, fixing type mismatches.
  - **Stripe Metadata**: Added `serviceName` to `create-group-checkout.js` metadata to ensure proper data flow to webhooks.
  - **Webhook Linking**: Updated webhook handler to correctly capture membership IDs and link them to `payment_transactions`.
  - **URL Fallbacks**: Hardcoded reliable fallback URLs (`https://lowsplit-app.netlify.app`) in `create-checkout.js` and `create-group-checkout.js` to prevent "Invalid URL" errors from Stripe when headers are missing.
  - **Stripe Webhook Configuration**: Synced `STRIPE_WEBHOOK_SECRET` between Stripe Dashboard and Netlify/local environment to enable secure event signing.

### Recovered
- **Manual Data Recovery**:
  - Restored "Apple One" memberships for affected users.
  - Manually created "Nintendo Switch Online" admin membership via SQL.

### Added
- **Documentation**: Added this CHANGELOG.md to track project history.
