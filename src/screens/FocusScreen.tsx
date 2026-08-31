import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatClock, formatDuration } from '../domain/time';
import { expandTasksForDate } from '../domain/recurrence';
import { stubLiveActivity } from '../services/liveActivity';
import { scheduleFocusTicker } from '../services/notifications';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ThemedText } from '../components/common/ThemedText';

export function FocusScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tasks = useAppStore((s) => s.tasks);
  const settings = useAppStore((s) => s.settings);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const focusTaskId = useAppStore((s) => s.focusTaskId);
  const toggleComplete = useAppStore((s) => s.toggleComplete);
  const occurrence = expandTasksForDate(tasks, selectedDate).find((item) => item.task.id === focusTaskId)
    ?? expandTasksForDate(tasks, selectedDate).find((item) => !item.isCompleted);
  const [remaining, setRemaining] = useState((occurrence?.durationMinutes ?? 25) * 60);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    activateKeepAwakeAsync('dayline-focus');
    if (occurrence) {
      stubLiveActivity.start(occurrence.title, remaining);
      scheduleFocusTicker(occurrence.title, remaining);
    }
    return () => {
      deactivateKeepAwake('dayline-focus');
      stubLiveActivity.end();
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const handle = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(handle);
  }, [paused]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingHorizontal: 24 }}>
      <IconButton name="close" label="Close" onPress={() => navigation.goBack()} />
      <ThemedText tone="tertiary" style={{ marginTop: 24 }}>
        Focus
      </ThemedText>
      <ThemedText weight="bold" style={{ fontSize: 32, marginTop: 8 }}>
        {occurrence?.title ?? 'Open block'}
      </ThemedText>
      {occurrence ? (
        <ThemedText tone="secondary">
          {formatClock(occurrence.startMinutesFromMidnight, settings.timeFormat)} · {formatDuration(occurrence.durationMinutes)}
        </ThemedText>
      ) : null}
      <ThemedText weight="bold" style={{ fontSize: 64, marginVertical: 32, textAlign: 'center' }}>
        {`${minutes}:${seconds.toString().padStart(2, '0')}`}
      </ThemedText>
      <PrimaryButton label={paused ? 'Resume' : 'Pause'} onPress={() => setPaused((value) => !value)} />
      <Pressable
        onPress={() => setRemaining(0)}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
      >
        <ThemedText>Skip</ThemedText>
      </Pressable>
      <PrimaryButton
        label="Mark complete"
        variant="secondary"
        onPress={() => {
          if (occurrence) toggleComplete(occurrence);
          navigation.goBack();
        }}
      />
    </View>
  );
}
