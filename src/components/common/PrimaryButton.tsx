import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from './ThemedText';

interface Props extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, variant = 'primary', style, ...rest }: Props) {
  const { colors } = useTheme();
  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.text.danger
        : variant === 'secondary'
          ? colors.chip
          : 'transparent';
  const tone = variant === 'primary' || variant === 'danger' ? 'inverse' : 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        {
          minHeight: 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          backgroundColor: background,
          opacity: pressed || rest.disabled ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <ThemedText tone={tone} weight="bold">
        {label}
      </ThemedText>
    </Pressable>
  );
}
