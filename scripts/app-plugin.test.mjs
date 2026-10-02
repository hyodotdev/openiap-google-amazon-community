import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(path.join(root, "app.plugin.js"), "utf8");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

function loadPlugin(clientProtocol) {
  const module = { exports: {} };
  runInNewContext(source, {
    module,
    __dirname: root,
    require(name) {
      if (name === "node:path") return path;
      if (name === "./package.json") return pkg;
      if (name === "expo-iap/openiap-versions.json") return { clientProtocol };
      if (name === "expo/config-plugins") {
        return { withPlugins: (config, plugins) => ({ config, plugins }) };
      }
      throw new Error(`Unexpected plugin dependency: ${name}`);
    },
  });
  return module.exports;
}

test("Client Protocol 1 configures the external provider and preserves app options", () => {
  const config = { name: "Consumer", plugins: ["other-plugin"] };
  const { plugins } = loadPlugin("1.0.0")(config, {
    android: { amazon: { appstoreKey: "./app-key.pem" } },
  });
  const [sdk, options] = plugins[0];
  assert.equal(sdk, "expo-iap");
  assert.equal(options.enableLocalDev, false);
  assert.equal(options.android.store, "amazon_example");
  assert.equal(
    options.android.provider,
    `dev.openiap.providers:openiap-provider-amazon-example:${pkg.version}`,
  );
  assert.equal(options.android.amazon.appstoreKey, "./app-key.pem");
  assert.deepEqual(Array.from(plugins[1][1].android.extraMavenRepos), [
    path.join(root, "maven"),
  ]);
});

test("an incompatible protocol major is rejected before configuring the provider", () => {
  for (const version of ["0.2.0-rc.1", "2.0.0"]) {
    assert.throws(() => loadPlugin(version)({}), /Client Protocol 1.x/);
  }
});
