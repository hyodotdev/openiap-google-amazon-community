import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const artifact = JSON.parse(
  readFileSync(join(root, "provider-artifact.json"), "utf8"),
);

test("packed community package contains the verified binary and no private app inputs", () => {
  const [{ files }] = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  const paths = files.map((file) => file.path);
  assert.equal(pkg.publishConfig.registry, "https://npm.pkg.github.com");
  assert.ok(paths.includes(artifact.aar));
  assert.ok(paths.includes("app.plugin.js"));
  assert.ok(paths.includes("provider-artifact.json"));
  assert.ok(
    !paths.some((path) =>
      /(^|\/)(example|node_modules|\.local|\.env|\.git)(\/|$)|\.(keystore|jks|apk)$/.test(
        path,
      ),
    ),
  );
  assert.ok(paths.filter((path) => path.endsWith(".aar")).length === 1);
  assert.equal(
    createHash("sha256")
      .update(readFileSync(join(root, artifact.aar)))
      .digest("hex"),
    artifact.aarSha256,
  );
  assert.equal(artifact.version, pkg.version);
  assert.equal(artifact.storeId, "amazon-example");
  assert.equal(artifact.requiredBehaviors, 16);
});

test("published native metadata depends on the public core and Amazon SDK", () => {
  const dir = dirname(join(root, artifact.aar));
  const pom = readFileSync(
    join(
      dir,
      readdirSync(dir).find((name) => name.endsWith(".pom")),
    ),
    "utf8",
  );
  assert.match(pom, /<artifactId>openiap-core<\/artifactId>/);
  assert.match(pom, /<artifactId>amazon-appstore-sdk<\/artifactId>/);
  assert.doesNotMatch(pom, /openiap-google-|billingclient|horizon/);
});
