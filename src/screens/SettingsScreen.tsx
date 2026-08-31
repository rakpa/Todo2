import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestNotificationPermission } from '../services/notifications';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../shell/navigation/types';
import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ThemedText } from '../components/common/ThemedText';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const loadSampleDay = useAppStore((s) => s.loadSampleDay);
  const removeSampleDay = useAppStore((s) => s.removeSampleDay);
  const selectedDate = useAppStore((s) => s.selectedDate);

  const askNotifications = async () => {
    const granted = await requestNotificationPermission();
    await updateSettings({ notificationsEnabled: granted, notificationsAsked: true });
    if (!granted) Linking.openSettings();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <IconButton name="chevron-back" label="Back" onPress={() => navigation.goBack()} />
        <ThemedText weight="bold" style={{ fontSize: 22 }}>
          Settings
        </ThemedText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 8 }}>
        <Pressable onPress={() => navigation.navigate('Focus')} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 8 }}>
          <ThemedText tone="accent">Focus timer</ThemedText>
        </Pressable>
        <ThemedText tone="tertiary">Rhythm</ThemedText>
        <Row label="Week starts Monday">
          <Switch value={settings.weekStart === 1} onValueChange={(value) => updateSettings({ weekStart: value ? 1 : 0 })} />
        </Row>
        <Row label="24-hour time">
          <Switch value={settings.timeFormat === 'h24'} onValueChange={(value) => updateSettings({ timeFormat: value ? 'h24' : 'h12' })} />
        </Row>
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Timeline</ThemedText>
        {(['compact', 'comfortable', 'roomy'] as const).map((density) => (
          <Pressable key={density} onPress={() => updateSettings({ timelineDensity: density })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <ThemedText tone={settings.timelineDensity === density ? 'accent' : 'primary'}>{density}</ThemedText>
          </Pressable>
        ))}
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Default duration</ThemedText>
        {[15, 30, 45, 60].map((minutes) => (
          <Pressable key={minutes} onPress={() => updateSettings({ defaultDurationMinutes: minutes })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <ThemedText tone={settings.defaultDurationMinutes === minutes ? 'accent' : 'primary'}>{minutes} min</ThemedText>
          </Pressable>
        ))}
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Snap grid</ThemedText>
        {([5, 10, 15] as const).map((grid) => (
          <Pressable key={grid} onPress={() => updateSettings({ snapGridMinutes: grid })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <ThemedText tone={settings.snapGridMinutes === grid ? 'accent' : 'primary'}>{grid} minutes</ThemedText>
          </Pressable>
        ))}
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Appearance</ThemedText>
        {(['system', 'light', 'dark'] as const).map((item) => (
          <Pressable key={item} onPress={() => updateSettings({ appearance: item })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <ThemedText tone={settings.appearance === item ? 'accent' : 'primary'}>{item}</ThemedText>
          </Pressable>
        ))}
        <Row label="Dyslexia-friendly font">
          <Switch value={settings.dyslexiaFont} onValueChange={(value) => updateSettings({ dyslexiaFont: value })} />
        </Row>
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Notifications</ThemedText>
        <PrimaryButton label={settings.notificationsEnabled ? 'Notifications on' : 'Enable notifications'} onPress={askNotifications} />
        <Row label="Calendar connection">
          <Switch value={settings.calendarAccessEnabled} onValueChange={(value) => updateSettings({ calendarAccessEnabled: value })} />
        </Row>
        {settings.calendarAccessEnabled ? (
          <ThemedText tone="tertiary">Placeholder — events will share the timeline when native calendar access is wired.</ThemedText>
        ) : null}
        <ThemedText tone="tertiary" style={{ marginTop: 16 }}>Advanced</ThemedText>
        <Row label="Hide AI entry">
          <Switch value={settings.hideAiEntry} onValueChange={(value) => updateSettings({ hideAiEntry: value })} />
        </Row>
        <Row label="Hide title suggestions">
          <Switch value={settings.suggestionHistoryHidden} onValueChange={(value) => updateSettings({ suggestionHistoryHidden: value })} />
        </Row>
        <PrimaryButton label="Replay tutorial" variant="secondary" onPress={replayOnboarding} style={{ marginTop: 12 }} />
        {settings.hasLoadedSampleDay ? (
          <PrimaryButton label="Remove sample day" variant="secondary" onPress={removeSampleDay} />
        ) : (
          <PrimaryButton label="Load sample day" variant="secondary" onPress={() => loadSampleDay(selectedDate)} />
        )}
        <ThemedText tone="secondary" style={{ marginTop: 24, lineHeight: 22 }}>
          Privacy: your day stays on this device in v1. There is no account and no cloud sync unless you opt in later. Export will read the same local database.
        </ThemedText>
        <Pressable
          onPress={() => {
            const message = 'Export uses the on-device SQLite store. A share sheet lands in a later release.';
            if (Platform.OS === 'web') globalThis.alert?.(message);
            else Alert.alert('Backup', message);
          }}
        >
          <ThemedText tone="accent">Export / backup (later)</ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}>
      <ThemedText>{label}</ThemedText>
      {children}
    </View>
  );
}
