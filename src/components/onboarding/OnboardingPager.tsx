import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Switch,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_NAME, APP_TAGLINE, ONBOARDING_DURATION_PRESETS } from '../../domain/types';
import { suggestColorToken } from '../../domain/colorTokens';
import { suggestIcon } from '../../domain/icons';
import { formatFriendlyDate, nextQuarterHour, nowMinutesFromMidnight, todayKey } from '../../domain/time';
import { requestNotificationPermission } from '../../services/notifications';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';
import { AppMark } from '../brand/AppMark';
import { PrimaryButton } from '../common/PrimaryButton';
import { ThemedText } from '../common/ThemedText';
import { Timeline } from '../timeline/Timeline';
import { WeekStrip } from '../timeline/WeekStrip';
import { mockTimelineOccurrences } from './mockTimeline';

const { width } = Dimensions.get('window');

interface ScreenDef {
  key: string;
  title: string;
}

const SCREENS: ScreenDef[] = [
  { key: 'welcome', title: 'Welcome' },
  { key: 'timeline', title: 'The timeline' },
  { key: 'capture', title: 'Capture' },
  { key: 'first', title: 'First task' },
  { key: 'look', title: 'Look and rhythm' },
  { key: 'notify', title: 'Notifications' },
  { key: 'extras', title: 'Extras' },
  { key: 'ready', title: 'Ready' },
];

