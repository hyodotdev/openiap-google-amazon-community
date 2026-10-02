import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readOpenIapInput(checkout, expectedRevision) {
  const git = (args) =>
    execFileSync("git", args, { cwd: checkout, encoding: "utf8" }).trim();
  if (git(["status", "--porcelain", "--untracked-files=normal"])) {
    throw new Error(
      "OpenIAP build input must be a clean checkout; preserve local edits before preparing artifacts.",
    );
  }
  const versions = JSON.parse(
    readFileSync(join(checkout, "openiap-versions.json"), "utf8"),
  );
  if (!/^1\.\d+\.\d+(?:-rc\.\d+)?$/.test(versions.clientProtocol)) {
    throw new Error("This example targets Client Protocol 1.x, including RCs.");
  }
  const revision = git(["rev-parse", "HEAD"]);
  if (revision !== expectedRevision) {
    throw new Error("Check out the exact revision in openiap-revision.txt.");
  }
  return {
    revision,
    coreVersion: versions.google,
    clientProtocolVersion: versions.clientProtocol,
  };
}

export function readExpoSdkVersion(pkg) {
  const version = pkg.peerDependencies["expo-iap"];
  if (!/^\d+\.\d+\.\d+(?:-rc\.\d+)?$/.test(version)) {
    throw new Error(
      "Pin an exact published expo-iap version before preparation.",
    );
  }
  return version;
}

export function requireSdkInput(versions, input) {
  if (
    versions.google !== input.coreVersion ||
    versions.clientProtocol !== input.clientProtocolVersion
  ) {
    throw new Error(
      "Published expo-iap and the pinned core use different contract inputs.",
    );
  }
}

// Read only the literal fields in Gradle's generated publication POM.
export function readPublishedInput(pom, report) {
  const field = (xml, name) => {
    const escaped = name.replaceAll(".", "\\.");
    const matches = [
      ...xml.matchAll(new RegExp(`<${escaped}>([\\s\\S]*?)</${escaped}>`, "g")),
    ];
    if (matches.length !== 1)
      throw new Error(
        `Missing or ambiguous publication field: ${name}. Run prepare-openiap.mjs.`,
      );
    return matches[0][1].trim();
  };
  const properties = field(pom, "properties");
  const revision = field(properties, "openiap.revision");
  if (!/^[0-9a-f]{40}$/.test(revision))
    throw new Error("Invalid OpenIAP input revision in publication.");
  const clientProtocolVersion = field(
    properties,
    "openiap.clientProtocolVersion",
  );
  const conformanceVersion = field(properties, "openiap.conformanceVersion");
  const core = [...pom.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g)]
    .map((match) => match[1])
    .filter(
      (dependency) =>
        field(dependency, "groupId") === "io.github.hyochan.openiap" &&
        field(dependency, "artifactId") === "openiap-core",
    );
  if (core.length !== 1)
    throw new Error(
      "Publication must depend on exactly one public OpenIAP core.",
    );
  if (
    clientProtocolVersion !== report.clientProtocolVersion ||
    conformanceVersion !== report.suiteVersion
  )
    throw new Error(
      "Publication and conformance report use different contract inputs.",
    );
  return {
    revision,
    coreVersion: field(core[0], "version"),
    clientProtocolVersion,
    conformanceVersion,
  };
}

export function requireTestedInput(publication, tested, digests) {
  for (const [name, value] of Object.entries({ ...publication, ...digests })) {
    if (tested[name] !== value) {
      throw new Error(
        `Publication differs from the successful test input: ${name}. Run prepare-openiap.mjs.`,
      );
    }
  }
}
