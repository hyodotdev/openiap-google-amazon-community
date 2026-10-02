import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  rmSync,
  mkdtempSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import {
  readOpenIapInput,
  readExpoSdkVersion,
  requireSdkInput,
} from "./build-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const openiap = resolve(root, "../openiap");
const local = join(root, ".local");
const maven = join(local, "maven");
const readPin = () =>
  readFileSync(join(root, "openiap-revision.txt"), "utf8").trim();
const input = readOpenIapInput(openiap, readPin());
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const sdkVersion = readExpoSdkVersion(pkg);
const suite = /SUITE_VERSION = '([^']+)'/.exec(
  readFileSync(
    join(openiap, "packages/conformance/src/spec/suite-version.mjs"),
    "utf8",
  ),
)?.[1];
if (!suite) throw new Error("Missing conformance version.");
function run(command, args, cwd, capture = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.error || result.status !== 0)
    throw result.error ?? new Error(`${command} failed: ${result.status}`);
  return result.stdout;
}
const sdkInput = mkdtempSync(join(tmpdir(), "openiap-public-expo-"));
try {
  const [{ filename }] = JSON.parse(
    run(
      "npm",
      [
        "pack",
        `expo-iap@${sdkVersion}`,
        "--registry=https://registry.npmjs.org",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        sdkInput,
      ],
      root,
      true,
    ),
  );
  const versions = JSON.parse(
    run(
      "tar",
      ["-xOf", join(sdkInput, filename), "package/openiap-versions.json"],
      root,
      true,
    ),
  );
  requireSdkInput(versions, input);
} finally {
  rmSync(sdkInput, { recursive: true, force: true });
}
rmSync(local, { recursive: true, force: true });
mkdirSync(local, { recursive: true });
if (input.coreVersion.includes("-")) {
  run(
    "./gradlew",
    [":openiap-conformance:publishToMavenLocal", `-Dmaven.repo.local=${maven}`],
    join(openiap, "packages/google"),
  );
}
run(
  "./gradlew",
  [
    "clean",
    "--refresh-dependencies",
    ":provider:testDebugUnitTest",
    ":provider:lintRelease",
    ":provider:publishReleasePublicationToExperimentRepository",
    `-PopenIapRepository=${maven}`,
    `-PproviderRepository=${maven}`,
    `-PopenIapCoreVersion=${input.coreVersion}`,
    `-PclientProtocolVersion=${input.clientProtocolVersion}`,
    `-PconformanceVersion=${suite}`,
    `-PopenIapRevision=${input.revision}`,
  ],
  root,
);
const consumerManifest = join(root, "example/package.json");
const consumer = JSON.parse(readFileSync(consumerManifest, "utf8"));
consumer.dependencies["expo-iap"] = sdkVersion;
if (
  JSON.stringify(readOpenIapInput(openiap, readPin())) !== JSON.stringify(input)
) {
  throw new Error(
    "OpenIAP checkout changed during preparation. Prepare again from a clean input.",
  );
}
run("node", ["scripts/package-provider.mjs"], root);
const [{ filename: providerFilename }] = JSON.parse(
  run(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", local],
    root,
    true,
  ),
);
const providerHash = createHash("sha256")
  .update(readFileSync(join(local, providerFilename)))
  .digest("hex")
  .slice(0, 12);
const providerTarball = `community-provider-${providerHash}.tgz`;
renameSync(join(local, providerFilename), join(local, providerTarball));
consumer.dependencies["@hyodotdev/openiap-provider-amazon-example"] =
  `file:../.local/${providerTarball}`;
writeFileSync(consumerManifest, JSON.stringify(consumer, null, 2) + "\n");
run("npm", ["run", "test:package"], root);
console.log(
  `Prepared the tested community package for public core ${input.coreVersion} and expo-iap ${sdkVersion}. No registry publication was performed.`,
);
