import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { LanguageProvider } from './src/i18n/LanguageContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import FinalScoreScreen from './src/screens/FinalScoreScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import RoomScreen from './src/screens/RoomScreen';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import MultiplayerResultsScreen from './src/screens/MultiplayerResultsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Ensure audio plays on iOS even when the silent switch is on.
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.T,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      })
      .then(() => mobileAds().initialize())
      .catch(() => {});
  }, []);

  return (
    <LanguageProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0B0D17' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="FinalScore"
          component={FinalScoreScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Room" component={RoomScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="MultiplayerResults" component={MultiplayerResultsScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </LanguageProvider>
  );
}
