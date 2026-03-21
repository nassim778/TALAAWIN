import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { COLORS, GAME } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDistance } from '../utils/scoring';
import { fetchRandomImage, resetUsedLocations } from '../utils/mapillary';

const MEDAL = ['🥇', '🥈', '🥉'];
const PLAYER_COLORS = ['#E63946', '#FFBA08', '#118AB2', '#06D6A0', '#9B5DE5'];

export default function MultiplayerResultsScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const { playerName, roomCode, room } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [roomData, setRoomData] = useState(room);
  const [selectedMode, setSelectedMode] = useState(room?.mode || 'world');
  const [preparingReplay, setPreparingReplay] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [sendingVote, setSendingVote] = useState(false);
  const roomRef = ref(rtdb, `rooms/${roomCode}`);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const unsub = onValue(roomRef, (snap) => {
      if (!snap.exists()) {
        navigation.replace('Home', { playerName });
        return;
      }
      const data = snap.val();
      setRoomData(data);
      if (data.status === 'playing') {
        navigation.replace('MultiplayerGame', { roomCode, playerName });
      }
    });
    return () => unsub();
  }, [navigation, playerName, roomCode]);

  const isHost = roomData?.host === playerName;
  const activePlayers = roomData?.activePlayers || roomData?.playerList || [];
  const replayRequest = roomData?.replayRequest || null;
  const replayVotes = roomData?.replayVotes || {};
  const myVote = replayVotes?.[playerName] || null;
  const yesVotes = activePlayers.filter((n) => replayVotes?.[n] === 'yes').length;
  const noVotes = activePlayers.filter((n) => replayVotes?.[n] === 'no').length;
  const allAccepted = activePlayers.length > 0 && activePlayers.every((n) => replayVotes?.[n] === 'yes');
  const canVote = replayRequest?.status === 'pending' && !isHost && !myVote;
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};
  const rtlText = isRTL ? { textAlign: 'right' } : {};

  const leaderboard = useMemo(() => (roomData?.playerList || []).map((name, idx) => {
    let total = 0;
    const roundScores = [];
    for (let i = 0; i < GAME.TOTAL_ROUNDS; i++) {
      const g = roomData?.guesses?.[name]?.[String(i)];
      const score = g?.score || 0;
      total += score;
      roundScores.push({ score, distance: g?.distance || 0 });
    }
    return { name, total, roundScores, color: PLAYER_COLORS[idx % 5] };
  }).sort((a, b) => b.total - a.total), [roomData]);

  const winner = leaderboard[0];

  const handlePlayAgain = async () => {
    if (!isHost || preparingReplay || !roomData) return;
    if (!replayRequest) {
      await update(roomRef, {
        replayRequest: { by: playerName, status: 'pending', at: Date.now() },
        replayVotes: { [playerName]: 'yes' },
      });
      return;
    }
    if (!allAccepted) return;
    setShowModePicker(true);
  };

  const handleVote = async (vote) => {
    if (!canVote || sendingVote) return;
    setSendingVote(true);
    try {
      await update(roomRef, { [`replayVotes/${playerName}`]: vote });
      if (vote === 'no') {
        await update(roomRef, { replayRequest: { ...replayRequest, status: 'rejected' } });
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to submit vote');
    }
    setSendingVote(false);
  };

  const handleStartRematch = async () => {
    if (!isHost || preparingReplay || !roomData || !allAccepted) return;
    setPreparingReplay(true);
    try {
      resetUsedLocations();
      const rounds = [];
      for (let i = 0; i < GAME.TOTAL_ROUNDS; i++) {
        const img = await fetchRandomImage(selectedMode);
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
        mode: selectedMode,
        rounds,
        guesses: {},
        currentRound: 0,
        activePlayers: roomData.activePlayers || roomData.playerList || [],
        replayRequest: null,
        replayVotes: null,
        status: 'playing',
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to start new game');
      setPreparingReplay(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={['#080C18', '#0D1530', '#101A38', '#0D1530', '#080C18']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroBlock, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.winnerName}>{winner?.name}</Text>
          <Text style={styles.winnerLabel}>{t('winner')}</Text>
          <View style={styles.winnerScoreBadge}>
            <Ionicons name="star" size={16} color={COLORS.accent} />
            <Text style={styles.winnerScore}>{winner?.total}</Text>
            <Text style={styles.winnerPts}>/ {GAME.MAX_TOTAL_SCORE}</Text>
          </View>
        </Animated.View>

        <Text style={[styles.sectionTitle, rtlText]}>{t('leaderboard')}</Text>

        {leaderboard.map((player, idx) => (
          <Animated.View
            key={player.name}
            style={[
              styles.playerCard,
              player.name === playerName && styles.playerCardYou,
              { opacity: fadeAnim },
            ]}
          >
            <View style={[styles.playerHeader, rtlRow]}>
              <View style={[styles.rankBadge, idx === 0 && styles.rankGold, idx === 1 && styles.rankSilver, idx === 2 && styles.rankBronze]}>
                <Text style={styles.rankText}>{idx < 3 ? MEDAL[idx] : `#${idx + 1}`}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pName, rtlText]}>
                  {player.name}
                  {player.name === playerName ? ` (${t('you')})` : ''}
                </Text>
              </View>
              <Text style={styles.pTotal}>{player.total}</Text>
            </View>

            <View style={styles.roundsRow}>
              {player.roundScores.map((rs, ri) => (
                <View key={ri} style={styles.roundChip}>
                  <Text style={styles.roundChipLabel}>R{ri + 1}</Text>
                  <Text style={styles.roundChipScore}>{rs.score}</Text>
                  <Text style={styles.roundChipDist}>{formatDistance(rs.distance, t)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        {canVote && (
          <View style={styles.voteCard}>
            <Text style={[styles.voteTitle, rtlText]}>{t('replayInviteTitle')}</Text>
            <Text style={[styles.voteSub, rtlText]}>{t('replayInviteMessage')}</Text>
            <View style={[styles.voteRow, rtlRow]}>
              <TouchableOpacity style={styles.voteBtnNo} onPress={() => handleVote('no')} disabled={sendingVote}>
                <Text style={styles.voteBtnText}>{t('decline')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voteBtnYes} onPress={() => handleVote('yes')} disabled={sendingVote}>
                <Text style={styles.voteBtnText}>{t('accept')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isHost ? (
          <>
            {!!replayRequest && (
              <Text style={styles.hostVoteStatus}>
                {t('replayVotes')}: {yesVotes}/{activePlayers.length}
                {noVotes > 0 ? ` • ${t('declined')}: ${noVotes}` : ''}
              </Text>
            )}

            {!showModePicker ? (
              <TouchableOpacity activeOpacity={0.85} onPress={handlePlayAgain} disabled={preparingReplay}>
                <LinearGradient colors={[COLORS.secondary, '#0D6E8F']} style={styles.replayBtn}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.replayBtnText}>
                    {!replayRequest ? t('playAgain') : t('continue')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <View style={[styles.replayModes, rtlRow]}>
                  {['tunisia', 'maghreb', 'world'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeChip, selectedMode === mode && styles.modeChipActive]}
                      onPress={() => setSelectedMode(mode)}
                      disabled={preparingReplay}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.modeChipEmoji}>
                        {mode === 'tunisia' ? '🇹🇳' : mode === 'maghreb' ? '🏜️' : '🌍'}
                      </Text>
                      <Text style={[styles.modeChipText, selectedMode === mode && styles.modeChipTextActive]}>
                        {t(mode === 'world' ? 'worldwide' : mode)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity activeOpacity={0.85} onPress={handleStartRematch} disabled={preparingReplay}>
                  <LinearGradient colors={[COLORS.secondary, '#0D6E8F']} style={styles.replayBtn}>
                    {preparingReplay ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play" size={18} color="#fff" />
                        <Text style={styles.replayBtnText}>{t('startGame')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

          </>
        ) : (
          <Text style={[styles.waitText, rtlText]}>
            {replayRequest?.status === 'pending' ? t('waitingForHost') : t('waitingForHost')}
          </Text>
        )}

        {replayRequest?.status === 'rejected' && (
          <Text style={styles.rejectedText}>{t('replayDeclined')}</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.replace('Home', { playerName })}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.homeBtn}>
            <Ionicons name="home" size={18} color="#fff" />
            <Text style={styles.homeBtnText}>{t('backToHome')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 70, paddingBottom: 120 },
  heroBlock: { alignItems: 'center', marginBottom: 32 },
  trophy: { fontSize: 64, marginBottom: 8 },
  winnerName: { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  winnerLabel: { color: COLORS.accent, fontSize: 14, fontWeight: '700', marginTop: 4 },
  winnerScoreBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(255,186,8,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22,
  },
  winnerScore: { color: COLORS.accent, fontSize: 22, fontWeight: '900' },
  winnerPts: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700', marginBottom: 14, letterSpacing: 1 },
  playerCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  playerCardYou: { borderColor: 'rgba(255,186,8,0.3)' },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rankBadge: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rankGold: { backgroundColor: 'rgba(255,186,8,0.2)' },
  rankSilver: { backgroundColor: 'rgba(192,192,192,0.15)' },
  rankBronze: { backgroundColor: 'rgba(205,127,50,0.15)' },
  rankText: { fontSize: 16 },
  pName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  pTotal: { color: COLORS.accent, fontSize: 20, fontWeight: '900' },
  roundsRow: { flexDirection: 'row', gap: 6 },
  roundChip: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 8, borderRadius: 10,
  },
  roundChipLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  roundChipScore: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  roundChipDist: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, paddingTop: 12, gap: 10,
    backgroundColor: 'rgba(8,12,24,0.95)',
  },
  replayModes: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border,
  },
  modeChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,186,8,0.12)' },
  modeChipEmoji: { fontSize: 18, marginBottom: 2 },
  modeChipText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  modeChipTextActive: { color: COLORS.accent },
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  replayBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  waitText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
  voteCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 12, gap: 8,
  },
  voteTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  voteSub: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  voteRow: { flexDirection: 'row', gap: 8 },
  voteBtnYes: {
    flex: 1, backgroundColor: 'rgba(6,214,160,0.22)', borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  voteBtnNo: {
    flex: 1, backgroundColor: 'rgba(230,57,70,0.22)', borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  voteBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  hostVoteStatus: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  rejectedText: { color: COLORS.error, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
