import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_KEY = '@talaawin_player_name';

export default function SettingsScreen({ navigation, route }) {
  const { t, isRTL, lang, toggleLanguage } = useLanguage();
  const currentName = route.params?.playerName || '';
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const savedScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      return;
    }
    Keyboard.dismiss();
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    setSaved(true);
    setError('');

    Animated.spring(savedScale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      navigation.navigate('Home', { playerName: trimmed });
    }, 800);
  };

  const rtlText = isRTL ? { textAlign: 'right', writingDirection: 'rtl' } : {};
  const rtlRow = isRTL ? { flexDirection: 'row-reverse' } : {};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={['#080C18', '#0D1530', '#101A38', '#0D1530', '#080C18']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, rtlRow]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Name card */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, rtlRow]}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="person-outline" size={22} color={COLORS.accent} />
            </View>
            <Text style={[styles.cardTitle, rtlText]}>{t('editName')}</Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.nameInput,
                isRTL && { textAlign: 'right' },
              ]}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError('');
                setSaved(false);
                savedScale.setValue(0);
              }}
              placeholder={t('editNamePlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              maxLength={20}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, rtlText]}>{error}</Text>
          ) : null}

          {/* Save button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saved}
          >
            <LinearGradient
              colors={
                saved
                  ? [COLORS.success, '#04A77D']
                  : [COLORS.primary, COLORS.primaryDark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, rtlRow]}
            >
              {saved ? (
                <Animated.View
                  style={[
                    styles.savedRow,
                    rtlRow,
                    { transform: [{ scale: savedScale }] },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>{t('nameSaved')}</Text>
                </Animated.View>
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Language card */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, rtlRow]}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="language-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={[styles.cardTitle, rtlText]}>
              {lang === 'en' ? 'Language' : 'اللغة'}
            </Text>
          </View>

          <View style={[styles.langRow, rtlRow]}>
            <TouchableOpacity
              style={[
                styles.langChip,
                lang === 'en' && styles.langChipActive,
              ]}
              onPress={() => { if (lang !== 'en') toggleLanguage(); }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langChipText,
                  lang === 'en' && styles.langChipTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langChip,
                lang === 'ar' && styles.langChipActive,
              ]}
              onPress={() => { if (lang !== 'ar') toggleLanguage(); }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langChipText,
                  lang === 'ar' && styles.langChipTextActive,
                ]}
              >
                عربي
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 44 : 58,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 20,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },

  inputRow: {
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  langChipActive: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(17,138,178,0.12)',
  },
  langChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  langChipTextActive: {
    color: COLORS.text,
  },
});
