const path = require("node:path");
const { withPlugins } = require("expo/config-plugins");
const { version } = require("./package.json");

module.exports = function withAmazonProvider(config, options = {}) {
  const explicitIap = config.plugins?.some(
    (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === "expo-iap",
  );
  if (explicitIap || config._internal?.pluginHistory?.["expo-iap"]) {
    throw new Error(
      "Replace the expo-iap plugin entry with @hyodotdev/openiap-provider-amazon-example. Expo applies expo-iap only once; keeping both can select the wrong store.",
    );
  }
  const versions = require("expo-iap/openiap-versions.json");
  if (!/^1\./.test(versions.clientProtocol)) {
    throw new Error(
      "The Amazon community provider requires an Expo IAP build with Client Protocol 1.x support. See this package README for the pinned verification inputs.",
    );
  }
  return withPlugins(config, [
    [
      "expo-iap",
      {
        ...options,
        enableLocalDev: false,
        modules: {
          ...options.modules,
          horizon: false,
          amazon: {
            ...options.modules?.amazon,
            fireOS: false,
            vegaOS: false,
          },
        },
        android: {
          ...options.android,
          store: "amazon_example",
          provider: `dev.openiap.providers:openiap-provider-amazon-example:${version}`,
        },
      },
    ],
    [
      "expo-build-properties",
      { android: { extraMavenRepos: [path.join(__dirname, "maven")] } },
    ],
  ]);
};
