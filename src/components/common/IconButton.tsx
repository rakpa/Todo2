import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from './ThemedText';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  badge?: number;
  style?: StyleProp<ViewStyle>;
  size?: number;
  tone?: 'primary' | 'secondary';
}

export function IconButton({ name, label, onPress, badge, style, size = 22, tone = 'primary' }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} items` : label}
      hitSlop={10}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={tone === 'secondary' ? colors.text.secondary : colors.text.primary} />
      {badge && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <ThemedText tone="inverse" style={{ fontSize: 9, fontWeight: '700' }}>
            {badge > 9 ? '9+' : String(badge)}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
