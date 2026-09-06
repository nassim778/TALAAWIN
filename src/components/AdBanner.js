import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, adsAvailable } from '../ads/mobileAdsCompat';
import { getAdUnitId } from '../ads/admob';

export default function AdBanner() {
  if (!adsAvailable || !BannerAd) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={getAdUnitId('banner')}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
});

