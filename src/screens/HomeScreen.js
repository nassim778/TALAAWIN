import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Linking,
  BackHandler,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { COLORS, GAME } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import AdBanner from '../components/AdBanner';
import { getAdUnitId } from '../ads/admob';

const { width, height } = Dimensions.get('window');
const WELCOME_VIDEO = require('../../reaction/ma7be.mp4');

export default function HomeScreen({ navigation, route }) {
  const { t, isRTL, lang, toggleLanguage } = useLanguage();
  const playerName = route.params?.playerName || '';

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const rewardedRef = useRef(null);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const pendingTunisiaStartRef = useRef(false);
  const rewardEarnedRef = useRef(false);

  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const welcomeScale = useRef(new Animated.Value(0)).current;
  const welcomePulse = useRef(new Animated.Value(1)).current;

  const pinDrop = useRef(new Animated.Value(-80)).current;
  const pinBounce = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(50)).current;
  const chipsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitModalVisible(true);
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded'), {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedRef.current = rewarded;

    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setRewardedLoaded(true);
    });

    const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardEarnedRef.current = true;
      if (pendingTunisiaStartRef.current) {
        pendingTunisiaStartRef.current = false;
        navigation.navigate('Game', { mode: 'tunisia' });
      }
    });

    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardedLoaded(false);
      rewarded.load();

      if (pendingTunisiaStartRef.current && !rewardEarnedRef.current) {
        pendingTunisiaStartRef.current = false;
        Alert.alert(t('rewardRequiredTitle'), t('rewardRequiredMessage'));
      }

      rewardEarnedRef.current = false;
    });

    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setRewardedLoaded(false);
      pendingTunisiaStartRef.current = false;
      rewardEarnedRef.current = false;
      Alert.alert(t('adUnavailableTitle'), t('adUnavailableMessage'));
    });

    rewarded.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
  }, [navigation, t]);

  useEffect(() => {
    // Hero entrance
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pin drop with dramatic bounce
    Animated.sequence([
      Animated.delay(250),
      Animated.spring(pinDrop, {
        toValue: 0,
        friction: 3.5,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pinBounce, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pinBounce, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Background glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cards staggered entrance
    Animated.parallel([
      Animated.timing(cardsFade, {
        toValue: 1,
        duration: 700,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.spring(cardsSlide, {
        toValue: 0,
        friction: 7,
        tension: 35,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Info chips delayed
    Animated.timing(chipsFade, {
      toValue: 1,
      duration: 600,
      delay: 900,
      useNativeDriver: true,
    }).start();

    // Welcome video
    Animated.spring(welcomeScale, {
      toValue: 1,
      friction: 5,
      tension: 50,
      delay: 200,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(welcomePulse, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(welcomePulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const startGame = (mode) => {
    navigation.navigate('Game', { mode });
  };

  const startTunisiaWithReward = () => {
    const rewarded = rewardedRef.current;
    if (!rewarded || !rewardedLoaded) {
      Alert.alert(t('adLoadingTitle'), t('adLoadingMessage'));
      rewarded?.load();
      return;
    }

    pendingTunisiaStartRef.current = true;
    rewardEarnedRef.current = false;
    rewarded.show();
  };

  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};
  const rtlText = isRTL ? { textAlign: 'right', writingDirection: 'rtl' } : {};
  const rtlSelf = isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080C18" />

      {/* Background gradient layers */}
      <LinearGradient
        colors={['#080C18', '#0D1530', '#101A38', '#0D1530', '#080C18']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative ambient orbs */}
      <Animated.View style={[styles.orbRed, { opacity: glowPulse }]} />
      <Animated.View style={[styles.orbGold, { opacity: glowPulse }]} />
      <Animated.View style={[styles.orbBlue, { opacity: glowPulse }]} />

      {/* Top bar: settings + language */}
      <View style={[styles.topBar, isRTL && { right: undefined, left: 14 }]}>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings', { playerName })}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleLanguage}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LinearGradient
            colors={['rgba(255,186,8,0.2)', 'rgba(255,186,8,0.08)']}
            style={styles.langToggleInner}
          >
            <Text style={styles.langToggleText}>
              {lang === 'en' ? 'عربي' : 'EN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Welcome video bubble */}
      {welcomeVisible && (
        <Animated.View
          style={[
            styles.welcomeBubble,
            isRTL ? { left: undefined, right: 16 } : {},
            { transform: [{ scale: welcomeScale }] },
          ]}
        >
          <Animated.View
            style={[styles.welcomeRing, { transform: [{ scale: welcomePulse }] }]}
          />
          <View style={styles.welcomeVideoClip}>
            <Video
              source={WELCOME_VIDEO}
              style={styles.welcomeVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping={false}
              isMuted={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  Animated.timing(welcomeScale, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => setWelcomeVisible(false));
                }
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.welcomeCloseBtn}
            onPress={() => {
              Animated.timing(welcomeScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setWelcomeVisible(false));
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.welcomeCloseCircle}>
              <Ionicons name="close" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pin icon with glow */}
        <Animated.View
          style={[
            styles.pinContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: pinDrop }, { scale: pinBounce }],
            },
          ]}
        >
          <View style={styles.pinGlow} />
          <View style={styles.pinOuter}>
            <LinearGradient
              colors={['#E63946', '#FF6B78', '#E63946']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pinHead}
            >
              <Text style={styles.pinQuestion}>?</Text>
            </LinearGradient>
            <View style={styles.pinTail} />
          </View>
          <View style={styles.pinShadow} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.title, isRTL && styles.titleArabic]}>
            {t('appTitle1')}
            <Text style={styles.titleAccent}>{t('appTitle2')}</Text>
          </Text>
          <LinearGradient
            colors={['transparent', '#E63946', '#FFBA08', '#E63946', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />
          <Text style={[styles.subtitle, rtlText]}>{t('subtitle')}</Text>
          {playerName ? (
            <View style={[styles.greetingBadge, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="person-circle-outline" size={16} color={COLORS.accent} />
              <Text style={styles.greetingText}>{playerName}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Mode label */}
        <Animated.View
          style={[
            styles.chooseModeBlock,
            { opacity: cardsFade, transform: [{ translateY: cardsSlide }] },
          ]}
        >
          <Text style={[styles.chooseModeLabel, rtlText]}>
            {t('chooseChallenge')}
          </Text>
        </Animated.View>

        {/* Mode Cards */}
        <Animated.View
          style={[
            styles.cardsRow,
            { opacity: cardsFade, transform: [{ translateY: cardsSlide }] },
            rtlRow,
          ]}
        >
          {/* Worldwide Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cardWrapper}
            onPress={() => startGame('world')}
          >
            <LinearGradient
              colors={['#0D5F8A', '#118AB2', '#4CC9F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeCard}
            >
              <View style={styles.cardPattern}>
                <View style={[styles.patternDot, { top: 12, right: 15, opacity: 0.08 }]} />
                <View style={[styles.patternDot, { top: 45, right: 40, opacity: 0.05, width: 40, height: 40, borderRadius: 20 }]} />
                <View style={[styles.patternDot, { bottom: 20, right: 10, opacity: 0.06, width: 24, height: 24, borderRadius: 12 }]} />
              </View>
              <View style={[styles.cardIconWrap, rtlSelf]}>
                <Ionicons name="earth" size={34} color="#fff" />
              </View>
              <Text style={[styles.cardTitle, rtlText]}>{t('worldwide')}</Text>
              <Text style={[styles.cardDesc, rtlText]}>{t('worldDesc')}</Text>
              <View style={[styles.cardPlayPill, rtlRow, rtlSelf]}>
                <Text style={styles.cardPlayText}>{t('play')}</Text>
                <Ionicons
                  name={isRTL ? 'arrow-back' : 'arrow-forward'}
                  size={14}
                  color="#fff"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tunisia Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cardWrapper}
            onPress={startTunisiaWithReward}
          >
            <LinearGradient
              colors={['#9B1B30', '#E63946', '#FF6B78']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeCard}
            >
              <View style={styles.cardPattern}>
                <View style={[styles.patternDot, { top: 12, right: 15, opacity: 0.08 }]} />
                <View style={[styles.patternDot, { top: 45, right: 40, opacity: 0.05, width: 40, height: 40, borderRadius: 20 }]} />
                <View style={[styles.patternDot, { bottom: 20, right: 10, opacity: 0.06, width: 24, height: 24, borderRadius: 12 }]} />
              </View>
              <View style={[styles.cardIconWrap, rtlSelf]}>
                <Text style={styles.flagEmoji}>🇹🇳</Text>
              </View>
              <View style={[styles.rewardBadge, isRTL && { alignSelf: 'flex-end' }]}>
                <Ionicons name="lock-closed" size={11} color="#FFE9B3" />
                <Text style={styles.rewardBadgeText}>{t('rewardLocked')}</Text>
              </View>
              <Text style={[styles.cardTitle, rtlText]}>{t('tunisia')}</Text>
              <Text style={[styles.cardDesc, rtlText]}>{t('tunisiaDesc')}</Text>
              <View style={[styles.rewardHintPill, rtlRow, rtlSelf]}>
                <Ionicons name={rewardedLoaded ? 'checkmark-circle' : 'time-outline'} size={13} color="#fff" />
                <Text style={styles.rewardHintText}>
                  {rewardedLoaded ? t('rewardReady') : t('rewardLoading')}
                </Text>
              </View>
              <View style={[styles.cardPlayPill, rtlRow, rtlSelf]}>
                <Text style={styles.cardPlayText}>{t('play')}</Text>
                <Ionicons
                  name={isRTL ? 'arrow-back' : 'arrow-forward'}
                  size={14}
                  color="#fff"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Maghreb & Egypt Card (full width) */}
        <Animated.View
          style={[
            styles.maghrebRow,
            { opacity: cardsFade, transform: [{ translateY: cardsSlide }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.maghrebCardWrapper}
            onPress={() => startGame('maghreb')}
          >
            <LinearGradient
              colors={['#1B6B3A', '#2E8B57', '#43A047']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.maghrebCard}
            >
              <View style={styles.cardPattern}>
                <View style={[styles.patternDot, { top: 10, right: 20, opacity: 0.06, width: 50, height: 50, borderRadius: 25 }]} />
                <View style={[styles.patternDot, { bottom: 10, left: 30, opacity: 0.04, width: 60, height: 60, borderRadius: 30 }]} />
              </View>
              <View style={[styles.maghrebContent, rtlRow]}>
                <View style={[styles.cardIconWrap, { marginBottom: 0 }]}>
                  <Text style={styles.flagEmoji}>🏜️</Text>
                </View>
                <View style={[styles.maghrebTextBlock, isRTL && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.cardTitle, rtlText]}>{t('maghreb')}</Text>
                  <Text style={[styles.cardDesc, rtlText, { marginBottom: 0 }]}>{t('maghrebDesc')}</Text>
                </View>
                <View style={[styles.cardPlayPill, rtlRow]}>
                  <Text style={styles.cardPlayText}>{t('play')}</Text>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={14}
                    color="#fff"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Multiplayer Button */}
        <Animated.View
          style={[
            styles.maghrebRow,
            { opacity: cardsFade, transform: [{ translateY: cardsSlide }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.maghrebCardWrapper}
            onPress={() => navigation.navigate('Lobby', { playerName })}
          >
            <LinearGradient
              colors={['#4A148C', '#7B1FA2', '#9C27B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.maghrebCard}
            >
              <View style={styles.cardPattern}>
                <View style={[styles.patternDot, { top: 10, right: 20, opacity: 0.06, width: 50, height: 50, borderRadius: 25 }]} />
                <View style={[styles.patternDot, { bottom: 10, left: 30, opacity: 0.04, width: 60, height: 60, borderRadius: 30 }]} />
              </View>
              <View style={[styles.maghrebContent, rtlRow]}>
                <View style={[styles.cardIconWrap, { marginBottom: 0 }]}>
                  <Ionicons name="people" size={30} color="#fff" />
                </View>
                <View style={[styles.maghrebTextBlock, isRTL && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.cardTitle, rtlText]}>{t('multiplayer')}</Text>
                  <Text style={[styles.cardDesc, rtlText, { marginBottom: 0 }]}>{t('multiplayerDesc')}</Text>
                </View>
                <View style={[styles.cardPlayPill, rtlRow]}>
                  <Text style={styles.cardPlayText}>{t('play')}</Text>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={14}
                    color="#fff"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Info row */}
        <Animated.View style={[styles.infoSection, { opacity: chipsFade }, rtlRow]}>
          <InfoChip icon="images-outline" text={t('streetImagery')} isRTL={isRTL} />
          <InfoChip
            icon="trophy-outline"
            text={`${GAME.TOTAL_ROUNDS} ${t('rounds')}`}
            isRTL={isRTL}
          />
          <InfoChip
            icon="star-outline"
            text={`${GAME.MAX_TOTAL_SCORE.toLocaleString()} ${t('pts')}`}
            isRTL={isRTL}
          />
        </Animated.View>

        {/* Attribution Footer */}
        <Animated.View style={[styles.footer, { opacity: chipsFade }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL('https://www.mapillary.com')}
            style={styles.mapillaryRow}
          >
            <Text style={styles.mapillaryLogo}>
              <Text style={styles.mapillaryDot}>●</Text> mapillary
            </Text>
          </TouchableOpacity>
          <Text style={styles.ccNotice}>{t('ccAttribution')}</Text>
        </Animated.View>
        <AdBanner />
      </ScrollView>

      <ConfirmModal
        visible={exitModalVisible}
        icon="log-out-outline"
        iconColor={COLORS.primary}
        title={t('exitAppTitle')}
        message={t('exitAppMessage')}
        cancelText={t('cancel')}
        confirmText={t('exitConfirm')}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          BackHandler.exitApp();
        }}
        isRTL={isRTL}
      />
    </View>
  );
}

function InfoChip({ icon, text, isRTL }) {
  return (
    <View style={[styles.infoChip, isRTL && { flexDirection: 'row-reverse' }]}>
      <Ionicons name={icon} size={13} color={COLORS.accent} />
      <Text style={styles.infoChipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C18' },
  scrollContent: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },

  // Decorative orbs
  orbRed: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(230, 57, 70, 0.07)',
  },
  orbGold: {
    position: 'absolute',
    top: height * 0.38,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 186, 8, 0.05)',
  },
  orbBlue: {
    position: 'absolute',
    bottom: 40,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(17, 138, 178, 0.06)',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 48,
    right: 14,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleInner: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,186,8,0.25)',
  },
  langToggleText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Pin
  pinContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  pinGlow: {
    position: 'absolute',
    top: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
  },
  pinOuter: { alignItems: 'center' },
  pinHead: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    elevation: 12,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  pinQuestion: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: -2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E63946',
    marginTop: -3,
  },
  pinShadow: {
    width: 30,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(230,57,70,0.2)',
    marginTop: 5,
  },

  // Title
  titleBlock: { alignItems: 'center', marginBottom: 30 },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleArabic: { fontSize: 42, letterSpacing: 2 },
  titleAccent: { color: COLORS.accent },
  divider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 14.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,186,8,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  greetingText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Challenge section
  chooseModeBlock: { width: '100%', marginBottom: 16 },
  chooseModeLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Cards
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 22,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  modeCard: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    minHeight: 205,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternDot: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  cardIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  flagEmoji: { fontSize: 28 },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
    marginBottom: 14,
  },
  cardPlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(8,12,24,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,233,179,0.45)',
  },
  rewardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFE9B3',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rewardHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rewardHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
  },
  cardPlayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },

  // Maghreb card
  maghrebRow: {
    width: '100%',
    marginBottom: 28,
  },
  maghrebCardWrapper: {
    borderRadius: 22,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  maghrebCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  maghrebContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  maghrebTextBlock: {
    flex: 1,
  },

  // Info chips
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,186,8,0.06)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,186,8,0.12)',
  },
  infoChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Footer
  footer: { alignItems: 'center', gap: 6, marginTop: 4 },
  mapillaryRow: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  mapillaryLogo: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
  mapillaryDot: { color: '#05CB63', fontSize: 12 },
  ccNotice: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    opacity: 0.4,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 20,
  },

  // Welcome video
  welcomeBubble: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 62 : 86,
    left: 16,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: COLORS.accent,
    opacity: 0.45,
  },
  welcomeVideoClip: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: COLORS.accent,
    backgroundColor: '#000',
  },
  welcomeVideo: { width: 70, height: 70 },
  welcomeCloseBtn: { position: 'absolute', top: -3, right: -3 },
  welcomeCloseCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
