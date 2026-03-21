import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Animated, StatusBar, Platform, Share, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, update, remove } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { COLORS, GAME } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import { fetchRandomImage, resetUsedLocations } from '../utils/mapillary';

const MODE_EMOJI = { tunisia: '🇹🇳', maghreb: '🏜️', world: '🌍' };

export default function RoomScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const { roomCode, playerName } = route.params;
  const [room, setRoom] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const unsub = useRef(null);
  const roomRef = ref(rtdb, `rooms/${roomCode}`);

  useEffect(() => {
    unsub.current = onValue(roomRef, (snap) => {
      if (!snap.exists()) { navigation.replace('Home', { playerName }); return; }
      const data = snap.val();
      setRoom(data);
      if (data.status === 'playing') {
        navigation.replace('MultiplayerGame', { roomCode, playerName });
      }
    });
    return () => unsub.current?.();
  }, [roomCode, navigation, playerName]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const isHost = room?.host === playerName;
  const canStart = isHost && (room?.playerList?.length || 0) >= 2;

  const handleStart = async () => {
    if (!canStart || preparing) return;
    setPreparing(true);
    try {
      resetUsedLocations();
      const rounds = [];
      for (let i = 0; i < GAME.TOTAL_ROUNDS; i++) {
        const img = await fetchRandomImage(room.mode);
        rounds.push({
          imageUrl: img.imageUrl,
          locationName: img.locationName,
          country: img.country,
          lat: img.coordinates.latitude,
          lng: img.coordinates.longitude,
          walkable: img.walkable.map((w) => ({
            id: w.id,
            imageUrl: w.imageUrl,
            lat: w.coordinates.latitude,
            lng: w.coordinates.longitude,
          })),
        });
      }
      await update(roomRef, {
        rounds,
        activePlayers: room.playerList || [],
        status: 'playing',
        currentRound: 0,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
      setPreparing(false);
    }
  };

  const doLeave = async () => {
    if (unsub.current) unsub.current();
    try {
      if (isHost) {
        await remove(roomRef);
      } else {
        const newList = (room?.playerList || []).filter((n) => n !== playerName);
        await update(roomRef, { playerList: newList });
      }
    } catch {}
    navigation.replace('Home', { playerName });
  };

  const handleLeave = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeave();
      return true;
    });
    return () => handler.remove();
  }, [handleLeave]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Join my TALAAWIN game! Code: ${roomCode}` });
    } catch {}
  };

  const rtlText = isRTL ? { textAlign: 'right' } : {};
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};

  if (!room) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={['#080C18', '#0D1530', '#080C18']} style={StyleSheet.absoluteFill} />

      {/* Room code */}
      <View style={styles.codeBlock}>
        <Text style={[styles.codeLabel, rtlText]}>{t('roomCode')}</Text>
        <Animated.View style={[styles.codeBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.codeText}>{roomCode}</Text>
        </Animated.View>
        <TouchableOpacity style={[styles.shareBtn, rtlRow]} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={16} color={COLORS.accent} />
          <Text style={styles.shareBtnText}>{t('shareCode')}</Text>
        </TouchableOpacity>
      </View>

      {/* Mode */}
      <View style={[styles.modeRow, rtlRow]}>
        <Text style={styles.modeEmoji}>{MODE_EMOJI[room.mode]}</Text>
        <Text style={styles.modeLabel}>
          {t(room.mode === 'world' ? 'worldwide' : room.mode === 'maghreb' ? 'maghreb' : 'tunisia')}
        </Text>
      </View>

      {/* Players */}
      <Text style={[styles.sectionLabel, rtlText]}>
        {t('players')} ({room.playerList?.length || 0}/{room.maxPlayers})
      </Text>
      <View style={styles.playerList}>
        {(room.playerList || []).map((name, idx) => (
          <View key={name} style={[styles.playerRow, rtlRow]}>
            <View style={[styles.playerAvatar, idx === 0 && styles.hostAvatar]}>
              <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{name}</Text>
            {name === room.host && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>{t('host')}</Text>
              </View>
            )}
            {name === playerName && name !== room.host && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>{t('you')}</Text>
              </View>
            )}
          </View>
        ))}
        {(room.playerList?.length || 0) < room.maxPlayers && (
          <View style={[styles.playerRow, rtlRow, { opacity: 0.3 }]}>
            <View style={styles.playerAvatar}>
              <Ionicons name="hourglass-outline" size={16} color={COLORS.textMuted} />
            </View>
            <Text style={styles.playerName}>{t('waitingForPlayers')}</Text>
          </View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        {preparing ? (
          <View style={styles.preparingRow}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.preparingText}>{t('preparing')}</Text>
          </View>
        ) : isHost ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleStart} disabled={!canStart}>
            <LinearGradient
              colors={canStart ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']}
              style={styles.startBtn}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startBtnText}>{t('startGame')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.waitText, rtlText]}>{t('waitingForHost')}</Text>
        )}
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.7}>
          <Ionicons name="exit-outline" size={16} color={COLORS.error} />
          <Text style={styles.leaveBtnText}>{t('leave')}</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={exitModalVisible}
        icon="exit-outline"
        iconColor={COLORS.primary}
        title={t('exitRoomTitle')}
        message={t('exitRoomMessage')}
        cancelText={t('cancel')}
        confirmText={t('leaveConfirm')}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          doLeave();
        }}
        isRTL={isRTL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  codeBlock: { alignItems: 'center', marginTop: Platform.OS === 'android' ? 60 : 80 },
  codeLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  codeBadge: {
    backgroundColor: 'rgba(255,186,8,0.1)', borderRadius: 18, paddingHorizontal: 36, paddingVertical: 16,
    borderWidth: 2, borderColor: 'rgba(255,186,8,0.3)',
  },
  codeText: { color: COLORS.accent, fontSize: 36, fontWeight: '900', letterSpacing: 10 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,186,8,0.08)',
  },
  shareBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  modeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, marginBottom: 24,
  },
  modeEmoji: { fontSize: 20 },
  modeLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  playerList: { gap: 8, marginBottom: 24 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  playerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  hostAvatar: { backgroundColor: 'rgba(230,57,70,0.2)' },
  avatarText: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  playerName: { color: COLORS.text, fontSize: 15, fontWeight: '600', flex: 1 },
  hostBadge: {
    backgroundColor: 'rgba(230,57,70,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  hostBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  youBadge: {
    backgroundColor: 'rgba(255,186,8,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  youBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '800' },
  bottomActions: { marginTop: 'auto', paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 12 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 16,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  waitText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 18 },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  leaveBtnText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },
  preparingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  preparingText: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },
});
