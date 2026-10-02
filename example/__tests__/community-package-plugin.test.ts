const withCommunity = require('@hyodotdev/openiap-provider-amazon-example');

describe('installed community provider plugin', () => {
  it.each([
    {plugin: 'expo-iap'},
    {plugin: ['expo-iap', {android: {store: 'play'}}]},
  ])(
    'rejects a separate Expo IAP entry before it can silently select Play',
    ({plugin}) => {
      expect(() =>
        withCommunity({name: 'Consumer', slug: 'consumer', plugins: [plugin]}),
      ).toThrow('Replace the expo-iap plugin entry');
    },
  );

  it('rejects Expo IAP already applied by another plugin', () => {
    expect(() =>
      withCommunity({
        name: 'Consumer',
        slug: 'consumer',
        _internal: {pluginHistory: {'expo-iap': {name: 'expo-iap'}}},
      }),
    ).toThrow('Replace the expo-iap plugin entry');
  });
});
