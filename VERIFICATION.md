# Community example verification — October 8, 2026

This educational Amazon provider consumes the published OpenIAP RC through the public Expo SDK. For production FireOS apps, follow the [official Amazon setup](https://openiap.dev/docs/setup/store/amazon).

## Reproduce the tested inputs

- Google RC input: [`2b3e7840c2ed447bd4e8d8fcfac13fb24bc6c74c`](https://github.com/hyodotdev/openiap/tree/google-4.0.0-rc.1), pinned in [openiap-revision.txt](openiap-revision.txt). PR #504 is merged into `next`.
- Public registry inputs: core **4.0.0-rc.1**, Expo IAP **6.0.0-rc.0**, Client Protocol **0.2.0-rc.1**, Amazon SDK **3.0.9**. The RC lane does not publish conformance; only suite **4.0.0** is built locally from that exact Google tag.
- Provider **0.0.2 remains unpublished**. The consumer installs its prepared local tarball and uses `amazon_example`. No local core or source Expo substitutes for a registry artifact.
- Provider release AAR SHA-256: `f34f0a7a898cb8ee33d4b2573272a50b76edd94c0b95e714d258898853946b9c`. The staged and installed artifacts agree.
- The consumer's resolved core AAR is byte-identical to Maven Central: SHA-256 `149f6d41e800cba7edfa97dd0c2a242971cfe07be102c10485c3bca529bfb273`.

Follow [README.md](README.md#prepare-the-pinned-sdk-inputs) to prepare these inputs and repeat the checks. Historical registry versions 0.0.1, 0.1.1 and 0.1.2 retain `amazon-example`; their results do not prove installation of the current source.

## Automated checks

| Check | Observed result |
| --- | --- |
| Provider debug tests | 67 total: 65 passed, 2 optional-capability skips, no failures or errors |
| Android provider profile | All 16 required behaviors passed; two undeclared optional capabilities are not applicable |
| Packaging and input checks | All 8 tests passed, including exact RC versions, clean input revision and stale artifact rejection |
| Provider release lint | Passed |
| Expo consumer | Typecheck and all 178 tests in 20 suites passed |
| Android consumer | Debug and optimized ARM64/ARMv7 R8 release builds passed; factory name retained |
| Runtime dependencies | Public core, this provider and Amazon SDK; no official provider, Play Billing or Horizon SDK |

The [conformance JSON](reports/amazon_example.json) is copied from this run's suite output. Controlled vendor transport exercises the real provider and mappers. It does not certify real subscription renewal, expiry or server validation.

## Fire App Tester on the final RC consumer

The root agent installed the final rebuilt debug APK on a physical KFRASWI Fire tablet. Checkout used App Tester simulation, the existing catalog, US marketplace, local development IAPKit and Amazon RVS Sandbox. An existing yearly test subscription remained owned.

| Case | Observed result |
| --- | --- |
| Cold startup | Amazon listener registered before the first Activity resume; no missing-UI error |
| Catalog | `amazon_example` connected, `10 Bulbs` loaded at `$0.99`, storefront `US` |
| Consumable acceptance | All six checks passed: connection, catalog, provider identity, receipt continuity, Sandbox verification and completion |
| Identity | Callback and ownership read carried `store: unknown`, `storeId: amazon_example`; verification preserved that identity |
| Restore and completion | Restore preserved the original receipt. Finishing removed the consumable; a follow-up read returned ownership from two to one |
| Backend evidence | Two unique verification requests (normal checkout and approved deferred checkout) returned HTTP 200, `isValid: true`, `READY_TO_CONSUME`, `sandbox: true`. DEV purchases increased 300 → 302, Amazon purchases 113 → 115 and valid purchases 296 → 298 |
| Cancellation | Canonical `purchase-error`, no entitlement granted; ownership remained one |
| Deferred recovery | `deferred-payment` granted no entitlement. After App Tester approval, restore found the purchase; Sandbox verification and completion returned ownership to one. This is separate from the six-check callback flow |
| Guide | The install guide showed public core 4.0.0-rc.1 and Client Protocol 0.2.0-rc.1; compact and wide integration explanations were checked separately |

Each request emits two server log records with the same correlation id; the records are counted as two requests total. The existing catalog and sandbox setting were retained, density 213 was restored and only the task-created Metro reverse rule was removed. Credentials, receipt identifiers, device logs and build outputs remain outside Git. [Screenshots](docs/screenshots/) show the current guide and completed acceptance flow.

## Remaining limits

Checkout cancellation and deferred recovery were repeated on the public RC above. Earlier October 7 runs used a locally built core and remain historical evidence. The [archived report](https://github.com/hyodotdev/openiap-google-amazon-community/blob/aa5736843bf0b8b2e9ea1d13153a25ff7db2a2ce/VERIFICATION.md) records those inputs; its source commit is preserved on the archive branch and in the maintainer's backup bundle.

App Tester and RVS Sandbox are simulation evidence. Live App Testing subscription renewal, cancellation before expiry, expiry and server access revocation remain unverified. Current installation and device evidence covers Expo; other framework integrations with this external package remain unverified. No current provider publication, registry promotion, production data change or app deployment is claimed.

This provider adapts OpenIAP's existing Amazon implementation. The separate artifact tests the extension boundary; it is not a second independently designed store implementation.
