import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, SIZES, GAME } from '../constants/theme';
import { fetchRandomImage, takeFromPool, warmPool, resetUsedLocations } from '../utils/mapillary';
import {
  calculateDistance,
  calculateScore,
  formatDistance,
} from '../utils/scoring';
import { getMapHtml } from '../utils/mapHtml';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

const REACTIONS = [
  {
    mode: 'tunisia',
    test: (km) => km > 150,
    source: require('../../reaction/yabhim.mp4'),
    labelKey: 'reactionYabhim',
  },
];

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { width, height } = Dimensions.get('window');
const MAP_HTML = getMapHtml();

function getImageViewHtml(imageUrl, objectFit = 'cover') {
  if (!imageUrl) return '<html><body style="background:#0F1628"></body></html>';
  const safe = imageUrl.replace(/"/g, '&quot;');
  const bg = objectFit === 'cover' ? '#0F1628' : '#000';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=20,user-scalable=yes">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${bg};overflow:auto;touch-action:auto}
#si{width:100%;height:100%;object-fit:${objectFit};display:block;transition:opacity 0.15s}
.fade{opacity:0.3}
</style></head>
<body><img id="si" src="${safe}"/>
<script>
function preloadImages(urls){urls.forEach(function(u){var i=new Image();i.src=u;})}
function goTo(url){
  var el=document.getElementById('si');
  el.classList.add('fade');
  var img=new Image();
  img.onload=function(){el.src=url;el.classList.remove('fade');};
  img.onerror=function(){el.src=url;el.classList.remove('fade');};
  img.src=url;
}
</script>
</body></html>`;
}

export default function GameScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const mode = route.params?.mode || 'world';
  const modeEmoji = mode === 'tunisia' ? '🇹🇳' : mode === 'maghreb' ? '🏜️' : '🌍';
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};
  const rtlText = isRTL ? { textAlign: 'right', writingDirection: 'rtl' } : {};

  // Game state
  const [phase, setPhase] = useState('loading');
  const [mapVisible, setMapVisible] = useState(false);
  const [round, setRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [roundDetails, setRoundDetails] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [guessCoords, setGuessCoords] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [roundDistance, setRoundDistance] = useState(0);
  const [imageModal, setImageModal] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Reaction video
  const [reactionVideo, setReactionVideo] = useState(null);
  const reactionOpacity = useRef(new Animated.Value(0)).current;

  // Walking (street navigation)
  const [walkable, setWalkable] = useState([]);
  const [walkIndex, setWalkIndex] = useState(0);
  const imageWebViewRef = useRef(null);

  // Reset used locations and warm the image pool on mount
  const poolWarmed = useRef(false);
  if (!poolWarmed.current) {
    poolWarmed.current = true;
    resetUsedLocations();
    warmPool(mode);
  }

  // Animations
  const webViewRef = useRef(null);
  const resultSlide = useRef(new Animated.Value(400)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const scorePopScale = useRef(new Animated.Value(0)).current;
  const headerGlow = useRef(new Animated.Value(0)).current;
  const guessBtnPulse = useRef(new Animated.Value(1)).current;
  const [displayScore, setDisplayScore] = useState(0);

  const confirmExit = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  // Android back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (reactionVideo) {
        dismissReaction();
        return true;
      }
      if (imageModal) {
        setImageModal(false);
        return true;
      }
      if (mapVisible && phase === 'guessing') {
        hideMapView();
        return true;
      }
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [mapVisible, phase, imageModal, reactionVideo, confirmExit]);

  // GUESS button subtle pulse
  useEffect(() => {
    if (phase === 'guessing' && !mapVisible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(guessBtnPulse, {
            toValue: 1.03,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(guessBtnPulse, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase, mapVisible]);

  // Auto-hide zoom hint
  useEffect(() => {
    if (phase === 'guessing' && showZoomHint) {
      const t = setTimeout(() => setShowZoomHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, showZoomHint]);

  // Keep the pool warm whenever a round ends
  useEffect(() => {
    if (phase === 'result' || phase === 'guessing') {
      warmPool(mode);
    }
  }, [phase, mode]);

  const showMapView = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')
    );
    setMapVisible(true);
  }, []);

  const hideMapView = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')
    );
    setMapVisible(false);
  }, []);

  const initWalkable = useCallback((image) => {
    const steps = image.walkable || [image];
    setWalkable(steps);
    setWalkIndex(0);
    setCurrentImage(image);
  }, []);

  const walkForward = useCallback(() => {
    setWalkIndex((prev) => {
      const next = Math.min(prev + 1, walkable.length - 1);
      if (next !== prev && imageWebViewRef.current) {
        const url = walkable[next].imageUrl.replace(/'/g, "\\'");
        imageWebViewRef.current.injectJavaScript(`goTo('${url}');true;`);
      }
      return next;
    });
  }, [walkable]);

  const walkBack = useCallback(() => {
    setWalkIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next !== prev && imageWebViewRef.current) {
        const url = walkable[next].imageUrl.replace(/'/g, "\\'");
        imageWebViewRef.current.injectJavaScript(`goTo('${url}');true;`);
      }
      return next;
    });
  }, [walkable]);

  const loadImage = useCallback(async () => {
    setGuessCoords(null);
    setError(null);
    setImageLoading(true);
    setMapVisible(false);
    setShowZoomHint(true);
    resultSlide.setValue(400);
    resultOpacity.setValue(0);
    scorePopScale.setValue(0);

    // Try the pre-fetched pool first (instant)
    const pooled = takeFromPool(mode);
    if (pooled) {
      initWalkable(pooled);
      setPhase('guessing');
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'reset', mode }));
      }
      return;
    }

    // Fallback: live fetch
    setPhase('loading');
    try {
      const image = await fetchRandomImage(mode);
      initWalkable(image);
      setPhase('guessing');
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'reset', mode }));
      }
    } catch (err) {
      setError(t('errorLoad'));
    }
  }, [mode, initWalkable]);

  useEffect(() => {
    loadImage();
  }, []);

  const handleMapMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'guess') {
        setGuessCoords({ latitude: data.lat, longitude: data.lng });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleConfirmGuess = useCallback(() => {
    if (!guessCoords || !currentImage) return;

    const distance = calculateDistance(
      guessCoords.latitude,
      guessCoords.longitude,
      currentImage.coordinates.latitude,
      currentImage.coordinates.longitude
    );
    const score = calculateScore(distance, mode);

    setRoundDistance(distance);
    setRoundScore(score);
    setTotalScore((prev) => prev + score);
    setRoundDetails((prev) => [
      ...prev,
      {
        round,
        distance,
        score,
        guess: guessCoords,
        actual: currentImage.coordinates,
        locationName: currentImage.locationName,
        country: currentImage.country,
      },
    ]);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'showResult',
          guess: { lat: guessCoords.latitude, lng: guessCoords.longitude },
          actual: {
            lat: currentImage.coordinates.latitude,
            lng: currentImage.coordinates.longitude,
          },
        })
      );
    }

    setPhase('result');

    // Animated score count-up
    let step = 0;
    setDisplayScore(0);
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / 40, 3);
      setDisplayScore(Math.round(score * eased));
      if (step >= 40) clearInterval(timer);
    }, 30);

    Animated.parallel([
      Animated.spring(resultSlide, {
        toValue: 0,
        friction: 9,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scorePopScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(headerGlow, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(headerGlow, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();

    // Check reaction video rules
    const reaction = REACTIONS.find(
      (r) => r.mode === mode && r.test(distance)
    );
    if (reaction) {
      reactionOpacity.setValue(0);
      setReactionVideo(reaction);
      Animated.timing(reactionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [guessCoords, currentImage, round, mode]);

  const dismissReaction = useCallback(() => {
    Animated.timing(reactionOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setReactionVideo(null));
  }, []);

  const handleNextRound = useCallback(() => {
    if (round >= GAME.TOTAL_ROUNDS) {
      navigation.replace('FinalScore', { totalScore, roundDetails, mode });
    } else {
      setRound((prev) => prev + 1);
      loadImage();
    }
  }, [round, totalScore, roundDetails, navigation, loadImage, mode]);

  const scoreColor = headerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.warning, COLORS.accentLight],
  });

  // ════════════════════════════════════
  //  LOADING
  // ════════════════════════════════════
  if (phase === 'loading' && !error) {
    return (
      <View style={styles.centeredScreen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <View style={styles.loaderRing}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
        <Text style={[styles.loaderTitle, rtlText]}>
          {mode === 'tunisia'
            ? t('exploringTunisia')
            : mode === 'maghreb'
            ? t('exploringMaghreb')
            : t('exploringWorld')}
        </Text>
        <Text style={[styles.loaderSub, rtlText]}>
          {t('round')} {round} {t('of')} {GAME.TOTAL_ROUNDS}
        </Text>
      </View>
    );
  }

  // ════════════════════════════════════
  //  ERROR
  // ════════════════════════════════════
  if (error) {
    return (
      <View style={styles.centeredScreen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <Ionicons name="cloud-offline-outline" size={56} color={COLORS.error} />
        <Text style={[styles.errorText, rtlText]}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadImage}>
          <Text style={styles.retryBtnText}>{t('tryAgain')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeLinkBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.homeLinkText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ════════════════════════════════════
  //  MAIN GAME
  // ════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={[styles.header, rtlRow]}>
        <TouchableOpacity
          onPress={confirmExit}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.roundBadge}>
          <Text style={styles.roundEmoji}>{modeEmoji} </Text>
          <Text style={styles.roundText}>
            {round}/{GAME.TOTAL_ROUNDS}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          <Ionicons name="star" size={14} color={COLORS.warning} />
          <Animated.Text style={[styles.scoreText, { color: scoreColor }]}>
            {totalScore.toLocaleString()}
          </Animated.Text>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Full-screen zoomable image (pinch-to-zoom via WebView) */}
        {phase === 'guessing' && !mapVisible && (
          <View style={styles.imageFull}>
            {imageLoading && (
              <View style={styles.imgPlaceholder}>
                <ActivityIndicator size="small" color={COLORS.accent} />
              </View>
            )}
            <WebView
              ref={imageWebViewRef}
              source={{ html: getImageViewHtml(currentImage?.imageUrl, 'cover') }}
              style={styles.imageWebView}
              scrollEnabled
              bounces={false}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              onLoadEnd={() => {
                setImageLoading(false);
                if (walkable.length > 1 && imageWebViewRef.current) {
                  const urls = walkable.slice(1).map((w) => w.imageUrl);
                  imageWebViewRef.current.injectJavaScript(
                    `preloadImages(${JSON.stringify(urls)});true;`
                  );
                }
              }}
              allowsInlineMediaPlayback
              scalesPageToFit
            />
            {/* Floating controls overlay */}
            <View style={styles.imgOverlay} pointerEvents="box-none">
              {showZoomHint && (
                <View style={styles.zoomHintPill}>
                  <Ionicons
                    name="hand-left-outline"
                    size={11}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.zoomHintText}>{t('pinchToZoom')}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => setImageModal(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="expand-outline" size={19} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Walk navigation arrows */}
            {walkable.length > 1 && (
              <View style={styles.walkOverlay} pointerEvents="box-none">
                <View style={styles.walkRow}>
                  {walkIndex > 0 ? (
                    <TouchableOpacity
                      style={styles.walkBtn}
                      onPress={walkBack}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.walkBtnHidden} />
                  )}
                  <View style={styles.walkPill}>
                    <Ionicons name="footsteps-outline" size={12} color="#fff" />
                    <Text style={styles.walkPillText}>
                      {walkIndex + 1}/{walkable.length}
                    </Text>
                  </View>
                  {walkIndex < walkable.length - 1 ? (
                    <TouchableOpacity
                      style={styles.walkBtn}
                      onPress={walkForward}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.walkBtnHidden} />
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Compact image strip (map visible) */}
        {phase === 'guessing' && mapVisible && (
          <TouchableOpacity
            style={styles.imageStrip}
            activeOpacity={0.92}
            onPress={hideMapView}
          >
            <Image
              source={{ uri: (walkable[walkIndex] || currentImage)?.imageUrl }}
              style={styles.imageStripImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={styles.imageStripOverlay}
            >
              <View style={styles.imageStripRow}>
                <Ionicons name="image-outline" size={13} color="#fff" />
                <Text style={styles.imageStripLabel}>{t('viewImage')}</Text>
                <Ionicons
                  name="chevron-up-outline"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Map (always in DOM, height toggled) */}
        <View
          style={[
            styles.mapWrapper,
            mapVisible || phase === 'result'
              ? styles.mapShow
              : styles.mapHide,
          ]}
        >
          <WebView
            ref={webViewRef}
            source={{ html: MAP_HTML }}
            style={styles.map}
            onMessage={handleMapMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            originWhitelist={['*']}
            mixedContentMode="always"
            onError={() => {}}
            onLoadEnd={() => {
              if (webViewRef.current) {
                webViewRef.current.postMessage(
                  JSON.stringify({ type: 'reset', mode })
                );
              }
            }}
          />
        </View>
      </View>

      {/* ── Bottom Controls ── */}

      {/* GUESS button (image mode) */}
      {phase === 'guessing' && !mapVisible && (
        <View style={styles.guessSection}>
          <Animated.View style={{ transform: [{ scale: guessBtnPulse }] }}>
            <TouchableOpacity activeOpacity={0.85} onPress={showMapView}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.guessBtn}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.guessBtnText}>{t('guess')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Confirm bar (map mode) */}
      {phase === 'guessing' && mapVisible && (
        <View style={styles.bottomBar}>
          {guessCoords ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirmGuess}
            >
              <LinearGradient
                colors={[COLORS.success, '#04A77D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.hintBar}>
              <Ionicons
                name="hand-left-outline"
                size={15}
                color={COLORS.textMuted}
              />
              <Text style={styles.hintText}>
                {t('tapMapHint')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Result Card ── */}
      {phase === 'result' && (
        <Animated.View
          style={[
            styles.resultCard,
            {
              transform: [{ translateY: resultSlide }],
              opacity: resultOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.card, COLORS.surface]}
            style={styles.resultInner}
          >
            <View style={[styles.resultLocationRow, rtlRow]}>
              <Ionicons name="location" size={17} color={COLORS.success} />
              <Text style={[styles.resultLocationText, rtlText]}>
                {currentImage?.locationName}, {currentImage?.country}
              </Text>
            </View>

            <View style={[styles.resultStatsRow, rtlRow]}>
              <View style={styles.resultStat}>
                <Text style={styles.resultLabel}>{t('distance')}</Text>
                <Text style={styles.resultValue}>
                  {formatDistance(roundDistance, t)}
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.resultScoreBubble,
                  { transform: [{ scale: scorePopScale }] },
                ]}
              >
                <Text style={styles.scorePrefix}>+</Text>
                <Text style={styles.scoreNum}>
                  {displayScore.toLocaleString()}
                </Text>
                <Text style={styles.scoreSuffix}>{t('pts')}</Text>
              </Animated.View>

              <View style={styles.resultStat}>
                <Text style={styles.resultLabel}>{t('total')}</Text>
                <Text
                  style={[styles.resultValue, { color: COLORS.warning }]}
                >
                  {totalScore.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNextRound}
              style={{ marginTop: 16 }}
            >
              <LinearGradient
                colors={
                  round >= GAME.TOTAL_ROUNDS
                    ? [COLORS.accent, COLORS.accentDark]
                    : [COLORS.primary, COLORS.primaryDark]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.nextBtn, rtlRow]}
              >
                <Text style={styles.nextBtnText}>
                  {round >= GAME.TOTAL_ROUNDS ? t('seeResults') : t('nextRound')}
                </Text>
                <Ionicons
                  name={
                    round >= GAME.TOTAL_ROUNDS ? 'trophy' : (isRTL ? 'arrow-back' : 'arrow-forward')
                  }
                  size={17}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Fullscreen Pinch-Zoom Modal ── */}
      <Modal
        visible={imageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModal(false)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setImageModal(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.modalCloseCircle}>
              <Ionicons name="close" size={22} color="#fff" />
            </View>
          </TouchableOpacity>

          {currentImage && (
            <WebView
              source={{
                html: getImageViewHtml(
                  (walkable[walkIndex] || currentImage).imageUrl,
                  'contain'
                ),
              }}
              style={styles.modalWebView}
              scrollEnabled
              bounces={false}
              scalesPageToFit
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              originWhitelist={['*']}
              mixedContentMode="always"
            />
          )}

          <View style={styles.modalHintRow}>
            <Ionicons
              name="hand-left-outline"
              size={13}
              color="rgba(255,255,255,0.4)"
            />
            <Text style={styles.modalHintText}>{t('pinchToZoom')}</Text>
          </View>
        </View>
      </Modal>

      {/* ── Reaction Bubble ── */}
      {reactionVideo && (
        <Animated.View
          style={[styles.reactionBubbleWrap, { opacity: reactionOpacity }]}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={dismissReaction}>
            <View style={styles.reactionBubble}>
              <Video
                source={reactionVideo.source}
                style={styles.reactionBubbleVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping={false}
                volume={1.0}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    setTimeout(dismissReaction, 400);
                  }
                }}
              />
              <View style={styles.reactionBubbleLabelWrap}>
                <Text style={[styles.reactionBubbleLabel, rtlText]}>
                  {t(reactionVideo.labelKey)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ConfirmModal
        visible={exitModalVisible}
        icon="flag-outline"
        iconColor={COLORS.accent}
        title={t('exitChallengeTitle')}
        message={t('exitChallengeMessage')}
        cancelText={t('cancel')}
        confirmText={t('exitConfirm')}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          navigation.goBack();
        }}
        isRTL={isRTL}
      />
    </View>
  );
}

// ════════════════════════════════════
//  STYLES
// ════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C18' },

  // Centered screens (loading/error)
  centeredScreen: {
    flex: 1,
    backgroundColor: '#080C18',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  loaderRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'rgba(255,186,8,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loaderTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: 0.5 },
  loaderSub: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 23,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  homeLinkBtn: { marginTop: 14, padding: 8 },
  homeLinkText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 38 : 52,
    paddingBottom: 10,
    backgroundColor: 'rgba(8,12,24,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: {
    padding: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230,57,70,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.2)',
  },
  roundEmoji: { fontSize: 14 },
  roundText: { color: COLORS.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,186,8,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,186,8,0.15)',
  },
  scoreText: { fontSize: 16, fontWeight: '800' },

  // Content
  content: { flex: 1 },

  // Full image (WebView pinch-to-zoom)
  imageFull: {
    flex: 1,
    backgroundColor: '#0F1628',
    overflow: 'hidden',
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1628',
    zIndex: 2,
  },
  imageWebView: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  imgOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  zoomHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 5,
  },
  zoomHintText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  expandBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Walk navigation
  walkOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  walkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  walkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  walkBtnHidden: {
    width: 40,
    height: 40,
  },
  walkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  walkPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Image strip
  imageStrip: {
    height: height * 0.22,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'hidden',
  },
  imageStripImg: { width: '100%', height: '100%' },
  imageStripOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  imageStripRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  imageStripLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },

  // Map
  mapWrapper: { overflow: 'hidden' },
  mapShow: { flex: 1 },
  mapHide: { height: 0 },
  map: { flex: 1, backgroundColor: COLORS.background },

  // GUESS button
  guessSection: {
    backgroundColor: 'rgba(8,12,24,0.95)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  guessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: SIZES.borderRadiusLg,
    gap: 10,
    elevation: 10,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  guessBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 5,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: 'rgba(8,12,24,0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.borderRadius,
    gap: 8,
    elevation: 6,
    shadowColor: '#06D6A0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2.5,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  hintText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },

  // Result card
  resultCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  resultInner: {
    paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
    paddingHorizontal: 24,
  },
  resultLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  resultLocationText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  resultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultStat: { alignItems: 'center', flex: 1 },
  resultLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  resultValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  resultScoreBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,186,8,0.1)',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,186,8,0.25)',
  },
  scorePrefix: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  scoreNum: { fontSize: 30, fontWeight: '900', color: COLORS.accent },
  scoreSuffix: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.borderRadius,
    gap: 8,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },

  // Modal
  modalBg: { flex: 1, backgroundColor: '#000' },
  modalCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 38 : 52,
    right: 16,
    zIndex: 10,
  },
  modalCloseCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWebView: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: Platform.OS === 'android' ? 78 : 92,
    marginBottom: 50,
  },
  modalHintRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalHintText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  // Reaction bubble
  reactionBubbleWrap: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 95 : 110,
    right: 14,
    zIndex: 100,
  },
  reactionBubble: {
    width: 120,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,186,8,0.3)',
  },
  reactionBubbleVideo: {
    width: '100%',
    height: '100%',
  },
  reactionBubbleLabelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  reactionBubbleLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
