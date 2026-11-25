# Harper Vance CLI preview

## Summary

The front page introduces Harper Vance CLI and links to a public API catalog. It lists available APIs and parameters without installation, sign-in workflows, package downloads or collection templates. Full client documentation is served by the authenticated `/api/cli/docs` endpoint after eligible-organization access is verified.

## Key points

- Preview: https://harpervanceqa-dev--cli-guide-20261124-6qeoeo74.web.app/; API catalog: `/docs/cli`.
- Eligible tiers: Desk Intelligence and Firm Wide Enterprise. Entity Core is excluded; custom agreements need an explicit grant.
- CLI command: `hv`; package: `@harper-vance/cli`; configuration: `HV_*`. Customer-facing pages, documentation, help, downloads and screenshots use Harper Vance branding.
- Public assets no longer contain the full guide or collection files. Signed-in guide links preserve the selected organization; the server enforces the permission independently of the page.

## Table

| Verification | Evidence |
|---|---|
| Authentication and tier | Actual API checks: 401 without authentication; 403 without MFA, relevant grants or eligible tier; 200 for authorized clients |
| Client archive | Clean installation, executable/version/help and archive branding checks |
| Front-page screenshots | Desktop, CLI feature section and mobile below |
| Public guide | API catalog only; former detailed public routes reveal no installation instructions |
| Protected guide | Real dashboard browser retrieves the guide through the authorized backend; emulator MFA claims are explicitly simulated |

## Risks with mitigations

This is a Hosting review preview. Shared-backend deployment, existing customer entitlement reissue, real-account CLI MFA and automatic deployed-trigger acceptance remain separate release gates. No production authentication bypass or demo route was introduced.

## Recommendations

Review the front page and API catalog. Keep client instructions and installers behind authenticated eligible-tier access.

## Next steps

Complete the approved release workflow and real-account/live verification before customer rollout.

[Front page](screenshots/front-page-desktop.png) · [CLI section](screenshots/front-page-cli-section.png) · [Phone front page](screenshots/front-page-mobile.png) · [Public API catalog](screenshots/public-api-catalog.png)

Dashboard examples use labeled synthetic organizations: [eligible](screenshots/dashboard-cli-eligible.png), [restricted](screenshots/dashboard-cli-restricted.png), [phone](screenshots/dashboard-cli-mobile.png).
