# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-01-29

### Added
- **System Notifications (Realtime)**: Integrated notification system with `notifications` table, RLS, and realtime subscriptions.
- **NotificationBell**: New UI component in Navbar to view, read, and delete notifications.
- **Automatic Alerts**: Triggers added for: Successful Group Join, Wallet Recharge, New Group Creation, and Credential Updates.
- **Vite Config Hardening**: Forced host and strict port configuration to ensure stability with `netlify dev` on Windows.

### Changed
- **Wallet Unification**: Centralized all recharge logic into a reusable `RechargeModal` component, ensuring consistency between Dashboard and Wallet Page.
- **Dashboard Feedback**: Improved user feedback on dashboard actions with immediate alerts.

## [1.1.0] - 2026-01-29

### Added
- **Wallet System**: New integrated balance system with `wallets` and `transactions` tables.
- **Stripe Top-ups**: Direct recharge functionality via Stripe Checkout and Netlify Functions.
- **Join with Balance**: Capability to join subscription groups by deducting funds directly from the internal wallet.
- **Wallet Page**: Redesigned `/wallet` page with premium UI, real-time balance, and monthly transaction history.
- **Navbar Integration**: Replaced the static 'Total Savings' in the user menu with a live 'Available Balance' link that navigates directly to the wallet.

### Fixed
- **API Robustness**: Improved error handling for Netlify Functions, identifying common setup issues like incorrect ports.
- **Unified Recharge**: Extracted local recharge logic into a shared `RechargeModal` component for Dashboard and Wallet.
- **Premium Design**: Re-implemented the "Premium Red" aesthetic with custom icons and solid red accents in the recharge flow.
- **Port Detection**: Added helpful error messaging for local development regarding Netlify's port 8888.

## [1.0.2] - 2026-01-28

### CRITICAL FIXES (DATABASE & SECURITY)
- **RLS Infinite Recursion**: Fixed HTTP 500 errors caused by recursive Row Level Security policies (Code 42P17). Cleaned up zombie policies using `database/rls_policies.sql`.
- **Profile Integrity**: Identified and resolved silent failures in group creation caused by missing entries in `public.profiles` (Foreign Key constraint violation).
- **Dashboard Visibility**: Restored group visibility by simplifying RLS policies to non-recursive logic.

## [1.0.1] - 2026-01-25

### Added
- **Group Hub**: New page `GroupDetailPage.jsx` featuring private chat placeholder and member list.
- **Official Hub UI**: Added community sections to `ServiceDetailPage.jsx` for platform-managed services.
- **Dashboard Links**: Subscriptions in the dashboard now link directly to their respective Group Hubs.

### Fixed
- **Supabase queries**: Resolved 400 errors caused by non-existent `email` column in `profiles` and standardized join syntax (`profiles!admin_id`).
- **Dashboard Credentials**: Fixed credential visibility and refresh logic in `DashboardPage.jsx`.

### Changed
- **Service Cards**: Redesigned `ServiceCard.jsx` with a 3-section layout (Logo, Price/Social Proof, Features) to match the requested premium aesthetic.
- **Explore Page**: Updated `ExplorePage.jsx` to fetch and filter real group data from Supabase.
