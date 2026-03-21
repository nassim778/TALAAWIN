import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ActivityIndicator, StatusBar, Platform, BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue, update, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { COLORS, GAME } from '../constants/theme';
import { calculateDistance, calculateScore, formatDistance } from '../utils/scoring';
import { getMapHtml } from '../utils/mapHtml';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

const { width, height } = Dimensions.get('window');
const MAP_HTML = getMapHtml();

function getImageViewHtml(imageUrl) {
  if (!imageUrl) return '<html><body style="background:#0F1628"></body></html>';
  const safe = imageUrl.replace(/"/g, '&quot;');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=20,user-scalable=yes">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#0F1628;overflow:auto;touch-action:auto}
#si{width:100%;height:100%;object-fit:cover;display:block}</style></head>
<body><img id="si" src="${safe}"/></body></html>`;
}

export default function MultiplayerGameScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const { roomCode, playerName } = route.params;

  const [room, setRoom] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [guessCoords, setGuessCoords] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myDistance, setMyDistance] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [mapVisible, setMapVisible] = useState(false);
  const [walkIndex, setWalkIndex] = useState(0);
  const [walkable, setWalkable] = useState([]);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const webViewRef = useRef(null);
  const imageWebViewRef = useRef(null);
  const resultSlide = useRef(new Animated.Value(400)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const unsub = useRef(null);
  const localRound = useRef(-1);
  const roomRef = ref(rtdb, `rooms/${roomCode}`);

  useEffect(() => {
    unsub.current = onValue(roomRef, (snap) => {
      if (!snap.exists()) { navigation.replace('Home', { playerName }); return; }
      const data = snap.val();
      setRoom(data);

      if (data.status === 'finished') {
        navigation.replace('MultiplayerResults', { roomCode, playerName, room: data });
        return;
      }

      if (data.status === 'playing' && data.currentRound !== localRound.current) {
        localRound.current = data.currentRound;
        startRound(data, data.currentRound);
      }

      if (data.status === 'result') {
        showRoundResult(data);
      }
    });
    return () => unsub.current?.();
  }, [roomCode, navigation, playerName]);

  const confirmExit = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => handler.remove();
  }, [confirmExit]);

  const startRound = useCallback((data, roundIdx) => {
    const rd = data.rounds?.[roundIdx];
    if (!rd) return;
    setGuessCoords(null);
    setMapVisible(false);
    setMyScore(0);
    setMyDistance(0);
    setWalkIndex(0);
    resultSlide.setValue(400);
    resultOpacity.setValue(0);

    const steps = rd.walkable || [{ id: 'main', imageUrl: rd.imageUrl, lat: rd.lat, lng: rd.lng }];
    setWalkable(steps);
    setPhase('guessing');

    setTimeout(() => {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'reset', mode: data.mode }));
    }, 300);
  }, []);

  const getActivePlayers = useCallback((data) => {
    const raw = data?.activePlayers ?? data?.playerList ?? [];
    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'object') {
      // RTDB can return array-like data as objects in some edge cases.
      list = Object.values(raw);
    }
    return [...new Set(list.filter((name) => typeof name === 'string' && name.trim()))];
  }, []);

  const showRoundResult = useCallback((data) => {
    if (phase === 'result') return;
    const rd = data.rounds?.[data.currentRound];
    if (!rd) return;
    const players = getActivePlayers(data);
    const roundKey = String(data.currentRound);
    const allPlayersGuessed = players.length > 0 && players.every(
      (name) => data.guesses?.[name]?.[roundKey],
    );
    // Wait until every active player's guess is present on this client.
    // This keeps result zoom identical for all room members.
    if (!allPlayersGuessed) return;

    const myGuess = data.guesses?.[playerName]?.[String(data.currentRound)];
    if (!myGuess) return;

    setMyScore(myGuess.score);
    setMyDistance(myGuess.distance);

    let myTotal = 0;
    for (let i = 0; i <= data.currentRound; i++) {
      myTotal += data.guesses?.[playerName]?.[String(i)]?.score || 0;
    }
    setTotalScore(myTotal);

    const allGuesses = [];
    const PLAYER_COLORS = ['#E63946', '#FFBA08', '#118AB2', '#06D6A0', '#9B5DE5'];
    players.forEach((name, idx) => {
      const g = data.guesses?.[name]?.[String(data.currentRound)];
      if (g) allGuesses.push({
        name,
        lat: g.lat,
        lng: g.lng,
        color: PLAYER_COLORS[idx % 5],
        distance: g.distance,
        t: typeof g.t === 'number' ? g.t : Number.MAX_SAFE_INTEGER,
        order: idx,
      });
    });
    allGuesses.sort((a, b) => {
      if (a.t !== b.t) return a.t - b.t;
      return a.order - b.order;
    });

    setMapVisible(true);
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'showMultiResult',
      actual: { lat: rd.lat, lng: rd.lng },
      guesses: allGuesses,
    }));

    setPhase('result');
    Animated.parallel([
      Animated.spring(resultSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [phase, playerName, getActivePlayers]);

  const handleConfirm = async () => {
    if (!guessCoords || !room) return;
    const rd = room.rounds?.[room.currentRound];
    if (!rd) return;
    const distance = calculateDistance(
      guessCoords.lat, guessCoords.lng, rd.lat, rd.lng,
    );
    const score = calculateScore(distance, room.mode);

    await update(roomRef, {
      [`guesses/${playerName}/${room.currentRound}`]: {
        lat: guessCoords.lat, lng: guessCoords.lng, score, distance, t: Date.now(),
      },
    });
    setPhase('waiting');

    const updatedSnap = await new Promise((resolve) => {
      const checkListener = (snap) => {
        const d = snap.val();
        if (!d) return;
        const players = getActivePlayers(d);
        const allGuessed = players.length > 0 && players.every(
          (n) => d.guesses?.[n]?.[String(d.currentRound)],
        );
        if (allGuessed) {
          off(roomRef, 'value', checkListener);
          resolve(d);
        }
      };
      onValue(roomRef, checkListener);
    });

    if (playerName === updatedSnap.host) {
      await update(roomRef, { status: 'result' });
    }
  };

  const handleNext = async () => {
    if (!room || playerName !== room.host) return;
    const nextRound = room.currentRound + 1;
    if (nextRound >= GAME.TOTAL_ROUNDS) {
      await update(roomRef, { status: 'finished' });
    } else {
      await update(roomRef, {
        currentRound: nextRound,
        status: 'playing',
      });
    }
  };

  const walkForward = useCallback(() => {
    setWalkIndex((prev) => {
      const next = Math.min(prev + 1, walkable.length - 1);
      if (next !== prev && imageWebViewRef.current) {
        const url = walkable[next].imageUrl.replace(/'/g, "\\'");
        imageWebViewRef.current.injectJavaScript(`document.getElementById('si').src='${url}';true;`);
      }
      return next;
    });
  }, [walkable]);

  const walkBack = useCallback(() => {
    setWalkIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next !== prev && imageWebViewRef.current) {
        const url = walkable[next].imageUrl.replace(/'/g, "\\'");
        imageWebViewRef.current.injectJavaScript(`document.getElementById('si').src='${url}';true;`);
      }
      return next;
    });
  }, [walkable]);

  const currentRound = room?.currentRound ?? 0;
  const roundData = room?.rounds?.[currentRound];
  const isHost = room?.host === playerName;
  const activePlayers = getActivePlayers(room);
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};
  const rtlText = isRTL ? { textAlign: 'right' } : {};

  const guessedCount = room ? activePlayers.filter(
    (n) => room.guesses?.[n]?.[String(currentRound)],
  ).length : 0;
  const totalPlayers = activePlayers.length;

  const leaveGame = async () => {
    try {
      const remainingActive = activePlayers.filter((n) => n !== playerName);
      const remainingList = (room?.playerList || []).filter((n) => n !== playerName);
      const patch = { activePlayers: remainingActive, playerList: remainingList };

      if (isHost) {
        if (remainingActive.length === 0) {
          patch.status = 'finished';
        } else {
          patch.host = remainingActive[0];
        }
      }
      await update(roomRef, patch);
    } catch {}
  };

  const mapHtmlWithMulti = MAP_HTML.replace(
    "function handleMessage(data){",
    `function handleMessage(data){
  if(data.type==='showMultiResult'){
    interactive=false;
    window.multiLayers=window.multiLayers||[];
    window.multiLayers.forEach(function(layer){if(map.hasLayer(layer))map.removeLayer(layer);});
    window.multiLayers=[];
    if(guessMarker){map.removeLayer(guessMarker);guessMarker=null;}
    if(actualMarker){map.removeLayer(actualMarker);actualMarker=null;}
    if(polyline){map.removeLayer(polyline);polyline=null;}
    actualMarker=L.marker([data.actual.lat,data.actual.lng],{icon:actualIcon}).addTo(map);
    window.multiLayers.push(actualMarker);
    function formatKm(km){
      if(!isFinite(km))return '';
      if(km>=1000)return (Math.round(km)).toLocaleString()+' km';
      if(km>=100)return (Math.round(km)).toLocaleString()+' km';
      return (Math.round(km*10)/10)+' km';
    }
    function haversineKm(aLat,aLng,bLat,bLng){
      var R=6371;
      var dLat=(bLat-aLat)*Math.PI/180;
      var dLng=(bLng-aLng)*Math.PI/180;
      var s1=Math.sin(dLat/2)*Math.sin(dLat/2);
      var s2=Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
      var c=2*Math.atan2(Math.sqrt(s1+s2),Math.sqrt(1-(s1+s2)));
      return R*c;
    }
    function zoomForDistanceKm(km){
      // Deterministic zoom from round distance only (same for all devices/players).
      if(km>=12000) return 2;
      if(km>=7000) return 3;
      if(km>=3500) return 4;
      if(km>=1800) return 5;
      if(km>=900) return 6;
      if(km>=450) return 7;
      if(km>=220) return 8;
      if(km>=110) return 9;
      if(km>=55) return 10;
      if(km>=28) return 11;
      if(km>=14) return 12;
      if(km>=7) return 13;
      if(km>=3) return 14;
      return 15;
    }
    var allPts=[[data.actual.lat,data.actual.lng]];
    var farthestGuess=null;
    var farthestKm=-1;
    (data.guesses||[]).forEach(function(g){
      var ic=L.divIcon({className:'',html:'<div style="width:24px;height:24px;border-radius:50%;background:'+g.color+';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;">'+g.name[0]+'</div>',iconSize:[24,24],iconAnchor:[12,12]});
      var gm=L.marker([g.lat,g.lng],{icon:ic}).addTo(map);
      window.multiLayers.push(gm);
      var ln=L.polyline([[g.lat,g.lng],[data.actual.lat,data.actual.lng]],{color:g.color,weight:2,dashArray:'8,6',opacity:0.7}).addTo(map);
      window.multiLayers.push(ln);
      var km=(typeof g.distance==='number'&&isFinite(g.distance))?g.distance:haversineKm(g.lat,g.lng,data.actual.lat,data.actual.lng);
      if(km>farthestKm){
        farthestKm=km;
        farthestGuess=g;
      }
      var midLat=(g.lat+data.actual.lat)/2;
      var midLng=(g.lng+data.actual.lng)/2;
      var lbHtml='<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:12px;background:linear-gradient(180deg,rgba(14,20,36,0.96),rgba(8,12,24,0.96));border:1px solid rgba(255,255,255,0.22);box-shadow:0 3px 10px rgba(0,0,0,0.45);white-space:nowrap;">'
        +'<span style="width:14px;height:14px;border-radius:7px;background:'+g.color+';display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(255,255,255,0.45) inset;"><span style="font-size:9px;line-height:1;color:#fff;font-weight:900;">➜</span></span>'
        +'<span style="color:#fff;font-size:11px;line-height:1;font-weight:900;letter-spacing:0.2px;text-shadow:0 1px 2px rgba(0,0,0,0.45);">'+formatKm(km)+'</span>'
      +'</div>';
      var lb=L.marker([midLat,midLng],{icon:L.divIcon({className:'',html:lbHtml})}).addTo(map);
      window.multiLayers.push(lb);
      allPts.push([g.lat,g.lng]);
    });
    var farKm=Math.max(1,isFinite(farthestKm)?farthestKm:1);
    var zoom=zoomForDistanceKm(farKm);
    map.setView([data.actual.lat,data.actual.lng],zoom,{animate:true});
    return;
  }
`);

  if (!room || !roundData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>{t('preparing')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, rtlRow]}>
        <TouchableOpacity onPress={confirmExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{roomCode}</Text>
        </View>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>{currentRound + 1}/{GAME.TOTAL_ROUNDS}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={13} color={COLORS.accent} />
          <Text style={styles.scoreText}>{totalScore}</Text>
        </View>
      </View>

      {/* Image area */}
      {phase !== 'result' && (
        <View style={[styles.imageArea, mapVisible && phase === 'guessing' && styles.imageAreaCompact]}>
          <WebView
            ref={imageWebViewRef}
            source={{ html: getImageViewHtml(walkable[walkIndex]?.imageUrl || roundData.imageUrl) }}
            style={styles.imageWebView}
            scrollEnabled
            bounces={false}
            scalesPageToFit
            showsVerticalScrollIndicator={false}
          />
          {walkable.length > 1 && (
            <View style={styles.walkControls}>
              <TouchableOpacity onPress={walkBack} disabled={walkIndex === 0} style={[styles.walkBtn, walkIndex === 0 && { opacity: 0.3 }]}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.walkCounter}>{walkIndex + 1}/{walkable.length}</Text>
              <TouchableOpacity onPress={walkForward} disabled={walkIndex >= walkable.length - 1} style={[styles.walkBtn, walkIndex >= walkable.length - 1 && { opacity: 0.3 }]}>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {phase === 'waiting' && (
            <View style={styles.waitingOverlay}>
              <ActivityIndicator color={COLORS.accent} size="small" />
              <Text style={styles.waitingText}>
                {t('waitingGuesses')} ({guessedCount}/{totalPlayers})
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Map */}
      <View
        style={[
          styles.mapSection,
          !mapVisible && phase === 'guessing' && styles.mapHide,
          mapVisible && phase === 'guessing' && styles.mapExpanded,
          phase === 'result' && styles.mapResultVisible,
        ]}
      >
        <WebView
          ref={webViewRef}
          source={{ html: mapHtmlWithMulti }}
          style={styles.map}
          scrollEnabled={false}
          onMessage={(e) => {
            try {
              const data = JSON.parse(e.nativeEvent.data);
              if (data.type === 'guess' && phase === 'guessing') {
                setGuessCoords({ lat: data.lat, lng: data.lng });
              }
            } catch {}
          }}
        />
      </View>

      {/* Bottom bar */}
      {phase === 'guessing' && (
        <View style={styles.bottomBar}>
          {!mapVisible ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setMapVisible(true)}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.guessBtn}>
                <Ionicons name="map" size={18} color="#fff" />
                <Text style={styles.guessBtnText}>{t('guess')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={!guessCoords}
            >
              <LinearGradient
                colors={guessCoords ? ['#06D6A0', '#05B384'] : ['#333', '#222']}
                style={styles.guessBtn}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.guessBtnText}>{t('confirm')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Result overlay */}
      {phase === 'result' && (
        <Animated.View
          style={[
            styles.resultOverlay,
            { opacity: resultOpacity, transform: [{ translateY: resultSlide }] },
          ]}
        >
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t('distance')}</Text>
            <Text style={styles.resultValue}>{formatDistance(myDistance, t)}</Text>
            <Text style={[styles.resultLabel, { marginTop: 8 }]}>{roundData.locationName}, {roundData.country}</Text>

            <View style={styles.resultScoreRow}>
              <Text style={styles.resultScore}>+{myScore}</Text>
              <Text style={styles.resultPts}>{t('pts')}</Text>
            </View>

            {/* Mini leaderboard */}
            <View style={styles.miniBoard}>
              {activePlayers
                .map((name) => {
                  let total = 0;
                  for (let i = 0; i <= currentRound; i++) {
                    total += room.guesses?.[name]?.[String(i)]?.score || 0;
                  }
                  return { name, total };
                })
                .sort((a, b) => b.total - a.total)
                .map((p, idx) => (
                  <View key={p.name} style={[styles.miniBoardRow, rtlRow]}>
                    <Text style={styles.miniBoardRank}>#{idx + 1}</Text>
                    <Text style={[styles.miniBoardName, p.name === playerName && { color: COLORS.accent }]}>
                      {p.name}
                    </Text>
                    <Text style={styles.miniBoardScore}>{p.total}</Text>
                  </View>
                ))}
            </View>

            {isHost && (
              <TouchableOpacity activeOpacity={0.85} onPress={handleNext} style={{ marginTop: 12 }}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.nextBtn}>
                  <Text style={styles.nextBtnText}>
                    {currentRound + 1 >= GAME.TOTAL_ROUNDS ? t('seeResults') : t('nextRound')}
                  </Text>
                  <Ionicons name={currentRound + 1 >= GAME.TOTAL_ROUNDS ? 'trophy' : 'arrow-forward'} size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            {!isHost && (
              <Text style={styles.waitHostText}>{t('waitingForHost')}</Text>
            )}
          </View>
        </Animated.View>
      )}

      <ConfirmModal
        visible={exitModalVisible}
        icon="people-outline"
        iconColor={COLORS.accent}
        title={t('exitMultiplayerTitle')}
        message={t('exitMultiplayerMessage')}
        cancelText={t('cancel')}
        confirmText={t('leaveConfirm')}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={async () => {
          setExitModalVisible(false);
          if (unsub.current) unsub.current();
          await leaveGame();
          navigation.replace('Home', { playerName });
        }}
        isRTL={isRTL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C18' },
  center: { flex: 1, backgroundColor: '#080C18', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 54, paddingHorizontal: 14, paddingBottom: 8,
    backgroundColor: 'rgba(8,12,24,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  codeBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  codeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  roundBadge: {
    backgroundColor: 'rgba(230,57,70,0.1)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 22,
  },
  roundText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,186,8,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18,
  },
  scoreText: { color: COLORS.accent, fontSize: 14, fontWeight: '800' },
  imageArea: { flex: 1, backgroundColor: '#0F1628', overflow: 'hidden' },
  imageAreaCompact: { flex: 0, height: height * 0.2 },
  imageWebView: { flex: 1, backgroundColor: '#0F1628' },
  walkControls: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  walkBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  walkCounter: { color: '#fff', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  waitingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,12,24,0.8)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  waitingText: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },
  mapSection: { height: height * 0.22, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mapExpanded: { flex: 1, height: undefined },
  mapResultVisible: { flex: 1, height: undefined },
  mapHide: { height: 0 },
  map: { flex: 1, backgroundColor: COLORS.background },
  bottomBar: {
    backgroundColor: 'rgba(8,12,24,0.95)', paddingVertical: 12, paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  guessBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
  },
  guessBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  resultOverlay: {
    width: '100%',
    backgroundColor: 'rgba(8,12,24,0.96)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  resultCard: { alignItems: 'center' },
  resultLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  resultValue: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  resultScore: { color: COLORS.accent, fontSize: 28, fontWeight: '900' },
  resultPts: { color: COLORS.accentDark, fontSize: 14, fontWeight: '700' },
  miniBoard: {
    width: '100%', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 12, gap: 6,
  },
  miniBoardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniBoardRank: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800', width: 28 },
  miniBoardName: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
  miniBoardScore: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '800' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14,
  },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  waitHostText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 14 },
});
