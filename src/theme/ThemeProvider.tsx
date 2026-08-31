import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { useFonts } from 'expo-font';
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { darkPalette, lightPalette, type Palette } from './palette';

export interface ThemeValue {
  mode: 'light' | 'dark';
  colors: Palette;
  fonts: {
    regular: string | undefined;
    bold: string | undefined;
  };
  fontsReady: boolean;
}

const ThemeContext = createContext<ThemeValue>({
  mode: 'light',
  colors: lightPalette,
  fonts: { regular: undefined, bold: undefined },
  fontsReady: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useAppStore((state) => state.settings.appearance);
  const dyslexiaFont = useAppStore((state) => state.settings.dyslexiaFont);
  const system = useColorScheme();
  const [fontsReady] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  const value = useMemo<ThemeValue>(() => {
    const mode: 'light' | 'dark' =
      appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
    return {
      mode,
      colors: mode === 'dark' ? darkPalette : lightPalette,
      fonts: {
        regular: dyslexiaFont && fontsReady ? 'AtkinsonHyperlegible_400Regular' : undefined,
        bold: dyslexiaFont && fontsReady ? 'AtkinsonHyperlegible_700Bold' : undefined,
      },
      fontsReady: !dyslexiaFont || fontsReady,
    };
  }, [appearance, dyslexiaFont, fontsReady, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
