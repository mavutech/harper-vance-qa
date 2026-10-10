# Phase 6 product access integration

## Purpose

Phase 6 connects the customer dashboard to the server-controlled access model.
It closes the gap between the owner administration tools and what a licensed
customer can actually open and read.

## Customer behavior

- Today's Targets, Daily Performance, Weekly Summary, and Historical and
  Rolling appear only when the customer's current license includes them.
- Opening a licensed product route requires the matching active feature.
- A missing feature produces a clear account-access page instead of a raw
  permission message.
- A temporary access-check failure can be retried without signing out.
- The platform-owner administration route remains controlled by the canonical
  `super_admin` role, not by a customer product license.

## Data access

- Current targets use `GET /api/product/targets`.
- Current day context uses `GET /api/product/day-context`.
- Daily, weekly, and historical pages continue using their existing product
  API routes.
- The browser no longer reads current targets or day context directly from
  Realtime Database.
- The backend remains the final authority for organization membership,
  subscription status, entitlements, dates, and history limits.

## Owner access recovery

Application startup requests fresh Firebase role claims. If the refresh is
temporarily unavailable, the app falls back to the cached signed-in token. This
lets a newly granted owner role take effect after a page refresh without
weakening the backend role check.

## Acceptance checks

- A full frontend test run passes.
- A production build completes successfully.
- No SONA product module imports direct Realtime Database reads.
- A licensed account can open all included product areas.
- An unlicensed feature is absent from navigation and denied by its route.
- The approved owner can open Customer Organizations.
- The Firebase preview is reviewed before merge.

## Rollback

Revert the Phase 6 frontend commit. This phase does not rewrite product data or
customer-control records, so rollback does not require data restoration.
