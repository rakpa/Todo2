import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DayTimelineScreen } from '../../screens/DayTimelineScreen';
import { FocusScreen } from '../../screens/FocusScreen';
import { InboxScreen } from '../../screens/InboxScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { WeekViewScreen } from '../../screens/WeekViewScreen';
import { useTheme } from '../../theme/ThemeProvider';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, mode } = useTheme();
  const navTheme = mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text.primary, border: colors.hairline, primary: colors.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.text.primary, border: colors.hairline, primary: colors.accent } };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Day" component={DayTimelineScreen} />
        <Stack.Screen name="Week" component={WeekViewScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Focus" component={FocusScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
