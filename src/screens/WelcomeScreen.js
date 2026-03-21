import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@talaawin_player_name';

export default function WelcomeScreen({ navigation }) {
  const { t, isRTL, lang, toggleLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        navigation.replace('Home', { playerName: stored });
      }
    });
  }, []);

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1, duration: 800, useNativeDriver: true,
        }),
        Animated.spring(logoSlide, {
          toValue: 0, friction: 8, tension: 40, useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0, friction: 7, tension: 35, useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.8, duration: 3000, useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4, duration: 3000, useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
      return;
    }
    Keyboard.dismiss();
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
    navigation.replace('Home', { playerName: trimmed });
  };

  const rtlText = isRTL ? { textAlign: 'right' } : {};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <Animated.View style={[styles.glowCircle, { opacity: glowPulse }]} />

      {/* Language toggle */}
      <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage} activeOpacity={0.7}>
        <Ionicons name="language" size={18} color={COLORS.textSecondary} />
        <Text style={styles.langText}>{lang === 'en' ? 'عربي' : 'EN'}</Text>
      </TouchableOpacity>

      {/* Logo / Title */}
      <Animated.View
        style={[
          styles.logoBlock,
          { opacity: logoFade, transform: [{ translateY: logoSlide }] },
        ]}
      >
        <View style={styles.pinContainer}>
          <Text style={styles.pinIcon}>📍</Text>
        </View>
        <Text style={styles.title}>
          <Text style={styles.title1}>{t('appTitle1')}</Text>
          <Text style={styles.title2}>{t('appTitle2')}</Text>
        </Text>
        <Text style={[styles.welcomeTitle, rtlText]}>{t('welcomeTitle')}</Text>
      </Animated.View>

      {/* Form */}
      <Animated.View
        style={[
          styles.formBlock,
          { opacity: formFade, transform: [{ translateY: formSlide }] },
        ]}
      >
        <Text style={[styles.label, rtlText]}>{t('whatIsYourName')}</Text>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="person-outline"
            size={20}
            color={COLORS.textMuted}
            style={isRTL ? styles.inputIconRight : styles.inputIconLeft}
          />
          <TextInput
            style={[
              styles.input,
              isRTL ? { textAlign: 'right', paddingRight: 44, paddingLeft: 16 } : {},
            ]}
            placeholder={t('namePlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={(v) => { setName(v); setError(''); }}
            maxLength={20}
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />
        </View>

        {error ? <Text style={[styles.errorText, rtlText]}>{error}</Text> : null}

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleContinue}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>{t('letsGo')}</Text>
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={18}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glowCircle: {
    position: 'absolute',
    top: '15%',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(230,57,70,0.06)',
  },
  langBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 56,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  logoBlock: { alignItems: 'center', marginBottom: 48 },
  pinContainer: { marginBottom: 12 },
  pinIcon: { fontSize: 48 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  title1: { color: COLORS.primary },
  title2: { color: COLORS.accent },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
    letterSpacing: 0.5,
  },

  formBlock: { width: '100%', maxWidth: 360 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 14,
    top: 16,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 14,
    top: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
