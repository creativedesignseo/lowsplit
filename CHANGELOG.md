# Changelog

All notable changes to this project will be documented in this file.


## [1.4.2] - 2026-02-13

### Added
- **SEO Protection**: Implemented `X-Robots-Tag: noindex` in `netlify.toml` to prevent staging indexing.
- **Email Templates**: Designed modern HTML template for 'Confirm Signup' emails (`email_template_design.html`).

### Changed
- **Site Mapping**: Generated `radiografia-sitio.md` detailing the complete URL structure for future SEO strategy.

## [1.4.1] - 2026-02-09

### Fixed
- **Dashboard Logic**: Restored "Manage" button and `EditGroupModal` functionality.
- **Data Refresh**: Fixed bug where dashboard data wouldn't refresh after group updates due to missing user ID.

### Changed
- **Group Management**: Moved manual slot management from `GroupDetailPage` to `DashboardPage` modal.

## [1.4.0] - 2026-02-08

### Added
- **Skill System**: Implemented new standard for skill creation (`creador-de-skills-antigravity.md`) and first skill `guardar-cambios-git`.

### Changed
- **Dashboard Optimization**: Refactored `DashboardPage.jsx` to fetch data in parallel, significantly improving load times.
- **Bundle Optimization**: Replaced named imports from `lucide-react` with direct path imports in `DashboardPage` and `ServiceDetail` to reduce bundle size.
- **Design Standardization**: Enforced `rounded-xl` and official red `#EF534F` across all buttons and inputs.
- **Design Audit Skill**: Updated `auditar-consistencia-diseno` with auto-fix capabilities.

## [1.3.1] - 2026-01-30

### Added
- **Super Admin Role**: Implemented `super_admin` role in `profiles` table to distinguish platform administrators.
- **Official Groups UI**: Added distinct visual treatment for groups owned by Super Admins (red border, "Recomendado" badge, official logo).
- **Sorting Logic**: Updated `ServiceDetailPage` to always prioritize Official Groups at the top of the list.

### Fixed
- **User Creation Trigger**: Fixed `handle_new_user` trigger to prevents race conditions and "Database Error" during manual user creation in Supabase Dashboard.
- **Database Schema**: Added missing columns `invoice_verified` and `instant_acceptance` to `subscription_groups` table to prevent SQL errors.
- **Profile Sync**: Added SQL script to sync users from Auth to Profiles if they were created during trigger outage.

## [1.3.0] - 2026-01-30

### Changed
- **Service Catalog Consolidation**: Refactored `seed_services.sql` to eliminate duplicate and mixed-case services (e.g., merged 'Spotify Family' into 'Spotify', 'Netflix Standard' into 'Netflix').
- **Safe Data Migration**: Implemented SQL logic to safely migrate existing subscription groups to canonical services before deleting deprecated ones.
- **Icon Asset Management**: Removed external image dependencies. All service logos are now served locally from `public/logos/`.
- **UI Logic Upgrade**: Updated `utils.js` `getLogoUrl` to correctly differentiate between 'icon' (small) and 'full' (logotype) assets, ensuring better visual presentation in Service Cards.

### Fixed
- **Visual Asset Repairs**: Restored correct SVG assets for Duolingo, Disney+, HBO Max, and Crunchyroll.
- **Database Integrity**: Added foreign key protection during catalog cleanup to prevent orphaned groups.

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
