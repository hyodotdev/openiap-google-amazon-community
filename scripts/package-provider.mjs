import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const report = JSON.parse(
  readFileSync(
    join(root, "provider/build/reports/openiap/amazon-example.json"),
    "utf8",
  ),
);
if (
  !report.conformant ||
  !report.scope.complete ||
  report.results.some((result) => result.outcome === "fail")
) {
  throw new Error(
    "Run the complete provider conformance tests before packaging.",
  );
}
const group = "dev/openiap/providers/openiap-provider-amazon-example";
const input = join(root, ".local/maven", group, pkg.version);
const output = join(root, "maven", group, pkg.version);
rmSync(join(root, "maven"), { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const name of readdirSync(input))
  copyFileSync(join(input, name), join(output, name));
const aar = `openiap-provider-amazon-example-${pkg.version}.aar`;
const properties = Object.fromEntries(
  readFileSync(join(root, "gradle.properties"), "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => line.split("=")),
);
writeFileSync(
  join(root, "provider-artifact.json"),
  JSON.stringify(
    {
      package: pkg.name,
      version: pkg.version,
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      openIapRevision: readFileSync(
        join(root, "openiap-revision.txt"),
        "utf8",
      ).trim(),
      coreVersion: properties.openIapCoreVersion,
      clientProtocolVersion: report.clientProtocolVersion,
      storeId: report.storeId,
      factory: "dev.openiap.provider.fireos.FireOsProviderFactory",
      aar: `maven/${group}/${pkg.version}/${aar}`,
      aarSha256: createHash("sha256")
        .update(readFileSync(join(output, aar)))
        .digest("hex"),
      requiredBehaviors: report.scope.requiredBehaviors.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${pkg.name}@${pkg.version} with its tested AAR. No core or official provider is bundled.`,
);
