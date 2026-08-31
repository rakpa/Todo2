import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_NAME, APP_TAGLINE } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { AppMark } from '../brand/AppMark';
import { ThemedText } from '../common/ThemedText';

interface Props {
  hydrating: boolean;
}

export function BrandedSplash({ hydrating }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showSpinner, setShowSpinner] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setShowSpinner(true), 700);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        accessible
        accessibilityLabel={APP_NAME}
        accessibilityRole="image"
        style={{
          alignItems: 'center',
          transform: reduceMotion ? undefined : [{ scale: 1 }],
        }}
      >
        <AppMark size={120} accessibilityLabel={APP_NAME} />
        <ThemedText weight="bold" style={{ fontSize: 34, marginTop: 18, letterSpacing: -0.6 }}>
          {APP_NAME}
        </ThemedText>
        <ThemedText tone="secondary" style={{ fontSize: 16, marginTop: 8 }}>
          {APP_TAGLINE}
        </ThemedText>
      </View>
      {hydrating && showSpinner ? (
        <ActivityIndicator
          style={{ position: 'absolute', bottom: Math.max(insets.bottom, 24) + 24 }}
          color={colors.text.tertiary}
        />
      ) : null}
    </View>
  );
}
