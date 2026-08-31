import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { allDayTasksForDate, expandTasksForDate } from '../domain/recurrence';
import { collectOverdueIncomplete, replanOverdue } from '../domain/replan';
import {
  addDaysKey,
  formatMonthYear,
  nextFreeSlot,
  nextQuarterHour,
  nowMinutesFromMidnight,
  snapToGrid,
  todayKey,
} from '../domain/time';
import type { TimedOccurrence } from '../domain/types';
import { yForMinutes } from '../domain/layout';
import { tap } from '../services/haptics';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../shell/navigation/types';
import { FAB } from '../components/common/FAB';
import { IconButton } from '../components/common/IconButton';
import { ThemedText } from '../components/common/ThemedText';
import { EditorSheet } from '../components/editor/EditorSheet';
import { PlannerSheet } from '../components/planner/PlannerSheet';
import { Timeline } from '../components/timeline/Timeline';
import { WeekStrip } from '../components/timeline/WeekStrip';
import { TodayGlance } from '../components/widgets/TodayGlance';

export function DayTimelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tasks = useAppStore((s) => s.tasks);
  const settings = useAppStore((s) => s.settings);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const toggleComplete = useAppStore((s) => s.toggleComplete);
  const moveOccurrence = useAppStore((s) => s.moveOccurrence);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [editor, setEditor] = useState<{ taskId?: string; start?: number } | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [now, setNow] = useState(nowMinutesFromMidnight());
  const scrollRef = useRef<ScrollView | null>(null);
  const today = todayKey();
  const occurrences = useMemo(() => expandTasksForDate(tasks, selectedDate), [tasks, selectedDate]);
  const allDay = useMemo(() => allDayTasksForDate(tasks, selectedDate), [tasks, selectedDate]);
  const inboxCount = tasks.filter((task) => task.isInbox).length;

  useEffect(() => {
    const handle = setInterval(() => setNow(nowMinutesFromMidnight()), 30000);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    if (selectedDate !== today) return;
    const y = Math.max(0, yForMinutes(now, settings.timelineDensity) - 180);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
  }, [selectedDate, settings.timelineDensity, today]);

  const openCreate = (start?: number) => {
    const from = start ?? nextFreeSlot(occurrences, nextQuarterHour(selectedDate === today ? now : 8 * 60), settings.defaultDurationMinutes);
    setEditor({ start: from });
  };

  const onDragEnd = (occurrence: TimedOccurrence, deltaMinutes: number) => {
    const next = snapToGrid(occurrence.startMinutesFromMidnight + deltaMinutes, settings.snapGridMinutes);
    moveOccurrence(occurrence, selectedDate, next);
    tap();
  };

  const shiftDay = (direction: number) => {
    const current = useAppStore.getState().selectedDate;
    setSelectedDate(addDaysKey(current, direction));
  };

  const fling = Gesture.Pan()
    .activeOffsetX([-48, 48])
    .failOffsetY([-24, 24])
    .onEnd((event) => {
      const direction = event.translationX < 0 ? 1 : -1;
      runOnJS(shiftDay)(direction);
    });

  const cycleDensity = () => {
    const order = ['compact', 'comfortable', 'roomy'] as const;
    const next = order[(order.indexOf(settings.timelineDensity) + 1) % order.length];
    updateSettings({ timelineDensity: next });
  };

  const runReplan = async () => {
    const overdue = collectOverdueIncomplete(occurrences, now, selectedDate);
    if (overdue.length === 0) return;
    const draft = replanOverdue({
      overdue,
      remainingToday: occurrences.filter((item) => !overdue.includes(item)),
      nowMinutes: now,
      today: selectedDate,
      tomorrow: addDaysKey(selectedDate, 1),
    });
    for (const move of draft.moves) {
      const match = overdue.find((item) => item.task.id === move.taskId);
      if (match) await moveOccurrence(match, move.toDate, move.toStart);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText weight="bold" style={{ fontSize: 28 }} accessibilityRole="header">
          {formatMonthYear(selectedDate)}
        </ThemedText>
        <View style={{ flexDirection: 'row' }}>
          <IconButton name="file-tray-outline" label="Inbox" badge={inboxCount} onPress={() => navigation.navigate('Inbox')} />
          <IconButton name="calendar-outline" label="Week view" onPress={() => navigation.navigate('Week')} />
          {settings.hideAiEntry ? null : (
            <IconButton name="sparkles-outline" label="Smart plan" onPress={() => setPlannerOpen(true)} />
          )}
          <IconButton name="timer-outline" label="Focus timer" onPress={() => navigation.navigate('Focus')} />
          <IconButton name="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>
      <WeekStrip
        selectedDate={selectedDate}
        weekStart={settings.weekStart}
        tasks={tasks}
        today={today}
        timeFormat={settings.timeFormat}
        onSelectDate={setSelectedDate}
      />
      <TodayGlance occurrences={occurrences} nowMinutes={now} isToday={selectedDate === today} timeFormat={settings.timeFormat} />
      {allDay.length > 0 ? (
        <ScrollView horizontal style={{ maxHeight: 44, paddingHorizontal: 16 }} showsHorizontalScrollIndicator={false}>
          {allDay.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => setEditor({ taskId: task.id })}
              style={{ backgroundColor: colors.chip, borderRadius: 16, paddingHorizontal: 12, height: 32, justifyContent: 'center', marginRight: 8 }}
            >
              <ThemedText>{task.title}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12 }}>
        <Pressable onPress={cycleDensity} accessibilityLabel="Change timeline density" style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
          <Ionicons name="resize-outline" size={18} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={runReplan} accessibilityLabel="Replan unfinished tasks" style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
          <ThemedText tone="accent" style={{ fontSize: 13 }}>Replan</ThemedText>
        </Pressable>
      </View>
      <GestureDetector gesture={fling}>
        <View style={{ flex: 1 }}>
          <Timeline
            scrollRef={scrollRef}
            occurrences={occurrences}
            density={settings.timelineDensity}
            timeFormat={settings.timeFormat}
            nowMinutes={now}
            isToday={selectedDate === today}
            onPressTask={(occurrence) => setEditor({ taskId: occurrence.task.id })}
            onComplete={(occurrence) => {
              tap();
              toggleComplete(occurrence);
            }}
            onDragEnd={onDragEnd}
            onAddInGap={(start) => openCreate(start)}
            onCopyInGap={(start) => openCreate(start)}
          />
        </View>
      </GestureDetector>
      <FAB onPress={() => openCreate()} />
      <EditorSheet
        visible={editor != null}
        taskId={editor?.taskId}
        presetDate={selectedDate}
        presetStart={editor?.start}
        onClose={() => setEditor(null)}
      />
      <PlannerSheet visible={plannerOpen} onClose={() => setPlannerOpen(false)} occurrences={occurrences} />
    </View>
  );
}
