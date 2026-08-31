import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { openRepositories } from '../db';
import { OnboardingPager } from '../components/onboarding/OnboardingPager';
import { BrandedSplash } from '../components/splash/BrandedSplash';
import { useAppStore } from '../store/appStore';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';

void SplashScreen.preventAutoHideAsync();

function BootGate() {
  const { colors, mode } = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);
  const settings = useAppStore((s) => s.settings);
  const sessionSplashConsumed = useAppStore((s) => s.sessionSplashConsumed);
  const consumeSessionSplash = useAppStore((s) => s.consumeSessionSplash);
  const markSplashSeen = useAppStore((s) => s.markSplashSeen);
  const [minElapsed, setMinElapsed] = useState(false);
  const warmRef = useRef(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') warmRef.current = true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const skip = warmRef.current && settings.hasCompletedOnboarding;
    if (skip) {
      setMinElapsed(true);
      return;
    }
    const ms = settings.hasCompletedOnboarding ? 850 : 1200;
    const handle = setTimeout(() => setMinElapsed(true), ms);
    return () => clearTimeout(handle);
  }, [settings.hasCompletedOnboarding]);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hydrated]);

  const showSplash =
    !sessionSplashConsumed &&
    !(warmRef.current && settings.hasCompletedOnboarding && hydrated) &&
    (!hydrated || !minElapsed);

  useEffect(() => {
    if (!showSplash && !sessionSplashConsumed) {
      consumeSessionSplash();
      if (!settings.hasSeenSplash) markSplashSeen();
    }
  }, [showSplash, sessionSplashConsumed, consumeSessionSplash, markSplashSeen, settings.hasSeenSplash]);

  if (showSplash) {
    return <BrandedSplash hydrating={!hydrated} />;
  }

  if (!settings.hasCompletedOnboarding) {
    return <OnboardingPager />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </View>
  );
}

export function AppRoot() {
  const hydrate = useAppStore((s) => s.hydrate);
  const configure = useAppStore((s) => s.configure);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const repos = await openRepositories();
      if (cancelled) return;
      configure(repos);
      await hydrate();
    })();
    return () => {
      cancelled = true;
    };
  }, [configure, hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BootGate />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
