# Phase 2: Frontend Access Contract

## Summary

The dashboard will use one backend response to understand the signed-in customer's organization, membership, license, features, and limits. The frontend will not read Firestore subscription documents directly and will not infer access from a pricing-tier name.

This keeps the user experience consistent while the backend and database rules remain responsible for real enforcement.

## Access bootstrap

After Firebase restores the signed-in session, the application calls:

```text
GET /api/access/me
```

The existing authenticated API client supplies the Firebase ID token. The response uses the standard backend envelope and contains:

- a safe user summary;
- every active or visible organization membership;
- each organization's resolved subscription state;
- the exact enabled feature keys;
- numeric limits such as historical retention and API throughput;
- the user's default organization ID.

## Canonical response fields

| Field | Frontend use |
| --- | --- |
| `user.uid` | Stable identity key |
| `user.displayName` | Account display |
| `user.platformRole` | Platform administration only |
| `organizations[].orgId` | Customer-account selection and request context |
| `organizations[].name` | Customer-account display |
| `organizations[].orgRole` | Owner, admin, or member controls |
| `organizations[].membershipStatus` | Blocks suspended or revoked people |
| `organizations[].subscriptionStatus` | Drives active, pending, suspended, expired, or canceled experience |
| `organizations[].licenseCode` | Customer-facing license label only |
| `organizations[].entitlementVersionId` | Detects access changes and stale state |
| `organizations[].features` | Controls product routes and actions |
| `organizations[].limits` | Controls retention choices, seats, API rate display, and destination limits |
| `defaultOrgId` | Initial active customer account |

## Canonical feature keys

| Feature key | Frontend behavior |
| --- | --- |
| `dashboard.liveTargets` | Enables Today's Targets |
| `dashboard.dailyReports` | Enables Daily Performance |
| `dashboard.weeklyReports` | Enables Weekly Summary |
| `dashboard.history` | Enables Historical and Rolling |
| `delivery.email` | Shows scheduled email controls |
| `delivery.teamNotifications` | Shows Slack or Teams notification controls |
| `delivery.webhooks` | Shows webhook controls |
| `api.rest` | Shows API-client controls and documentation entry |
| `rights.internalRedistribution` | Shows the licensed internal-use statement |
| `service.sla` | Shows service-commitment information |

## Limits

| Limit key | Frontend behavior |
| --- | --- |
| `history.retentionDays` | Bounds date choices; `null` means full archive |
| `seats.limit` | Shows seat capacity to customer administrators |
| `api.requestsPerMinute` | Shows the current API allowance; `null` means API disabled |
| `webhooks.maxDestinations` | Bounds webhook destination creation |

The frontend displays limits but does not enforce them alone. The backend repeats each check on protected operations.

## Route policy

| Route | Required feature | Data delivery |
| --- | --- | --- |
| `/dashboard/sona-targets` | `dashboard.liveTargets` | Realtime Database with server-managed access projection |
| `/dashboard/sona-daily` | `dashboard.dailyReports` | Current report may use approved direct access; older dates use a bounded backend endpoint |
| `/dashboard/sona-weekly` | `dashboard.weeklyReports` | Current report may use approved direct access; older weeks use a bounded backend endpoint |
| `/dashboard/sona-history` | `dashboard.history` | Authenticated backend endpoint enforces retention |
| Future account administration | Owner or admin organization role | Authenticated backend only |
| Future delivery settings | Matching delivery feature plus owner or admin organization role | Authenticated backend only |
| Future API-client settings | `api.rest` plus owner or admin organization role | Authenticated backend only |

## Required application states

| State | Customer experience |
| --- | --- |
| Auth restoring | Neutral loading screen; do not flash protected content |
| Access loading | Dashboard shell waits for the access response |
| No organization | Explain that the account is not connected to a customer and provide support direction |
| Invitation pending | Direct the user to finish the invitation flow |
| Subscription pending | Explain that access is being provisioned |
| Active | Show only entitled product areas |
| Membership suspended | Block product data and explain who can restore access |
| Subscription suspended | Block product data and direct the user to the customer administrator or Harper Vance contact |
| Subscription expired or canceled | Block product data and present renewal contact information |
| Access request failed | Show a retry action and a request ID when available; never assume access |
| Feature unavailable | Explain that the feature is not included without presenting it as a technical failure |

## Organization selection

- If the user belongs to one active organization, select it automatically.
- If the user belongs to more than one, use `defaultOrgId` when valid and provide an explicit organization switcher.
- Every organization-scoped backend request sends the selected `orgId` in the route or validated request field.
- Changing the organization clears organization-scoped cached data and subscriptions before loading the new account.
- The frontend never treats an organization ID from local storage as proof of membership.

## Role policy

Platform roles and organization roles serve different purposes:

| Role type | Purpose |
| --- | --- |
| Platform role | Harper Vance internal administration across customers |
| Organization role | Customer-level ownership and administration |

Product viewing requires an active membership and the matching feature, not an elevated platform role. Customer settings require an organization owner or admin. A platform administrator may use separate administrative tools, but customer-facing routes should still show which organization context is active.

## Client storage policy

- Firebase SDK continues to manage authentication persistence.
- Tokens are never stored in Redux, local storage, or session storage.
- The access response may live in memory and Redux for the current session.
- A selected organization ID may be remembered only as a preference. The server revalidates it on every protected request.
- Destination addresses, endpoint URLs, credentials, agreement data, and billing data are never cached in browser persistence.

## Refresh policy

The access response is refreshed:

- after sign-in;
- after invitation acceptance;
- after an organization switch;
- after seat, role, subscription, or destination administration;
- after a 401 or access-version conflict;
- when the app returns from a long background period.

The `entitlementVersionId` provides a stable change marker. It is not itself permission proof.

## Error policy

| Backend outcome | Frontend response |
| --- | --- |
| `401 UNAUTHENTICATED` | Refresh once through the shared client, then return to login |
| `403 FORBIDDEN` | Clear protected data and show the applicable access state |
| `409 ACCESS_VERSION_STALE` | Refresh access and retry one safe read once |
| `410 SUBSCRIPTION_EXPIRED` | Show expired access state |
| `429 RATE_LIMITED` | Show a retry time without repeated automatic requests |
| `5xx` | Show a safe service error with request ID; do not expose internals |

## Transition from current behavior

| Current behavior | Target behavior |
| --- | --- |
| Any authenticated user reaches all four product routes | Active membership plus matching feature is required |
| Frontend reads legacy `role` claim | Frontend uses canonical `platformRole` from access response |
| Frontend `fetchMe` expects `role` | Access response and profile mapping use `platformRole` consistently |
| Browser creates a Realtime Database user record | Backend-managed Firestore user lifecycle is authoritative |
| Historical data is read directly without a license check | Bounded backend history reads enforce retention |
| No suspension or expiry screen | Explicit customer-safe access states |
| Template pages share the protected application | Product route list is explicit; unrelated template routes are quarantined |

## Phase 2 acceptance record

- The frontend depends on one safe access response.
- License names are not used as permission logic.
- Product routes map to canonical feature keys.
- Historical retention has a backend enforcement point.
- Platform and organization roles are separated.
- Suspended, expired, pending, and failed states are defined.
- Token and customer-secret storage boundaries are explicit.
