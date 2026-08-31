import React from 'react';
import { Pressable, View } from 'react-native';
import { formatDuration } from '../../domain/time';
import type { GapRegion } from '../../domain/layout';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../common/ThemedText';

interface Props {
  gap: GapRegion;
  onAdd: () => void;
  onCopy: () => void;
}

export function GapHelper({ gap, onAdd, onCopy }: Props) {
  const { colors } = useTheme();
  if (gap.durationMinutes < 30) return null;
  const prompt =
    gap.durationMinutes < 45
      ? 'A short break would fit here.'
      : 'Anything to do in this stretch?';
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: gap.top + 8,
        left: 72,
        right: 16,
        minHeight: 48,
      }}
    >
      <ThemedText tone="tertiary" style={{ fontSize: 13, marginBottom: 8 }}>
        {prompt} {formatDuration(gap.durationMinutes)} free.
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add task in this gap"
          style={{
            paddingHorizontal: 12,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.chip,
            justifyContent: 'center',
          }}
        >
          <ThemedText style={{ fontSize: 13 }}>Add Task</ThemedText>
        </Pressable>
        <Pressable
          onPress={onCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy a task into this gap"
          style={{
            paddingHorizontal: 12,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.chip,
            justifyContent: 'center',
          }}
        >
          <ThemedText style={{ fontSize: 13 }}>Copy Task</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
