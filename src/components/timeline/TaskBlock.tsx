import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tokenColors } from '../../domain/colorTokens';
import { iconIon } from '../../domain/icons';
import { formatRemaining, formatTimeRange } from '../../domain/time';
import type { TimeFormat, TimedOccurrence } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../common/ThemedText';

interface Props {
  occurrence: TimedOccurrence;
  timeFormat: TimeFormat;
  nowMinutes: number;
  isToday: boolean;
  top: number;
  height: number;
  column: number;
  columnCount: number;
  compact?: boolean;
  onPress: () => void;
  onComplete: () => void;
  onDragEnd?: (deltaMinutes: number) => void;
  pixelsPerMinute: number;
}

export function TaskBlock({
  occurrence,
  timeFormat,
  nowMinutes,
  isToday,
  top,
  height,
  column,
  columnCount,
  compact,
  onPress,
  onComplete,
  onDragEnd,
  pixelsPerMinute,
}: Props) {
  const { colors, mode } = useTheme();
  const token = tokenColors(occurrence.task.colorToken, mode);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const running =
    isToday &&
    !occurrence.isCompleted &&
    nowMinutes >= occurrence.startMinutesFromMidnight &&
    nowMinutes < occurrence.startMinutesFromMidnight + occurrence.durationMinutes;
  const elapsed = running
    ? Math.min(
        1,
        (nowMinutes - occurrence.startMinutesFromMidnight) / Math.max(1, occurrence.durationMinutes),
      )
    : occurrence.isCompleted
      ? 1
      : 0;
  const remaining = running
    ? occurrence.startMinutesFromMidnight + occurrence.durationMinutes - nowMinutes
    : 0;
  const subtasks = occurrence.task.subtasks;
  const subtaskLabel =
    subtasks.length > 0
      ? `${subtasks.filter((item) => item.isCompleted).length}/${subtasks.length}`
      : null;
  const range = formatTimeRange(occurrence.startMinutesFromMidnight, occurrence.durationMinutes, timeFormat);

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      const delta = Math.round(translateY.value / pixelsPerMinute);
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      if (onDragEnd) runOnJS(onDragEnd)(delta);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const widthPct = 100 / columnCount;
  const leftPct = column * widthPct;

  const body = (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          height,
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          paddingLeft: column > 0 ? 6 : 0,
          paddingRight: 4,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${occurrence.title}, ${range}${occurrence.isCompleted ? ', completed' : ''}`}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          backgroundColor: token.fill,
          paddingHorizontal: compact ? 8 : 10,
          opacity: occurrence.isCompleted ? 0.55 : 1,
          overflow: 'hidden',
        }}
      >
        {running ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.round(elapsed * 100)}%`,
              backgroundColor: token.dot,
              opacity: 0.18,
            }}
          />
        ) : null}
        <View
          style={{
            width: compact ? 22 : 28,
            height: compact ? 22 : 28,
            borderRadius: 14,
            backgroundColor: colors.surfaceRaised,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name={iconIon(occurrence.task.iconKey) as never} size={compact ? 12 : 16} color={token.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText
            numberOfLines={1}
            weight="bold"
            style={{
              fontSize: compact ? 12 : 16,
              color: token.ink,
              textDecorationLine: occurrence.isCompleted ? 'line-through' : 'none',
            }}
          >
            {occurrence.title}
          </ThemedText>
          {compact ? null : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <ThemedText numberOfLines={1} style={{ fontSize: 12, color: token.ink, opacity: 0.78 }}>
                {running ? formatRemaining(remaining) : range}
              </ThemedText>
              {occurrence.isRecurring ? (
                <Ionicons name="repeat" size={12} color={token.ink} />
              ) : null}
              {subtaskLabel ? (
                <ThemedText style={{ fontSize: 11, color: token.ink, opacity: 0.7 }}>{subtaskLabel}</ThemedText>
              ) : null}
            </View>
          )}
        </View>
        <Pressable
          onPress={onComplete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={occurrence.isCompleted ? 'Mark incomplete' : 'Mark complete'}
          style={{
            width: compact ? 22 : 28,
            height: compact ? 22 : 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: occurrence.isCompleted ? token.dot : token.ink,
            backgroundColor: occurrence.isCompleted ? token.dot : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 6,
          }}
        >
          {occurrence.isCompleted ? <Ionicons name="checkmark" size={14} color={colors.surfaceRaised} /> : null}
        </Pressable>
      </Pressable>
    </Animated.View>
  );

  return onDragEnd ? <GestureDetector gesture={pan}>{body}</GestureDetector> : body;
}
