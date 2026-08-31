import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  dayHeight,
  layoutDay,
  pixelsPerMinute,
  timeTicks,
  yForMinutes,
} from '../../domain/layout';
import { formatClock } from '../../domain/time';
import type { TimeFormat, TimedOccurrence, TimelineDensity } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../common/ThemedText';
import { GapHelper } from './GapHelper';
import { TaskBlock } from './TaskBlock';

interface Props {
  occurrences: TimedOccurrence[];
  density: TimelineDensity;
  timeFormat: TimeFormat;
  nowMinutes: number;
  isToday: boolean;
  compact?: boolean;
  interactive?: boolean;
  onPressTask?: (occurrence: TimedOccurrence) => void;
  onComplete?: (occurrence: TimedOccurrence) => void;
  onDragEnd?: (occurrence: TimedOccurrence, deltaMinutes: number) => void;
  onAddInGap?: (startMinutes: number) => void;
  onCopyInGap?: (startMinutes: number) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
}

export function Timeline({
  occurrences,
  density,
  timeFormat,
  nowMinutes,
  isToday,
  compact,
  interactive = true,
  onPressTask,
  onComplete,
  onDragEnd,
  onAddInGap,
  onCopyInGap,
  scrollRef,
}: Props) {
  const { colors } = useTheme();
  const { blocks, gaps } = useMemo(() => layoutDay(occurrences, density), [occurrences, density]);
  const ticks = useMemo(() => timeTicks(density), [density]);
  const height = dayHeight(density);
  const ppm = pixelsPerMinute(density);
  const rail = compact ? 36 : 58;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ height, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height, flexDirection: 'row' }}>
        <View style={{ width: rail, paddingTop: 4 }}>
          {ticks.map((minute) => (
            <ThemedText
              key={minute}
              tone="tertiary"
              style={{
                position: 'absolute',
                top: yForMinutes(minute, density) - 8,
                right: 8,
                fontSize: compact ? 9 : 11,
              }}
            >
              {formatClock(minute, timeFormat).replace(' ', '\n')}
            </ThemedText>
          ))}
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: colors.spine,
              borderRadius: 1,
            }}
          />
          {isToday ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: yForMinutes(nowMinutes, density),
                height: 2,
                backgroundColor: colors.now,
                zIndex: 4,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: 4,
                  top: -5,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.now,
                }}
              />
            </View>
          ) : null}
          {!compact
            ? gaps.map((gap) => (
                <GapHelper
                  key={`${gap.startMinutes}`}
                  gap={gap}
                  onAdd={() => onAddInGap?.(gap.startMinutes)}
                  onCopy={() => onCopyInGap?.(gap.startMinutes)}
                />
              ))
            : null}
          {blocks.map((block) => (
            <TaskBlock
              key={`${block.occurrence.task.id}:${block.occurrence.occurrenceDate}:${block.occurrence.startMinutesFromMidnight}`}
              occurrence={block.occurrence}
              timeFormat={timeFormat}
              nowMinutes={nowMinutes}
              isToday={isToday}
              top={block.top}
              height={block.height}
              column={block.column}
              columnCount={block.columnCount}
              compact={compact}
              onPress={() => onPressTask?.(block.occurrence)}
              onComplete={() => onComplete?.(block.occurrence)}
              onDragEnd={interactive && onDragEnd ? (delta) => onDragEnd(block.occurrence, delta) : undefined}
              pixelsPerMinute={ppm}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
