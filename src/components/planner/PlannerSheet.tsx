import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { plannerService, type PlannerDraftItem } from '../../domain/planner';
import { nowMinutesFromMidnight } from '../../domain/time';
import type { TimedOccurrence } from '../../domain/types';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';
import { PrimaryButton } from '../common/PrimaryButton';
import { Sheet } from '../common/Sheet';
import { ThemedText } from '../common/ThemedText';

interface Props {
  visible: boolean;
  onClose: () => void;
  occurrences: TimedOccurrence[];
}

const CHIPS = [
  'Reschedule unfinished tasks to tomorrow',
  'Plan a deep-work morning',
  'Turn this list into timed blocks',
];

export function PlannerSheet({ visible, onClose, occurrences }: Props) {
  const { colors, fonts } = useTheme();
  const selectedDate = useAppStore((s) => s.selectedDate);
  const createTask = useAppStore((s) => s.createTask);
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState<PlannerDraftItem[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async (text: string) => {
    setBusy(true);
    const items = await plannerService.plan(text, {
      date: selectedDate,
      nowMinutes: nowMinutesFromMidnight(),
      existing: occurrences,
      unfinishedTitles: occurrences.filter((item) => !item.isCompleted).map((item) => item.title),
    });
    setDraft(items);
    setBusy(false);
  };

  const accept = async () => {
    for (const item of draft) {
      await createTask(item);
    }
    setDraft([]);
    setPrompt('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} accessibilityLabel="Smart plan">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ThemedText weight="bold" style={{ fontSize: 22 }}>
          Smart plan
        </ThemedText>
        <ThemedText tone="secondary" style={{ marginTop: 6, marginBottom: 12 }}>
          Drafts never overwrite your day until you accept them.
        </ThemedText>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="What do you need to schedule?"
          placeholderTextColor={colors.text.tertiary}
          style={{ color: colors.text.primary, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 10 }}
        />
        <View style={{ gap: 8, marginVertical: 12 }}>
          {CHIPS.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => {
                setPrompt(chip);
                run(chip);
              }}
              style={{ backgroundColor: colors.chip, borderRadius: 16, padding: 12 }}
            >
              <ThemedText>{chip}</ThemedText>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label={busy ? 'Planning…' : 'Draft'} onPress={() => run(prompt)} disabled={busy || !prompt.trim()} />
        {draft.map((item, index) => (
          <View key={`${item.title}-${index}`} style={{ paddingVertical: 10 }}>
            <ThemedText weight="bold">{item.title}</ThemedText>
            <ThemedText tone="secondary">{item.reason}</ThemedText>
            <Pressable onPress={() => setDraft(draft.filter((_, i) => i !== index))}>
              <ThemedText tone="danger">Reject</ThemedText>
            </Pressable>
          </View>
        ))}
        {draft.length > 0 ? <PrimaryButton label="Accept draft" onPress={accept} style={{ marginTop: 8 }} /> : null}
      </ScrollView>
    </Sheet>
  );
}
