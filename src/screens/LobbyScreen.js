import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Keyboard, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, set, get, update } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

const { width } = Dimensions.get('window');
const MODES = ['tunisia', 'maghreb', 'world'];
const MODE_EMOJI = { tunisia: '🇹🇳', maghreb: '🏜️', world: '🌍' };

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function LobbyScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const playerName = route.params?.playerName || 'Player';
  const [tab, setTab] = useState('create');
  const [mode, setMode] = useState('tunisia');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const confirmBack = () => {
    setExitModalVisible(true);
  };

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmBack();
      return true;
    });
    return () => handler.remove();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleCreate = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      let code = '';
      let roomExists = true;
      for (let i = 0; i < 5 && roomExists; i++) {
        code = generateCode();
        const existing = await get(ref(rtdb, `rooms/${code}`));
        roomExists = existing.exists();
      }
      if (roomExists) throw new Error(t('tryAgain'));

      await set(ref(rtdb, `rooms/${code}`), {
        host: playerName,
        mode,
        status: 'waiting',
        maxPlayers,
        currentRound: 0,
        playerList: [playerName],
        rounds: [],
        guesses: {},
        createdAt: Date.now(),
      });
      navigation.replace('Room', { roomCode: code, playerName });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    Keyboard.dismiss();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setError(t('roomNotFound')); return; }
    setLoading(true);
    setError('');
    try {
      const roomRef = ref(rtdb, `rooms/${code}`);
      const snap = await get(roomRef);
      if (!snap.exists()) throw new Error(t('roomNotFound'));
      const data = snap.val();
      if (data.status !== 'waiting') throw new Error(t('gameStarted'));
      if ((data.playerList || []).length >= data.maxPlayers) throw new Error(t('roomFull'));
      if ((data.playerList || []).includes(playerName)) throw new Error(t('nameTaken'));

      await update(roomRef, { playerList: [...(data.playerList || []), playerName] });
      navigation.replace('Room', { roomCode: code, playerName });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const rtlText = isRTL ? { textAlign: 'right' } : {};
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={['#080C18', '#0D1530', '#080C18']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, rtlRow]}>
        <TouchableOpacity onPress={confirmBack} style={styles.backBtn}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('multiplayer')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Tab selector */}
          <View style={[styles.tabRow, rtlRow]}>
            {['create', 'join'].map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, tab === key && styles.tabActive]}
                onPress={() => { setTab(key); setError(''); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={key === 'create' ? 'add-circle-outline' : 'enter-outline'}
                  size={18}
                  color={tab === key ? COLORS.accent : COLORS.textMuted}
                />
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {key === 'create' ? t('createRoom') : t('joinRoom')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'create' ? (
            <View style={styles.formCard}>
              {/* Mode selection */}
              <Text style={[styles.label, rtlText]}>{t('selectMode')}</Text>
              <View style={[styles.modeRow, rtlRow]}>
                {MODES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, mode === m && styles.modeChipActive]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeEmoji}>{MODE_EMOJI[m]}</Text>
                    <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                      {t(m === 'world' ? 'worldwide' : m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max players */}
              <Text style={[styles.label, rtlText, { marginTop: 20 }]}>
                {t('maxPlayers')}: {maxPlayers}
              </Text>
              <View style={[styles.playerRow, rtlRow]}>
                {[2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.playerChip, maxPlayers === n && styles.playerChipActive]}
                    onPress={() => setMaxPlayers(n)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.playerChipText, maxPlayers === n && styles.playerChipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={[styles.errorText, rtlText]}>{error}</Text> : null}

              <TouchableOpacity activeOpacity={0.85} onPress={handleCreate} disabled={loading}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.actionBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>{t('create')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={[styles.label, rtlText]}>{t('roomCode')}</Text>
              <TextInput
                style={[styles.codeInput, isRTL && { textAlign: 'right' }]}
                placeholder={t('enterCode')}
                placeholderTextColor={COLORS.textMuted}
                value={joinCode}
                onChangeText={(v) => { setJoinCode(v.toUpperCase()); setError(''); }}
                maxLength={5}
                autoCapitalize="characters"
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />

              {error ? <Text style={[styles.errorText, rtlText]}>{error}</Text> : null}

              <TouchableOpacity activeOpacity={0.85} onPress={handleJoin} disabled={loading}>
                <LinearGradient
                  colors={[COLORS.secondary, '#0D6E8F']}
                  style={styles.actionBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="enter-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>{t('join')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <ConfirmModal
        visible={exitModalVisible}
        icon="arrow-back-circle-outline"
        iconColor={COLORS.accent}
        title={t('exitLobbyTitle')}
        message={t('exitLobbyMessage')}
        cancelText={t('cancel')}
        confirmText={t('exitConfirm')}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          navigation.goBack();
        }}
        isRTL={isRTL}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 44 : 58, paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 24, marginTop: 8 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,186,8,0.08)' },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: COLORS.accent },
  formCard: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  label: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: COLORS.border,
  },
  modeChipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(230,57,70,0.1)' },
  modeEmoji: { fontSize: 22, marginBottom: 4 },
  modeText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  modeTextActive: { color: COLORS.text },
  playerRow: { flexDirection: 'row', gap: 10 },
  playerChip: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: COLORS.border,
  },
  playerChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,186,8,0.1)' },
  playerChipText: { color: COLORS.textMuted, fontSize: 18, fontWeight: '800' },
  playerChipTextActive: { color: COLORS.accent },
  codeInput: {
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 20, fontSize: 24, fontWeight: '900',
    color: COLORS.text, textAlign: 'center', letterSpacing: 8, marginBottom: 8,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, marginTop: 20,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
