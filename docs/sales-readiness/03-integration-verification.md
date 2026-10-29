# Integration demonstration readiness

## Summary

Phase 3 documentation review and test preparation are complete. End-to-end certification is pending. Use the existing backend `docs/client-readiness/customer-facing/integration-setup-guide.md`, version `integration_setup_guide_v0_2_2026_10_29`, as the reference. This checklist supplements it and does not create a competing customer guide.

No credential was created, destination contacted, integration activated, or production control changed during this preparation. The technical owner must approve the guide and authorize the organization, data scope, receiver, and test window before execution.

## Key points

- Existing paid API routes provide daily, weekly, and history records, not live targets.
- Managed daily-report webhooks and legacy live-target webhooks are separate delivery paths.
- Owner-approved commercial direction in `docs/landing-refinement-review.md`: Desk and Enterprise eligible for live-target arrangements, not Core; standard assisted setup without a separate webhook fee; one initial Desk live destination, Enterprise scope by agreement. Approval of terms is not proof of runtime enforcement or receipt.
- The guide's older statement that commercial eligibility remains unconfirmed should be reconciled with that approval before publication. Do not change legal agreements or runtime entitlements through this document.
- Existing backend guide changes are in another checkout with unrelated local changes. That checkout was read only and is not part of these commits.

## Table

| Check | Current evidence | Remaining acceptance |
| --- | --- | --- |
| API route and field documentation | Guide covers daily, weekly, history, authentication, timestamps, errors, scope and limits; source routes reviewed | Authorized account reads a permitted record successfully; record version and safe request ID |
| Daily webhook setup | Guide covers paused creation, synthetic test, acknowledgement, activation, URL handling | Approved receiver accepts a harmless test and then a real authorized completed-session event |
| Event interpretation | Guide covers event identity, report type, version, test flag, data, compatibility fields | Receiver distinguishes synthetic from real data and safely validates expected fields |
| Recovery | Explicit eligible retries and duplicate risk documented; no ordering or exactly-once promise | Authorized controlled recovery exercise, with receiver evidence and no unintended repeated processing |
| Sender verification | Reviewed managed transport has no HMAC signature or custom authorization header | Technical owner assesses customer's security requirements; unsupported requirements become separate proposals |
| Live-target delivery | Legacy signal path exists; approved commercial arrangement documented separately | Confirm deployed route, safe transport, plan/destination enforcement, supported event schema and an actual authorized receipt |
| Customer documentation location | Repository draft exists | Approve and choose a usable customer-help destination; historical PDF/DOCX editions are not automatically current |

## Recommendations

### Authorized test procedure

1. Record the technical approver, approved organization, responsible receiver owner, permitted data, and environment in private operations records. Do not copy endpoint secrets or credentials into this repository.
2. Confirm the organization and applicable access are active. Check approved agreements without accepting terms on the customer's behalf.
3. Use an authorized scoped API credential held in an approved secret store. Read one permitted daily record. Check the response, date, and expected fields. A login session is not a paid API credential.
4. Create a managed daily-report destination only after explicit approval. Confirm it is paused, perform the synthetic test, and obtain receiver acknowledgement. Do not treat a successful test as production delivery evidence.
5. After authorized acknowledgement and activation, confirm dispatch controls permit daily delivery. Wait for a real completed-session event or use a separately approved replay. Confirm event identity at the receiver and downstream handling, not just HTTP acceptance.
6. Confirm duplicate handling and recovery in an authorized test setting. Do not deliberately disrupt a production receiver. Record any scenario not exercised as untested.
7. Test live-target delivery separately if needed. Read the deployed route and verify plan limits before activation. Do not switch notification controls just to make a demo pass.
8. Record safe evidence, revoke temporary access or remove temporary destinations only under the agreed cleanup scope, and obtain technical sign-off. Keep secrets and raw customer payloads out of notes.

### Synthetic example reference

This is a field explanation, not an executed delivery or market example. The current generator uses a `test_` event ID, `reportType` of `test`, `schemaVersion` of 1, and `test` set to true. Its sample ticker is `TEST`, date is `2000-01-01`, created count is the string `2`, reached count is the string `1`, and accuracy is the formatted string `50.0% Accuracy`. Report data is nested under `data`, with compatibility copies at the root in the wire payload. Receivers must not assume all report values are numbers.

Source references in the backend: `functions/features/customerOperations/integrationPayload.js`, `integrationConstants.js`, `notificationSource.js`, `functions/features/productData/product_api_routes.js`, and `functions/features/webhookMassNotification/webhookMassNotification_service.js`. The existing guide names the additional transport, validation, authentication, and service sources.

### Delivery control finding

The reviewed sender reads `notificationControls/daily`. A `paused` selection suppresses sends. The `firestore` selection accepts only daily events after its configured cutoff, returning early for other report types. This is a source-level finding, not a claim about the deployed value or an observed outage. The legacy live path's enforcement of the newly approved per-plan live limits has not been demonstrated in this review.

### Evidence record to complete privately

Record test date/time and zone, approver, organization alias, environment, guide version, event type, safe request/event reference, test-versus-real flag, sender acceptance, receiver receipt, downstream handling, duplicate/recovery result, exceptions, cleanup, and technical sign-off. Use Pending, Pass, Fail, or Not tested. Never fill a result from expectation alone.

## Risks with mitigations

- Synthetic success hiding disabled dispatch: require a real-event receipt check.
- API documentation implying live target access: keep the supported report routes explicit.
- Daily destination limits being applied to live targets: keep the arrangements separate.
- Unsupported security promises: do not describe signed events, exactly-once delivery, ordering, or automatic recovery as existing features.
- Unapproved operations: this preparation does not authorize endpoint creation, activation, control changes, terms acceptance, or data sharing.

## Next steps

Technical owner supplies or designates an authorized test organization and receiver, approves the test scope, and resolves guide publication wording. Until actual receipt and required security checks pass, mark integration-dependent evaluations as pending technical verification. Dashboard-only sales conversations need not wait for this test.
