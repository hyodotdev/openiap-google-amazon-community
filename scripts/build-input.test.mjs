import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readOpenIapInput,
  readPublishedInput,
  requireTestedInput,
  readExpoSdkVersion,
  requireSdkInput,
} from "./build-input.mjs";

test("compatible clean checkouts record their actual revision and core version", (t) => {
  const checkout = mkdtempSync(join(tmpdir(), "community-input-"));
  t.after(() => rmSync(checkout, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: checkout,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const writeVersions = (core, protocol = "1.0.0") =>
    writeFileSync(
      join(checkout, "openiap-versions.json"),
      JSON.stringify({ google: core, clientProtocol: protocol }),
    );
  const commit = () => {
    git("add", "openiap-versions.json");
    git(
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "-m",
      "test: record input",
    );
    return git("rev-parse", "HEAD");
  };
  git("init");
  writeVersions("3.6.2");
  const pinned = commit();
  assert.equal(readOpenIapInput(checkout, pinned).revision, pinned);
  writeVersions("4.0.0");
  assert.throws(() => readOpenIapInput(checkout, pinned), /clean checkout/);
  const actual = commit();
  assert.notEqual(actual, pinned);
  assert.deepEqual(readOpenIapInput(checkout, actual), {
    revision: actual,
    coreVersion: "4.0.0",
    clientProtocolVersion: "1.0.0",
  });
  assert.throws(() => readOpenIapInput(checkout, pinned), /exact revision/);
  writeVersions("4.0.0-rc.1", "1.0.0-rc.1");
  const rc = commit();
  assert.deepEqual(readOpenIapInput(checkout, rc), {
    revision: rc,
    coreVersion: "4.0.0-rc.1",
    clientProtocolVersion: "1.0.0-rc.1",
  });
  writeFileSync(join(checkout, "untracked.kt"), "unrecorded input");
  assert.throws(() => readOpenIapInput(checkout, rc), /clean checkout/);
  rmSync(join(checkout, "untracked.kt"));
  for (const protocol of ["1.0.1", "1.0.1-rc.2"]) {
    writeVersions("4.0.0", protocol);
    const patch = commit();
    assert.equal(
      readOpenIapInput(checkout, patch).clientProtocolVersion,
      protocol,
    );
  }
  writeVersions("4.0.0", "2.0.0");
  const incompatible = commit();
  assert.throws(
    () => readOpenIapInput(checkout, incompatible),
    /Client Protocol 1.x/,
  );
});

const revision = "9b7b64754da064eb220f84c4e0313e28e1109d60";
const report = { clientProtocolVersion: "1.0.0", suiteVersion: "4.0.0" };
const pom = `<project><properties>
  <openiap.revision>${revision}</openiap.revision>
  <openiap.clientProtocolVersion>1.0.0</openiap.clientProtocolVersion>
  <openiap.conformanceVersion>4.0.0</openiap.conformanceVersion>
</properties><dependencies><dependency>
  <groupId>io.github.hyochan.openiap</groupId><artifactId>openiap-core</artifactId><version>4.0.0</version>
</dependency><dependency>
  <groupId>com.amazon.device</groupId><artifactId>amazon-appstore-sdk</artifactId><version>3.0.9</version>
</dependency></dependencies></project>`;

test("publication provenance uses the resolved core dependency", () => {
  assert.deepEqual(readPublishedInput(pom, report), {
    revision,
    coreVersion: "4.0.0",
    clientProtocolVersion: "1.0.0",
    conformanceVersion: "4.0.0",
  });
});

test("packaging rejects a previous passing report for another core, revision or binary", () => {
  const publication = readPublishedInput(pom, report);
  const digests = { aarSha256: "a".repeat(64), reportSha256: "b".repeat(64) };
  const tested = { ...publication, ...digests };
  assert.doesNotThrow(() => requireTestedInput(publication, tested, digests));
  for (const [name, value] of Object.entries({
    revision: "c".repeat(40),
    coreVersion: "3.6.2",
    aarSha256: "d".repeat(64),
    reportSha256: "e".repeat(64),
  })) {
    assert.throws(
      () =>
        requireTestedInput(publication, { ...tested, [name]: value }, digests),
      new RegExp(`successful test input: ${name}`),
    );
  }
});

test("packaging rejects missing, ambiguous or incompatible publication provenance", () => {
  assert.throws(
    () =>
      readPublishedInput(
        pom.replace(`<openiap.revision>${revision}</openiap.revision>`, ""),
        report,
      ),
    /openiap.revision/,
  );
  assert.throws(
    () => readPublishedInput(pom.replace(revision, "unrecorded"), report),
    /Invalid OpenIAP input revision/,
  );
  assert.throws(
    () =>
      readPublishedInput(
        pom.replace(
          "</properties>",
          `<openiap.revision>${revision}</openiap.revision></properties>`,
        ),
        report,
      ),
    /ambiguous/,
  );
  assert.throws(
    () =>
      readPublishedInput(
        pom.replace(
          "<artifactId>openiap-core</artifactId>",
          "<artifactId>official-provider</artifactId>",
        ),
        report,
      ),
    /exactly one public OpenIAP core/,
  );
  assert.throws(
    () =>
      readPublishedInput(pom, { ...report, clientProtocolVersion: "2.0.0" }),
    /different contract inputs/,
  );
  assert.throws(
    () => readPublishedInput(pom, { ...report, suiteVersion: "4.1.0" }),
    /different contract inputs/,
  );
});

test("published SDK inputs must match the pinned stable or RC contract", () => {
  assert.equal(
    readExpoSdkVersion({ peerDependencies: { "expo-iap": "6.0.0" } }),
    "6.0.0",
  );
  assert.doesNotThrow(() =>
    requireSdkInput(
      { google: "4.0.0", clientProtocol: "1.0.0" },
      { coreVersion: "4.0.0", clientProtocolVersion: "1.0.0" },
    ),
  );
  const pkg = { peerDependencies: { "expo-iap": "6.0.0-rc.1" } };
  assert.equal(readExpoSdkVersion(pkg), "6.0.0-rc.1");
  assert.throws(
    () =>
      readExpoSdkVersion({ peerDependencies: { "expo-iap": ">=5.8.2 <6" } }),
    /exact published/,
  );
  const input = {
    coreVersion: "4.0.0-rc.1",
    clientProtocolVersion: "1.0.0-rc.1",
  };
  const versions = {
    google: input.coreVersion,
    clientProtocol: input.clientProtocolVersion,
  };
  assert.doesNotThrow(() => requireSdkInput(versions, input));
  for (const changed of [{ google: "4.0.0" }, { clientProtocol: "1.0.0" }]) {
    assert.throws(
      () => requireSdkInput({ ...versions, ...changed }, input),
      /different contract inputs/,
    );
  }
});
