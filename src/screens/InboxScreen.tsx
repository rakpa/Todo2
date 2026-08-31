import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../app/navigation/types';
import { formatDuration } from '../domain/time';
import { iconIon } from '../domain/icons';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import { EditorSheet } from '../components/editor/EditorSheet';
import { IconButton } from '../components/common/IconButton';
import { FAB } from '../components/common/FAB';
import { ThemedText } from '../components/common/ThemedText';

export function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tasks = useAppStore((s) => s.tasks).filter((task) => task.isInbox);
  const createTask = useAppStore((s) => s.createTask);
  const [quick, setQuick] = useState('');
  const [editing, setEditing] = useState<string | null | undefined>(undefined);

  const capture = async () => {
    if (!quick.trim()) return;
    await createTask({ title: quick.trim(), durationMinutes: 30, isInbox: true });
    setQuick('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <IconButton name="chevron-back" label="Back" onPress={() => navigation.goBack()} />
        <ThemedText weight="bold" style={{ fontSize: 22, flex: 1 }}>
          Inbox
        </ThemedText>
      </View>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={quick}
          onChangeText={setQuick}
          placeholder="Capture without a time"
          placeholderTextColor={colors.text.tertiary}
          onSubmitEditing={capture}
          style={{ flex: 1, color: colors.text.primary, fontSize: 16, minHeight: 44 }}
        />
        <Pressable onPress={capture} accessibilityLabel="Save to inbox" style={{ minHeight: 44, justifyContent: 'center' }}>
          <ThemedText tone="accent">Add</ThemedText>
        </Pressable>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
        ListEmptyComponent={<ThemedText tone="secondary">A holding pen for ideas. Schedule them onto the spine when you’re ready.</ThemedText>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setEditing(item.id)}
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 12 }}
          >
            <Ionicons name={iconIon(item.iconKey) as never} size={20} color={colors.text.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText weight="bold">{item.title}</ThemedText>
              <ThemedText tone="tertiary">{formatDuration(item.durationMinutes)} est.</ThemedText>
            </View>
            <ThemedText tone="accent">Schedule</ThemedText>
          </Pressable>
        )}
      />
      <FAB onPress={() => setEditing(null)} label="Capture inbox item" />
      <EditorSheet
        visible={editing !== undefined}
        taskId={editing ?? undefined}
        inboxMode
        onClose={() => setEditing(undefined)}
      />
    </View>
  );
}
