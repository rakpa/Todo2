import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../shell/navigation/types';
import { expandTasksForDate } from '../domain/recurrence';
import { nowMinutesFromMidnight, weekDateKeys, weekdayLabels } from '../domain/time';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import { IconButton } from '../components/common/IconButton';
import { ThemedText } from '../components/common/ThemedText';
import { EditorSheet } from '../components/editor/EditorSheet';
import { Timeline } from '../components/timeline/Timeline';

export function WeekViewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tasks = useAppStore((s) => s.tasks);
  const settings = useAppStore((s) => s.settings);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const toggleComplete = useAppStore((s) => s.toggleComplete);
  const [editing, setEditing] = useState<string | null>(null);
  const days = useMemo(() => weekDateKeys(selectedDate, settings.weekStart), [selectedDate, settings.weekStart]);
  const labels = weekdayLabels(settings.weekStart);
  const now = nowMinutesFromMidnight();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <IconButton name="chevron-back" label="Back" onPress={() => navigation.goBack()} />
        <ThemedText weight="bold" style={{ fontSize: 22, flex: 1 }}>
          Week
        </ThemedText>
      </View>
      <ScrollView horizontal pagingEnabled={false} style={{ flex: 1 }}>
        {days.map((date, index) => (
          <Pressable
            key={date}
            onPress={() => {
              setSelectedDate(date);
              navigation.navigate('Day');
            }}
            style={{ width: 148, borderRightWidth: 1, borderRightColor: colors.hairline }}
          >
            <ThemedText style={{ textAlign: 'center', paddingVertical: 8 }}>
              {labels[index]} {date.slice(-2)}
            </ThemedText>
            <Timeline
              occurrences={expandTasksForDate(tasks, date)}
              density="compact"
              timeFormat={settings.timeFormat}
              nowMinutes={now}
              isToday={false}
              compact
              interactive={false}
              onPressTask={(occurrence) => setEditing(occurrence.task.id)}
              onComplete={(occurrence) => toggleComplete(occurrence)}
            />
          </Pressable>
        ))}
      </ScrollView>
      <EditorSheet visible={editing != null} taskId={editing ?? undefined} onClose={() => setEditing(null)} />
    </View>
  );
}
