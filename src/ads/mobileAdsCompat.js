let mobileAdsModule = null;

try {
  mobileAdsModule = require('react-native-google-mobile-ads');
} catch (error) {
  mobileAdsModule = null;
}

const createNoopAd = () => ({
  addAdEventListener: () => () => {},
  load: () => {},
  show: () => {},
});

export const adsAvailable = !!mobileAdsModule;

export const mobileAds =
  mobileAdsModule?.default ??
  (() => ({
    setRequestConfiguration: () => Promise.resolve(),
    initialize: () => Promise.resolve(),
  }));

export const MaxAdContentRating = mobileAdsModule?.MaxAdContentRating ?? {
  T: 'T',
};

export const TestIds = mobileAdsModule?.TestIds ?? {
  BANNER: '',
  INTERSTITIAL: '',
  REWARDED: '',
};

export const BannerAd = mobileAdsModule?.BannerAd ?? null;
export const BannerAdSize = mobileAdsModule?.BannerAdSize ?? {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};

export const AdEventType = mobileAdsModule?.AdEventType ?? {
  LOADED: 'loaded',
  CLOSED: 'closed',
  ERROR: 'error',
};

export const RewardedAdEventType = mobileAdsModule?.RewardedAdEventType ?? {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
};

export const InterstitialAd = mobileAdsModule?.InterstitialAd ?? {
  createForAdRequest: createNoopAd,
};

export const RewardedAd = mobileAdsModule?.RewardedAd ?? {
  createForAdRequest: createNoopAd,
};
