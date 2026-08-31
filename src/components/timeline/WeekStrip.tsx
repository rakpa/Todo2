import React from 'react';
import { Pressable, View } from 'react-native';
import { tokenColors } from '../../domain/colorTokens';
import { expandTasksForDate } from '../../domain/recurrence';
import { addDaysKey, weekdayIndex, weekDateKeys } from '../../domain/time';
import type { Task, TimeFormat, WeekStart } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../common/ThemedText';

interface Props {
  selectedDate: string;
  weekStart: WeekStart;
  tasks: Task[];
  today: string;
  timeFormat: TimeFormat;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({ selectedDate, weekStart, tasks, today, onSelectDate }: Props) {
  const { colors, mode } = useTheme();
  const days = weekDateKeys(selectedDate, weekStart);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }}>
      {days.map((date) => {
        const selected = date === selectedDate;
        const isToday = date === today;
        const occurrences = expandTasksForDate(tasks, date);
        const dots = [...new Set(occurrences.slice(0, 3).map((item) => item.task.colorToken))];
        const weekday = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][weekdayIndex(date)];
        const dayNum = date.slice(-2).replace(/^0/, '') || date.slice(-2);
        return (
          <Pressable
            key={date}
            onPress={() => onSelectDate(date)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${date}${isToday ? ', today' : ''}`}
            style={{ alignItems: 'center', minWidth: 44, paddingVertical: 6 }}
          >
            <ThemedText tone={isToday ? 'accent' : 'tertiary'} style={{ fontSize: 11, marginBottom: 6 }}>
              {weekday}
            </ThemedText>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.accent : 'transparent',
              }}
            >
              <ThemedText
                tone={selected ? 'inverse' : 'primary'}
                weight="bold"
                style={{ fontSize: 16 }}
              >
                {dayNum}
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 6, minHeight: 6 }}>
              {dots.map((token) => (
                <View
                  key={token}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: tokenColors(token, mode).dot,
                  }}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function shiftSelectedWeek(selectedDate: string, direction: -1 | 1): string {
  return addDaysKey(selectedDate, direction * 7);
}
