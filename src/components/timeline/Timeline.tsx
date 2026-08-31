import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SPINE_WIDTH,
  TIME_RAIL_WIDTH,
  dayHeight,
  layoutDay,
  pixelsPerMinute,
  timeTicks,
  yForMinutes,
} from '../../domain/layout';
import { formatHourLabel } from '../../domain/time';
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
  contentOffsetMinutes?: number;
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
  contentOffsetMinutes,
}: Props) {
  const { colors } = useTheme();
  const { blocks, gaps } = useMemo(() => layoutDay(occurrences, density), [occurrences, density]);
  const ticks = useMemo(() => timeTicks(density), [density]);
  const height = dayHeight(density);
  const ppm = pixelsPerMinute(density);
  const rail = compact ? 40 : TIME_RAIL_WIDTH;
  const clipY =
    compact && contentOffsetMinutes != null
      ? Math.max(0, yForMinutes(contentOffsetMinutes, density) - 16)
      : 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ height, paddingBottom: 96 }}
      scrollEnabled={!(compact && contentOffsetMinutes != null)}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height, flexDirection: 'row', marginTop: -clipY }}>
        <View style={{ width: rail, paddingTop: 4 }}>
          {ticks.map((minute) => (
            <ThemedText
              key={minute}
              tone="tertiary"
              style={{
                position: 'absolute',
                top: yForMinutes(minute, density) - 8,
                right: 10,
                fontSize: compact ? 10 : 12,
                fontWeight: '500',
                letterSpacing: 0.2,
              }}
            >
              {formatHourLabel(minute, timeFormat)}
            </ThemedText>
          ))}
        </View>
        <View
          style={{
            width: SPINE_WIDTH,
            marginTop: 0,
            backgroundColor: colors.spine,
            borderRadius: 2,
          }}
        />
        <View style={{ flex: 1, marginRight: compact ? 6 : 14 }}>
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
                zIndex: 8,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: -7,
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
