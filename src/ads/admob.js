import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

const PROD_UNITS = {
  banner: Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    android: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    android: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  }),
  rewarded: Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    android: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  }),
};

const TEST_UNITS = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};

export function getAdUnitId(type) {
  const table = __DEV__ ? TEST_UNITS : PROD_UNITS;
  return table[type];
}

