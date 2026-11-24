# CLI customer launch preview

## Summary

The main page links to a public CLI guide; the authenticated dashboard provides organization-scoped setup and release downloads. Backend counterpart: https://github.com/mavutech/golden-setups-sona-alerts/pull/78. Launch tracking: https://github.com/mavutech/golden-setups-sona-alerts/issues/86.

## Key points

- Preview: https://harpervanceqa-dev--cli-guide-20261124-6qeoeo74.web.app/; guide: `/docs/cli`. Preview expires December 1, 2026.
- Implementation maps higher-tier CLI access to Desk Intelligence and Firm Wide Enterprise; Entity Core is excluded and custom agreements require an explicit grant.
- Guides are exported from the backend's maintained `docs/cli/` source with `npm run docs:cli:sync`, including safe Postman files. Update the snapshot with each contract change.
- No main-branch merge, live Hosting release, backend deployment or customer entitlement changes have occurred.

## Table

| Evidence | Result |
|---|---|
| Frontend tests | 105 suites / 551 tests pass; affected guide/landing tests also pass after final eligibility copy |
| Backend/CLI counterpart | 1,103 backend tests; 49 CLI tests; 12 actual-route emulator checks including 48 Postman requests |
| Public preview browser checks | Landing-to-guide navigation, direct routes/refresh and phone layout checks pass |
| Real dashboard against isolated services | Eligible/restricted organizations, authenticated download checksum, switching, suspension and refresh pass |
| Build | Production build and entry-bundle budget pass; existing customer-admin hook warnings and outdated Browserslist data remain |

## Risks with mitigations

The preview's existing API rewrite does not activate new backend CLI routes. Real customer use requires the counterpart deployment and governed entitlement reissue. Server permission checks, rather than hidden download links, enforce access.

The screenshots use synthetic organizations with explicitly simulated Auth-emulator MFA claims; they are not evidence of genuine Google TOTP acceptance. No authentication bypass or demo route is added to the production frontend.

## Recommendations

Review the preview and the source pull requests together. Confirm the higher-tier plan mapping before enabling customer entitlements. Keep the existing backend deployment approval gate and real-account/live-trigger checks.

## Next steps

Complete backend release tickets #83–#85 with exact deployed revisions, real-account MFA, trigger delivery/operational evidence and final customer documentation acceptance.

Screenshots: [eligible account](screenshots/dashboard-cli-eligible.png), [restricted account](screenshots/dashboard-cli-restricted.png), [phone layout](screenshots/dashboard-cli-mobile.png).
