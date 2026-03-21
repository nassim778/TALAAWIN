import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, GAME } from '../constants/theme';
import { formatDistance, getScoreRating } from '../utils/scoring';
import { useLanguage } from '../i18n/LanguageContext';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../ads/admob';
import AdBanner from '../components/AdBanner';

const { width } = Dimensions.get('window');

function getScoreColor(ratio) {
  if (ratio >= 0.8) return ['#06D6A0', '#04A77D'];
  if (ratio >= 0.6) return ['#FFBA08', '#CC8A00'];
  if (ratio >= 0.4) return ['#FF9F1C', '#CC7700'];
  if (ratio >= 0.2) return ['#E63946', '#B8202E'];
  return ['#EF476F', '#C23058'];
}

export default function FinalScoreScreen({ route, navigation }) {
  const { t, isRTL } = useLanguage();
  const { totalScore, roundDetails, mode } = route.params;
  const rating = getScoreRating(totalScore, t);
  const modeLabel = mode === 'tunisia' ? t('modeTunisia') : mode === 'maghreb' ? t('modeMaghreb') : t('modeWorldwide');
  const scoreRatio = totalScore / GAME.MAX_TOTAL_SCORE;
  const [scoreColors] = useState(getScoreColor(scoreRatio));

  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};
  const rtlText = isRTL ? { textAlign: 'right', writingDirection: 'rtl' } : {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.2)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(40)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const interstitialRef = useRef(null);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const playAgainAfterAdRef = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scoreScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(starsAnim, {
      toValue: 1,
      duration: 800,
      delay: 700,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(listFade, {
        toValue: 1,
        duration: 600,
        delay: 1100,
        useNativeDriver: true,
      }),
      Animated.spring(listSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 1100,
        useNativeDriver: true,
      }),
    ]).start();

    const steps = 70;
    const interval = 22;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplayScore(Math.round(totalScore * eased));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialRef.current = interstitial;

    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load();
      if (playAgainAfterAdRef.current) {
        playAgainAfterAdRef.current = false;
        navigation.replace('Game', { mode });
      }
    });

    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      setInterstitialLoaded(false);
      if (playAgainAfterAdRef.current) {
        playAgainAfterAdRef.current = false;
        navigation.replace('Game', { mode });
      }
    });

    interstitial.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [navigation, mode]);

  const handlePlayAgain = useCallback(() => {
    const interstitial = interstitialRef.current;
    if (interstitial && interstitialLoaded) {
      playAgainAfterAdRef.current = true;
      interstitial.show();
      return;
    }
    navigation.replace('Game', { mode });
  }, [interstitialLoaded, navigation, mode]);

  const scorePercent = Math.round(scoreRatio * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080C18" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[`${scoreColors[0]}15`, `${scoreColors[0]}08`, 'transparent']}
            style={styles.heroGradient}
          >
            {/* Stars */}
            <Animated.View style={[styles.starsRow, { opacity: starsAnim }]}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    transform: [{ scale: starsAnim }],
                    marginHorizontal: 4,
                  }}
                >
                  <Ionicons
                    name={i <= rating.stars ? 'star' : 'star-outline'}
                    size={34}
                    color={i <= rating.stars ? COLORS.accent : COLORS.textMuted}
                  />
                </Animated.View>
              ))}
            </Animated.View>

            {/* Rating label */}
            <Animated.Text
              style={[styles.ratingLabel, { opacity: starsAnim }, rtlText]}
            >
              {rating.label}
            </Animated.Text>

            {/* Score circle */}
            <Animated.View
              style={[
                styles.scoreCircle,
                {
                  transform: [{ scale: scoreScale }],
                  borderColor: scoreColors[0],
                  shadowColor: scoreColors[0],
                },
              ]}
            >
              <Text style={styles.scoreValue}>
                {displayScore.toLocaleString()}
              </Text>
              <Text style={styles.scoreMax}>
                / {GAME.MAX_TOTAL_SCORE.toLocaleString()}
              </Text>
            </Animated.View>

            <View style={styles.metaRow}>
              <View style={styles.percentBadge}>
                <Text style={[styles.percentText, { color: scoreColors[0] }]}>
                  {scorePercent}%
                </Text>
                <Text style={styles.percentLabel}>{t('accuracy')}</Text>
              </View>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>{modeLabel}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Round breakdown */}
        <Animated.View
          style={[
            styles.breakdownSection,
            { opacity: listFade, transform: [{ translateY: listSlide }] },
          ]}
        >
          <Text style={[styles.sectionTitle, rtlText]}>
            {t('roundBreakdown')}
          </Text>

          {roundDetails.map((detail, index) => {
            const barRatio = detail.score / GAME.MAX_SCORE_PER_ROUND;
            const barColor =
              barRatio >= 0.8
                ? COLORS.success
                : barRatio >= 0.5
                ? COLORS.accent
                : barRatio >= 0.2
                ? COLORS.warning
                : COLORS.primary;

            return (
              <View key={index} style={styles.roundCard}>
                <View style={[styles.roundCardHeader, rtlRow]}>
                  <LinearGradient
                    colors={[barColor, `${barColor}88`]}
                    style={[
                      styles.roundNumBadge,
                      isRTL
                        ? { marginLeft: 14, marginRight: 0 }
                        : { marginRight: 14 },
                    ]}
                  >
                    <Text style={styles.roundNumText}>{detail.round}</Text>
                  </LinearGradient>
                  <View style={styles.roundCardInfo}>
                    <Text style={[styles.roundCardLocation, rtlText]}>
                      {detail.locationName}, {detail.country}
                    </Text>
                    <Text style={[styles.roundCardDistance, rtlText]}>
                      {formatDistance(detail.distance, t)} {t('away')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.roundCardScore,
                      isRTL
                        ? { alignItems: 'flex-start' }
                        : { alignItems: 'flex-end' },
                    ]}
                  >
                    <Text style={[styles.roundCardScoreValue, { color: barColor }]}>
                      +{detail.score.toLocaleString()}
                    </Text>
                    <Text style={styles.roundCardScoreLabel}>{t('pts')}</Text>
                  </View>
                </View>

                <View style={styles.scoreBarBg}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: `${barRatio * 100}%`,
                        backgroundColor: barColor,
                        alignSelf: isRTL ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsSection,
            { opacity: listFade, transform: [{ translateY: listSlide }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePlayAgain}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.playAgainBtn, rtlRow]}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.playAgainText}>{t('playAgain')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeBtn, rtlRow]}
            onPress={() => navigation.popToTop()}
          >
            <Ionicons name="home-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.homeBtnText}>{t('backToHome')}</Text>
          </TouchableOpacity>
          <AdBanner />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C18',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  heroSection: {
    marginBottom: 8,
  },
  heroGradient: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 30,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 26,
    letterSpacing: 0.5,
  },
  scoreCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(15,22,40,0.9)',
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  scoreMax: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '900',
  },
  percentLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  modeBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modeBadgeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  breakdownSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roundCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  roundCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roundNumText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  roundCardInfo: {
    flex: 1,
  },
  roundCardLocation: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  roundCardDistance: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  roundCardScore: {
    alignItems: 'flex-end',
  },
  roundCardScoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  roundCardScoreLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  scoreBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  buttonsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: SIZES.borderRadius,
    gap: 10,
    elevation: 8,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playAgainText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2.5,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  homeBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
