import React from 'react';
import { Pressable } from 'react-native';
import { formatDuration } from '../../domain/time';
import type { GapRegion } from '../../domain/layout';
import { ThemedText } from '../common/ThemedText';

interface Props {
  gap: GapRegion;
  onAdd: () => void;
  onCopy?: () => void;
}

export function GapHelper({ gap, onAdd }: Props) {
  if (gap.durationMinutes < 60) return null;
  return (
    <Pressable
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel={`Add a block in this ${formatDuration(gap.durationMinutes)} gap`}
      style={{
        position: 'absolute',
        top: Math.max(gap.top + 8, gap.top + gap.height / 2 - 16),
        left: 10,
        height: 32,
        justifyContent: 'center',
      }}
    >
      <ThemedText tone="tertiary" style={{ fontSize: 13 }}>
        + Add
      </ThemedText>
    </Pressable>
  );
}
