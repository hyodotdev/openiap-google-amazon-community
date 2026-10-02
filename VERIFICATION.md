# Community example verification — October 7, 2026

This report covers the educational `openiap-google-amazon-community` repository. For production FireOS apps, use the [official OpenIAP Amazon integration](https://openiap.dev/docs/setup/store/amazon).

## Inputs and installation

- OpenIAP input: `d1a30bfa2a3af90d2a941df9e55bfcc97e39fdd4`, pinned in [openiap-revision.txt](openiap-revision.txt).
- Client Protocol 0.2.0; local public core 3.6.2; public conformance suite 4.0.0; Amazon SDK 3.0.9. PR #504 remains unmerged. These artifacts were built locally, rather than fetched as a released 4.0.0 core.
- Current source package: **0.0.2, unpublished**. The consumer installs the prepared local tarball; its Maven provider and config plugin use `amazon_example`. Package and Maven artifact names are unchanged.
- Published 0.0.1, 0.1.1 and 0.1.2 retain `amazon-example`. Their historical registry installation results are in the [previous report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/a8a1a0d2103f95cb5c0da2a5c25c2965ee56418b/VERIFICATION.md); they do not establish registry installation of the current source.
- Provider release AAR SHA-256: `3e852c07c7f2f4cdeaaa736690f9b8191911c0ce6b4374587f87ac286e482e5c`. The artifact, staged Maven repository and installed tarball agree.

## Automated checks

| Check | Result |
| --- | --- |
| Provider debug unit tests | 67 total: 65 passed, 2 optional-capability skips, no failures or errors |
| Public Android provider profile | All 16 required behaviors passed; offer-code redemption and subscription billing issue not applicable |
| Packaging and provenance | All 7 tests passed; prepared package, AAR and pinned inputs agree |
| Provider release lint | Passed |
| Expo consumer | Typecheck and all 178 tests in 20 suites passed |
| Android consumer | Debug and optimized ARM64 R8 release builds passed; factory name retained |
| Native dependencies | Public core, this provider and Amazon SDK; no official provider, Play Billing or Horizon SDK |

The [committed conformance report](reports/amazon_example.json) is copied from the suite output. The suite exercises controlled vendor transport; it does not certify subscription renewal or expiry. Consumer tests enforce verification identity, receipt continuity, SKU and state boundaries and prevent the Skip selector from bypassing community verification.

## Fire App Tester

The root agent drove the debug Expo consumer on a physical KFRASWI Fire tablet. Checkout used Amazon App Tester simulation, US marketplace, local development IAPKit and Amazon RVS Sandbox. One yearly test subscription was already owned; the counts below are relative to that as-found purchase.

| Case | Observed result |
| --- | --- |
| Cold startup and catalog | `amazon_example` connected; `10 Bulbs` loaded at `$0.99`; storefront `US` |
| Consumable acceptance | All six strict checks passed: connection, catalog, provider identity, callback/restore receipt continuity, valid Sandbox verification and completion |
| Identity and completion | Callback and ownership read carried `store: unknown` and `storeId: amazon_example`; verification preserved that identity; finishing removed the consumable, returning ownership from two to one |
| Checkout cancellation | Canonical `purchase-error`; no entitlement granted; ownership remained one |
| Deferred checkout | Request Purchase returned `deferred-payment` without granting an entitlement; App Tester approval, restore, Sandbox verification and completion recovered the purchase |
| Guide UI | Current 0.0.2 local installation instructions, compact Public core modal and wide inline explanation displayed correctly |
| Teardown | Leaving the purchase screens ended the connection without a provider error |

Cancellation and deferred recovery ran against `59cd022bc6bf5ff361142f2ad0c927d09596400b` with the changed id. The final rebuilt 0.0.2 consumer used `2b4931327e1323db300fbb4832e5268f4bb0de2f` and repeated the complete six-check consumable flow, the follow-up ownership read and guide checks. Both device inputs produced the byte-identical provider AAR above. The final pin adds only the resolver regression correction; automated checks were repeated against that pin. Deferred recovery after remount is recorded separately and is not counted as a second six-check pass.

Development server logs show **three unique verification requests** across these runs: two in the first run and one in the final run. Each returned HTTP 200, backend store `amazon`, `isValid: true`, `READY_TO_CONSUME` and `sandbox: true`. The two log records emitted per request are not counted as two calls. No backend database read is claimed for this run.

[Current screenshots](docs/screenshots/) show `amazon_example`. Temporary density 160 exercised the wide guide; physical density 213 was restored. App Tester subscription flags remained off, API response settings remained Default, and the existing catalog was retained. No task-created adb reverse rule remained, local Kit and Metro processes stopped, and the example stopped with its updated debug build installed.

## Limits

App Tester checkout and RVS Sandbox are simulation evidence. Live App Testing renewal, cancellation before expiry, expiry and server access revocation remain unverified. Older registry tests cover Expo and do not prove installation or device behavior in every framework. No current package publication, registry promotion, production data change or deployment is claimed.

The provider adapts OpenIAP's existing Amazon implementation. The separate artifact validates the extension boundary; it is not a second independently designed implementation. Reproduce the automated checks with [README.md](README.md). Private logs, receipts, account identifiers, keys and generated build outputs stay outside Git.
