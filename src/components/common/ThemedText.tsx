import React from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { TextTones } from '../../theme/palette';

interface Props extends TextProps {
  tone?: keyof TextTones;
  weight?: 'regular' | 'bold';
  style?: StyleProp<TextStyle>;
}

export function ThemedText({ tone = 'primary', weight = 'regular', style, ...rest }: Props) {
  const { colors, fonts } = useTheme();
  const fontFamily = weight === 'bold' ? fonts.bold : fonts.regular;
  return (
    <Text
      {...rest}
      style={[
        {
          color: colors.text[tone],
          fontFamily,
          fontWeight: fontFamily ? undefined : weight === 'bold' ? '700' : '400',
        },
        style,
      ]}
    />
  );
}
