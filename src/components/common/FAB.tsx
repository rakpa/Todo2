import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label = 'Add a block' }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        position: 'absolute',
        right: 20,
        bottom: Math.max(insets.bottom, 12) + 8,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.fab,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        shadowColor: colors.text.primary,
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      })}
    >
      <Ionicons name="add" size={30} color={colors.fabGlyph} />
    </Pressable>
  );
}
