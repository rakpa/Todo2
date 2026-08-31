import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { formatClock, formatRemaining } from '../../domain/time';
import type { TimeFormat, TimedOccurrence } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../common/ThemedText';

interface Props {
  occurrences: TimedOccurrence[];
  nowMinutes: number;
  isToday: boolean;
  timeFormat: TimeFormat;
}

export function TodayGlance({ occurrences, nowMinutes, isToday, timeFormat }: Props) {
  const { colors } = useTheme();
  const current = useMemo(() => {
    if (!isToday) return occurrences.find((item) => !item.isCompleted) ?? null;
    return (
      occurrences.find(
        (item) =>
          !item.isCompleted &&
          nowMinutes >= item.startMinutesFromMidnight &&
          nowMinutes < item.startMinutesFromMidnight + item.durationMinutes,
      ) ??
      occurrences.find((item) => !item.isCompleted && item.startMinutesFromMidnight >= nowMinutes) ??
      null
    );
  }, [isToday, nowMinutes, occurrences]);

  if (!current) {
    return (
      <View style={{ marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}>
        <ThemedText tone="secondary">
          {isToday ? 'No upcoming block. The spine is yours.' : 'Open a day to see what’s next.'}
        </ThemedText>
      </View>
    );
  }

  const startsIn = current.startMinutesFromMidnight - nowMinutes;
  const subtitle =
    isToday && startsIn > 0
      ? `in ${startsIn} min`
      : isToday && startsIn <= 0
        ? formatRemaining(current.startMinutesFromMidnight + current.durationMinutes - nowMinutes)
        : formatClock(current.startMinutesFromMidnight, timeFormat);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${current.title}, ${subtitle}`}
      style={{ marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}
    >
      <ThemedText tone="tertiary" style={{ fontSize: 12 }}>
        {isToday && startsIn <= 0 ? 'Now' : 'Next'}
      </ThemedText>
      <ThemedText weight="bold" style={{ fontSize: 16 }}>
        {current.title}
      </ThemedText>
      <ThemedText tone="secondary" style={{ fontSize: 13 }}>
        {subtitle} · {formatClock(current.startMinutesFromMidnight, timeFormat)}
      </ThemedText>
    </Pressable>
  );
}
