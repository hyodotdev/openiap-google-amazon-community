# Community example verification — October 10, 2026

The educational Amazon provider passed public stable dependency checks and Fire App Tester purchase, cancellation and deferred recovery through Expo. For production FireOS apps, use the [official Amazon integration](https://openiap.dev/docs/setup/store/amazon).

## Reproduce the inputs

- Google source input: [`ca483aabc80f9de2c1e8760274c4d21b687d0814`](https://github.com/hyodotdev/openiap/tree/ca483aabc80f9de2c1e8760274c4d21b687d0814), pinned in [openiap-revision.txt](openiap-revision.txt).
- Public artifacts: core **4.0.0**, conformance **4.0.0**, Expo IAP **6.0.0**, Client Protocol **1.0.0** and Amazon SDK **3.0.9**. Core and conformance come from Maven Central; Expo comes from npm. No local core, suite or source Expo substitutes for those artifacts.
- Provider **0.0.2** selects `amazon_example`. Local packaged acceptance is recorded below; the guarded GitHub Packages publication and fresh registry-consumer checks must pass before registry acceptance is claimed.
- Provider release AAR SHA-256: `4cc217298b6efeac39265bf62e03bc3786f42a3cd151fc6919392d76e6809ec0`.
- Resolved core AAR SHA-256: `78f57e317d6909d703e8b35e496e93dffc84b90be943a93a3120f956eaf4a71e`. Conformance AAR SHA-256: `530f32baafa32d8e68939a56d1ccece7985cd8366be48a88d1519ecefb04c13c`. Both match the public artifacts.

Follow the [README](README.md#prepare-the-pinned-sdk-inputs) to repeat preparation. The final test-only consumer passed a fresh physical purchase, same-receipt restore, Sandbox verification, completion, vendor cancellation and cold ownership read after the viewer-safety cleanup. Its APK SHA-256 is `241667b261bee416cc7a4ce93c830329ec48511d3443c99268ed948c59b523ec`. The provider AAR remains byte-identical to the earlier deferred-recovery build; only bundled JavaScript changed. The final tarball differs from the package built into that APK only in README; its Expo plugin, AAR and dirty-source provenance are unchanged. CI verifies the committed source separately. Historical GitHub Packages publications retain the old provider id and do not prove installation of this source.

## Automated checks

| Check                                   | Observed result                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Provider tests                          | 68 total: 66 passed, two optional-capability skips, no failures                                                                                                          |
| Android provider profile                | All 17 mandatory behaviors passed; two undeclared optional capabilities are not applicable                                                                               |
| Packaging, input and Expo plugin checks | All 10 tests passed                                                                                                                                                      |
| Provider release lint                   | Passed                                                                                                                                                                   |
| Public Expo consumer                    | Typecheck and all 179 tests in 20 suites passed                                                                                                                          |
| Android consumer                        | Earlier snapshot: Debug and non-debuggable, obfuscated ARM64/ARMv7 R8 release builds passed; factory name retained. Final snapshot: test-only debuggable R8 build passed |
| Runtime dependencies                    | Public core, this provider and Amazon SDK; no official store-provider artifact, Play Billing or Horizon SDK                                                              |

The [conformance report](reports/amazon_example.json) comes from the public suite with controlled vendor transport through the real provider and mappers. It does not certify subscription renewal, expiry or server validation.

## Fire App Tester

The full **Amazon Community Example** ran on a physical Fire tablet with all seven menus, the existing catalog and US marketplace using the test-only build below. Checkout belonged to `com.amazon.sdktestclient`; local development IAPKit verified receipts through Amazon RVS Sandbox. An existing yearly test subscription remained owned.

Amazon App Tester requires a debuggable app. The non-debuggable R8 release build (shrunk and obfuscated) routed to production mode and returned `CERT_NOT_FOUND` before checkout. Device acceptance therefore used a **test-only debuggable build** with bundled JavaScript and local development HTTP. R8 code shrinking and resource shrinking ran, but AGP disabled obfuscation because the build was debuggable. Neither build ran R8 code optimization: the generated release template uses `proguard-android.txt`, which sets `-dontoptimize`. Those generated settings are outside Git and are not production app configuration. The non-debuggable release build was not used for App Tester acceptance.

| Case                          | Observed result                                                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold startup                  | Cold launch connected; an ownership read returned one                                                                                                                                                                                                                 |
| Catalog                       | `amazon_example` connected; `10 Bulbs` loaded at `$0.99`                                                                                                                                                                                                              |
| Normal purchase               | All six checks passed: connection, catalog, provider identity, receipt continuity, Sandbox verification and completion                                                                                                                                                |
| Identity                      | Callback and ownership read carried `store: unknown`, `storeId: amazon_example`; verification preserved that client identity. IAPKit routed to canonical Amazon validation                                                                                            |
| Restore and completion        | Restore before completion retained the original receipt; completion removed the consumable and ownership returned from two to one. A cold ownership read still returned one                                                                                           |
| Normal backend verification   | HTTP 200, `isValid: true`, `READY_TO_CONSUME`, `sandbox: true`; DEV purchases 322 → 323, Amazon 125 → 126, valid 318 → 319                                                                                                                                            |
| Cancellation                  | App Tester cancellation returned canonical `purchase-error`; no entitlement or completion and no additional backend purchase                                                                                                                                          |
| Deferred recovery             | `deferred-payment` granted no entitlement and DEV purchases remained 312 → 312. After approval of that request in App Tester, restore found it; Sandbox verification and completion removed it. Ownership returned from two to one, and App Tester showed `FULFILLED` |
| Deferred backend verification | HTTP 200 with the same valid Sandbox state; DEV purchases 312 → 313, Amazon 119 → 120, valid 308 → 309                                                                                                                                                                |
| Guide                         | Public core 4.0.0 and Client Protocol 1.0.0 shown; compact and wide layouts checked on the same tablet                                                                                                                                                                |

The normal and deferred verification requests each emit two log entries (info/debug) with one correlation id. Deferred recovery used the earlier APK (`e0af71ef…`); it was not replayed on the final JavaScript build. Deferred recovery uses the ownership read, so its callback identity and continuity flags are not claimed as a second six-check pass. Subscription count stayed two throughout these cases. Other matrix tests ran between the normal and deferred leases; their writes are excluded from each isolated delta.

The catalog, account and sandbox setting were preserved. Temporary density changes were reset to the original 213. Credentials, receipt identifiers, device logs and build outputs remain outside Git. [Screenshots](docs/screenshots/) show the stable guide and completed normal purchase.

## Limits

App Tester and RVS Sandbox are simulation evidence. Live App Testing subscription renewal, cancellation before expiry, expiry and server access revocation remain unverified. Local packaged build, install, connection and catalog also passed in React Native, Flutter, KMP, Godot and MAUI on October 10 using public core 4.0.0. Those five checks did not include public registry installation or a fresh purchase, so they do not certify those paths. No current provider publication, registry promotion, production data change or app deployment is claimed.

The [previous RC report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/63c8541d265d95592178a32b51ce6f127c18073b/VERIFICATION.md) and [earlier local-core report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/aa5736843bf0b8b2e9ea1d13153a25ff7db2a2ce/VERIFICATION.md) remain historical evidence. Their source commits are preserved by the public archive branches `codex/archive-main-2026-10-09` and `codex/archive-main-2026-10-08`, respectively.

This provider adapts OpenIAP's existing Amazon implementation. Its separate artifact tests the extension boundary; it is not a second independently designed store implementation.
