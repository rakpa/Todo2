import React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  size?: number;
  accessibilityLabel?: string;
}

export function AppMark({ size = 88, accessibilityLabel = 'Dayline' }: Props) {
  const { colors, mode } = useTheme();
  const spine = colors.accent;
  const top = mode === 'dark' ? '#E0A574' : '#E0A06A';
  const mid = mode === 'dark' ? '#7EC9B8' : '#6FA08F';
  const bot = mode === 'dark' ? '#8EB0D0' : '#8AA3C2';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Line x1="38" y1="12" x2="38" y2="88" stroke={spine} strokeWidth="3.5" strokeLinecap="round" />
      <Rect x="38" y="16" width="28" height="14" rx="7" fill={top} />
      <Rect x="38" y="36" width="42" height="28" rx="14" fill={mid} />
      <Rect x="38" y="70" width="34" height="18" rx="9" fill={bot} />
    </Svg>
  );
}
