# Community example verification — October 10, 2026

The educational Amazon provider passed public stable dependency checks and Fire App Tester purchase, cancellation and deferred recovery through Expo. For production FireOS apps, use the [official Amazon integration](https://openiap.dev/docs/setup/store/amazon).

## Reproduce the inputs

- Google source input: [`ca483aabc80f9de2c1e8760274c4d21b687d0814`](https://github.com/hyodotdev/openiap/tree/ca483aabc80f9de2c1e8760274c4d21b687d0814), pinned in [openiap-revision.txt](openiap-revision.txt).
- Public artifacts: core **4.0.0**, conformance **4.0.0**, Expo IAP **6.0.0**, Client Protocol **1.0.0** and Amazon SDK **3.0.9**. Core and conformance come from Maven Central; Expo comes from npm. No local core, suite or source Expo substitutes for those artifacts.
- Provider **0.0.2** selects `amazon_example`. Its [source verification](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/38021487947) and [GitHub Packages publication plus fresh registry-consumer verification](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/38022180114) passed at immutable `community-provider-v0.0.2`, source `63779d02b597c6c58d0f0fc9fd77d46ab4c8dcbb`. The package is public on GitHub Packages under the `example` tag.
- Provider release AAR SHA-256: `4cc217298b6efeac39265bf62e03bc3786f42a3cd151fc6919392d76e6809ec0`.
- Resolved core AAR SHA-256: `78f57e317d6909d703e8b35e496e93dffc84b90be943a93a3120f956eaf4a71e`. Conformance AAR SHA-256: `530f32baafa32d8e68939a56d1ccece7985cd8366be48a88d1519ecefb04c13c`. Both match the public artifacts.

Install the public package with the [consumer instructions](README.md#install-this-example-package). Provider authors can reproduce the pinned build with [preparation](README.md#prepare-the-pinned-sdk-inputs). The earlier local packaged consumer APK (`241667b261bee416cc7a4ce93c830329ec48511d3443c99268ed948c59b523ec`) remains historical evidence at the immutable release source; current registry-backed rows are recorded below.

## Automated checks

| Check                                   | Observed result                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Provider tests                          | 68 total: 66 passed, two optional-capability skips, no failures                                               |
| Android provider profile                | All 17 mandatory behaviors passed; two undeclared optional capabilities are not applicable                    |
| Packaging, input and Expo plugin checks | All 10 tests passed                                                                                           |
| Provider release lint                   | Passed                                                                                                        |
| Public Expo consumer                    | Current example: typecheck and all 191 tests in 20 suites passed locally                             |
| Android consumer                        | Release source and preceding example follow-up passed non-debuggable ARM64 and minified R8 builds; factory retained |
| Runtime dependencies                    | Public core, this provider and Amazon SDK; no official store-provider artifact, Play Billing or Horizon SDK   |

The [conformance report](reports/amazon_example.json) comes from the public suite with controlled vendor transport through the real provider and mappers. It does not certify subscription renewal, expiry or server validation.

## Published registry acceptance

A separate fresh Actions runner installed `@hyodotdev/openiap-provider-amazon-example@0.0.2` from GitHub Packages with exact `expo-iap@6.0.0`. All 179 consumer tests, typecheck, native prebuild and the minified R8 Android release passed. The resolved provider AAR matches the digest above; the consumer used the installed package’s Maven directory, with no provider source or separately built local artifacts. The `registry-proof` artifact of run [38022180114](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/38022180114) records package visibility, source, dependency versions, tarball integrity, AAR digest and retained factory.

Tarball SHA-512 integrity: `sha512-SR6deYATOxJkdiMvOGbYc+7J8LhCKGBkjfi8OuEAcoxuWme/pR++rs5c+uSCuu0A72YCUEpnc47f17TgD0S2eA==`. The version tag and published bytes are immutable; later example or documentation amendments do not republish them.

This proves fresh registry packaging and the Expo build. The Fire rows below are separate device evidence; they are not certified by this CI run. Applications must explicitly route `amazon_example` receipts to Amazon verification while retaining `store: unknown` and the provider id. A stock example with only the native dependency changed does not supply that application adapter.

## Fresh registry-backed Fire checks

Muse Spark 1.3 Contributor ran these sandbox checks on the physical Fire using the published 0.0.2 tarball and the matching AAR digest. Each purchase pass requires a matching local development IAPKit response (`isValid: true`) and actual completion. No official provider artifact or native source include supplied the community provider.

| Consumer | Observed result |
| --- | --- |
| React Native 17.0.0 | Fresh consumable purchase → RVS Sandbox `ready-to-consume` → completion passed. Retained receipts were verified and completed using the final helper. A later build adopted the final OpenIAP hook, both screens and helper verbatim; another fresh purchase passed. |
| Expo 6.0.0 | Fresh consumable purchase → RVS Sandbox `ready-to-consume` → completion passed with the release-source community example and registry dependency. |
| Expo deferred approval | Request remained pending without verification or completion; approval followed by cold restart recovered, verified and completed it once. |
| Flutter 11.0.0 | Purchase, strict Sandbox verification and completion passed with the current example helper. Recovery reused the receipt after rebuilding with the corrected Sandbox flag; unchanged-configuration LOCAL outage recovery remains pending. |
| KMP provider variant | A current community 0.0.2 app build is prepared. The earlier APK used the official Amazon provider, so it does not establish community-package device acceptance. |
| Godot | A current community 0.0.2 app build is prepared. The earlier APK used the official Amazon provider, so it does not establish community-package device acceptance. |
| .NET MAUI 3.0.0 | Consumable purchase, strict Sandbox verification and completion passed with the current PurchaseFlow helper. Recovery changed Server to Local; this APK had older subscription and alternative-billing screens. The current example build passed artifact checks; its device acceptance and unchanged-LOCAL outage recovery remain pending. |

The earlier corrected example passed [184 tests and its Android CI build](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/38026804487). The current example passed 191 local tests, typecheck and strict lint. It recognizes the exact catalog term in a restored base-SKU receipt, verifies before completing, and avoids acknowledging a verified Android non-consumable twice. Its source includes [the exact-receipt correction](https://github.com/hyodotdev/openiap/commit/e0e544ee76ca7ce630663dba85e3165bb894b6aa); published 0.0.2 bytes are unchanged. Its final source device checks remain separate from the release-source Expo rows above. React Native's recorded screen/helper inputs match OpenIAP `43e00fd8`. Flutter APK `3d3387ac` embeds all six current example inputs from `d925c090` and passed strict Sandbox acceptance after correcting its build configuration. MAUI APK `4f2177cd` uses the current consumable PurchaseFlow and a disclosed local-only endpoint guard; its other screen differences limit that row's scope. Neither recovery proves an unchanged-LOCAL outage retry. The earlier KMP and Godot APKs do not prove community-provider integration. This matrix does not certify every store or subscription lifecycle.

After a Fire reboot, `debug.amazon.sandboxmode` was empty; restoring `debug` recovered App Tester mode. A stale USB reverse rule also prevented local verification until recreated. Neither failure established an OS defect. An earlier completed lease restored the original app, reset density to 213, removed its owned reverses/processes and preserved the Tester ledger. Current acceptance testing is still running; its final cleanup remains pending.

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

App Tester and RVS Sandbox are simulation evidence. Live App Testing renewal, cancellation before period end, time-based expiry and automatic server access revocation remain unverified. The immediate App Tester cancellation and invalid-receipt checks do not replace those cases. No production data change or app deployment is claimed; each fresh registry device row must pass separately before an all-six-framework claim.

The [previous RC report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/63c8541d265d95592178a32b51ce6f127c18073b/VERIFICATION.md) and [earlier local-core report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/aa5736843bf0b8b2e9ea1d13153a25ff7db2a2ce/VERIFICATION.md) remain historical evidence. Their source commits are preserved by the public archive branches `codex/archive-main-2026-10-09` and `codex/archive-main-2026-10-08`, respectively.

This provider adapts OpenIAP's existing Amazon implementation. Its separate artifact tests the extension boundary; it is not a second independently designed store implementation.
