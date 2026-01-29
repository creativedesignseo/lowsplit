# Changelog

All notable changes to this project will be documented in this file.

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