export function OnboardingPager() {
  const insets = useSafeAreaInsets();
  const { colors, fonts } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const tasks = useAppStore((s) => s.tasks);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setOnboardingScreen = useAppStore((s) => s.setOnboardingScreen);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const createTask = useAppStore((s) => s.createTask);
  const loadSampleDay = useAppStore((s) => s.loadSampleDay);
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(settings.lastOnboardingScreen);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [didCreateFirst, setDidCreateFirst] = useState(false);
  const today = todayKey();
  const startDefault = nextQuarterHour(nowMinutesFromMidnight());

  useEffect(() => {
    listRef.current?.scrollToIndex({ index, animated: false });
  }, []);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(SCREENS.length - 1, next));
    setIndex(clamped);
    setOnboardingScreen(clamped);
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
  };

  const onMomentum = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
    setOnboardingScreen(next);
  };

  const saveFirstTask = async () => {
    if (!title.trim()) return;
    await createTask({
      title: title.trim(),
      durationMinutes: duration,
      startMinutesFromMidnight: startDefault,
      date: today,
      isInbox: false,
      iconKey: suggestIcon(title),
      colorToken: suggestColorToken(title),
    });
    setDidCreateFirst(true);
    go(index + 1);
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    await updateSettings({ notificationsEnabled: granted, notificationsAsked: true });
    go(index + 1);
  };

  const screenStyle = {
    width,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    flex: 1,
  };

  const renderScreen = ({ item, index: screenIndex }: { item: ScreenDef; index: number }) => {
    if (item.key === 'welcome') {
      return (
        <View style={screenStyle}>
          <AppMark size={96} />
          <ThemedText weight="bold" style={{ fontSize: 32, marginTop: 20 }} accessibilityRole="header">
            {APP_NAME}
          </ThemedText>
          <ThemedText weight="bold" style={{ fontSize: 22, marginTop: 16 }}>
            See the whole day as a timeline, not a checklist.
          </ThemedText>
          <ThemedText tone="secondary" style={{ fontSize: 16, marginTop: 12, lineHeight: 22 }}>
            Time-block work, study, home, and busy minds on one vertical spine.
          </ThemedText>
        </View>
      );
    }
    if (item.key === 'timeline') {
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            The timeline
          </ThemedText>
          <View style={{ height: 280, marginVertical: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: colors.surface }}>
            <WeekStrip
              selectedDate={today}
              weekStart={settings.weekStart}
              tasks={[]}
              today={today}
              timeFormat={settings.timeFormat}
              onSelectDate={() => {}}
            />
            <Timeline
              occurrences={mockTimelineOccurrences()}
              density="compact"
              timeFormat={settings.timeFormat}
              nowMinutes={9 * 60 + 20}
              isToday
              compact
              interactive={false}
            />
          </View>
          <ThemedText style={{ marginBottom: 8 }}>Blocks have a start and a length.</ThemedText>
          <ThemedText style={{ marginBottom: 8 }}>Height equals duration.</ThemedText>
          <ThemedText>Empty space is free time you can fill.</ThemedText>
        </View>
      );
    }
    if (item.key === 'capture') {
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            Capture, then schedule
          </ThemedText>
          <ThemedText tone="secondary" style={{ marginTop: 8, marginBottom: 16 }}>
            Inbox is a fast holding pen with no time. Scheduling puts a start and duration on the spine. Drag to move.
          </ThemedText>
          <View style={{ backgroundColor: colors.chip, borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <ThemedText tone="tertiary">Inbox</ThemedText>
            <ThemedText weight="bold">Design review</ThemedText>
          </View>
          <ThemedText tone="tertiary" style={{ textAlign: 'center', marginBottom: 12 }}>
            ↓ becomes a timed block
          </ThemedText>
          <View style={{ backgroundColor: colors.accentSoft, borderRadius: 28, padding: 14 }}>
            <ThemedText weight="bold">Design review</ThemedText>
            <ThemedText tone="secondary">2:00–2:45 PM (45 min)</ThemedText>
          </View>
        </View>
      );
    }
    if (item.key === 'first') {
      const examples = ['Wake up', 'Deep work', 'Wind down'];
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            Place a first block
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.text.tertiary}
            accessibilityLabel="Task title"
            style={{
              marginTop: 16,
              fontSize: 20,
              color: colors.text.primary,
              fontFamily: fonts.regular,
              paddingVertical: 10,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {examples.map((example) => (
              <Pressable
                key={example}
                onPress={() => setTitle(example)}
                style={{ backgroundColor: colors.chip, borderRadius: 16, paddingHorizontal: 12, height: 36, justifyContent: 'center' }}
              >
                <ThemedText>{example}</ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ONBOARDING_DURATION_PRESETS.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => setDuration(minutes)}
                style={{
                  backgroundColor: duration === minutes ? colors.accent : colors.chip,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  height: 36,
                  justifyContent: 'center',
                }}
              >
                <ThemedText tone={duration === minutes ? 'inverse' : 'primary'}>
                  {minutes < 60 ? `${minutes}m` : '1h'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText tone="secondary" style={{ marginTop: 12 }}>
            Starts at the next quarter-hour unless you skip this screen.
          </ThemedText>
        </View>
      );
    }
    if (item.key === 'look') {
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            Look and rhythm
          </ThemedText>
          <Row label="Week starts Monday">
            <Switch
              value={settings.weekStart === 1}
              onValueChange={(value) => updateSettings({ weekStart: value ? 1 : 0 })}
            />
          </Row>
          <Row label="24-hour time">
            <Switch
              value={settings.timeFormat === 'h24'}
              onValueChange={(value) => updateSettings({ timeFormat: value ? 'h24' : 'h12' })}
            />
          </Row>
          <ThemedText tone="secondary" style={{ marginTop: 12 }}>Appearance</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {(['system', 'light', 'dark'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => updateSettings({ appearance: item })}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: settings.appearance === item ? colors.accent : colors.chip,
                  justifyContent: 'center',
                }}
              >
                <ThemedText tone={settings.appearance === item ? 'inverse' : 'primary'}>{item}</ThemedText>
              </Pressable>
            ))}
          </View>
          <Row label="Dyslexia-friendly font">
            <Switch
              value={settings.dyslexiaFont}
              onValueChange={(value) => updateSettings({ dyslexiaFont: value })}
            />
          </Row>
        </View>
      );
    }
    if (item.key === 'notify') {
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            Gentle pings
          </ThemedText>
          <ThemedText tone="secondary" style={{ marginTop: 12, lineHeight: 22 }}>
            Ping at the start of a block, optionally a few minutes before, and when a focus timer ends.
          </ThemedText>
        </View>
      );
    }
    if (item.key === 'extras') {
      return (
        <View style={screenStyle}>
          <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
            Optional extras
          </ThemedText>
          <Row label="Calendar access (coming soon)">
            <Switch
              value={settings.calendarAccessEnabled}
              onValueChange={(value) => updateSettings({ calendarAccessEnabled: value })}
            />
          </Row>
          {settings.calendarAccessEnabled ? (
            <ThemedText tone="tertiary">Native calendars will sit on the same timeline in a later release.</ThemedText>
          ) : null}
          <ThemedText tone="secondary" style={{ marginTop: 16, lineHeight: 22 }}>
            AI planning and Replan exist later in the app and are never required to start. No account needed.
          </ThemedText>
        </View>
      );
    }
    return (
      <View style={screenStyle}>
        <ThemedText weight="bold" style={{ fontSize: 26 }} accessibilityRole="header">
          Ready for {formatFriendlyDate(today)}
        </ThemedText>
        <ThemedText tone="secondary" style={{ marginTop: 12, lineHeight: 22 }}>
          {didCreateFirst || tasks.length > 0
            ? 'Your first block is on today.'
            : 'Your timeline is empty — that’s a welcome, not a problem.'}
        </ThemedText>
        <ThemedText style={{ marginTop: 12 }}>Tap plus to add, drag to move, ring to complete.</ThemedText>
        {tasks.length === 0 ? (
          <Pressable onPress={() => loadSampleDay(today)} style={{ marginTop: 18 }}>
            <ThemedText tone="accent">Load sample day</ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
    void screenIndex;
  };

  const primaryLabel =
    index === 0
      ? 'Continue'
      : index === 3
        ? title.trim()
          ? 'Save block'
          : 'Skip this block'
        : index === 5
          ? 'Enable notifications'
          : index === 7
            ? 'Start planning'
            : 'Next';

  const onPrimary = () => {
    if (index === 3) {
      if (title.trim()) saveFirstTask();
      else go(index + 1);
      return;
    }
    if (index === 5) {
      enableNotifications();
      return;
    }
    if (index === 7) {
      completeOnboarding();
      return;
    }
    go(index + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }}>
        <Pressable
          onPress={() => go(index - 1)}
          disabled={index === 0}
          accessibilityLabel="Back"
          style={{ minHeight: 44, justifyContent: 'center', opacity: index === 0 ? 0 : 1 }}
        >
          <ThemedText>Back</ThemedText>
        </Pressable>
        <ThemedText tone="tertiary">{APP_TAGLINE}</ThemedText>
        <Pressable onPress={skipOnboarding} accessibilityLabel="Skip" style={{ minHeight: 44, justifyContent: 'center' }}>
          <ThemedText tone="accent">Skip</ThemedText>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 }}>
        {SCREENS.map((screen, dot) => (
          <View
            key={screen.key}
            style={{
              width: dot === index ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: dot === index ? colors.accent : colors.spine,
            }}
          />
        ))}
      </View>
      <FlatList
        ref={listRef}
        data={SCREENS}
        keyExtractor={(item) => item.key}
        renderItem={renderScreen}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentum}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialScrollIndex={settings.lastOnboardingScreen}
      />
      <View style={{ paddingHorizontal: 24, gap: 8 }}>
        <PrimaryButton label={primaryLabel} onPress={onPrimary} />
        {index === 5 ? (
          <PrimaryButton label="Not now" variant="ghost" onPress={() => go(index + 1)} />
        ) : null}
        {index === 0 ? <PrimaryButton label="Skip" variant="ghost" onPress={skipOnboarding} /> : null}
      </View>
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
