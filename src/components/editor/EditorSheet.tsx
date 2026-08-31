import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { COLOR_TOKENS, DURATION_PRESETS, type ColorToken, type RecurrenceRule, type Task } from '../../domain/types';
import { suggestColorToken, tokenColors } from '../../domain/colorTokens';
import { ICON_LIBRARY, suggestIcon } from '../../domain/icons';
import { createId } from '../../domain/ids';
import { parseNaturalLanguage } from '../../domain/nlp';
import { titleSuggestions } from '../../domain/suggestions';
import { addDaysKey, formatClock, parseDateKey, sanitizeTitle } from '../../domain/time';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';
import { PrimaryButton } from '../common/PrimaryButton';
import { Sheet } from '../common/Sheet';
import { ThemedText } from '../common/ThemedText';

interface Props {
  visible: boolean;
  taskId?: string | null;
  presetDate?: string;
  presetStart?: number | null;
  inboxMode?: boolean;
  onClose: () => void;
}

export function EditorSheet({ visible, taskId, presetDate, presetStart, inboxMode, onClose }: Props) {
  const { colors, mode, fonts } = useTheme();
  const tasks = useAppStore((state) => state.tasks);
  const settings = useAppStore((state) => state.settings);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const createTask = useAppStore((state) => state.createTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const duplicateTask = useAppStore((state) => state.duplicateTask);
  const moveToInbox = useAppStore((state) => state.moveToInbox);
  const existing = tasks.find((task) => task.id === taskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(settings.defaultDurationMinutes);
  const [start, setStart] = useState(presetStart ?? 9 * 60);
  const [date, setDate] = useState(presetDate ?? selectedDate);
  const [iconKey, setIconKey] = useState('spark');
  const [colorToken, setColorToken] = useState<ColorToken>('sage');
  const [isInbox, setIsInbox] = useState(Boolean(inboxMode));
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ kind: 'none' });
  const [reminderKind, setReminderKind] = useState(settings.defaultReminder.kind);
  const [subtasks, setSubtasks] = useState<Task['subtasks']>([]);
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!visible) return;
    const source = existing;
    setTitle(source?.title ?? '');
    setNotes(source?.notes ?? '');
    setDuration(source?.durationMinutes ?? settings.defaultDurationMinutes);
    setStart(source?.startMinutesFromMidnight ?? presetStart ?? 9 * 60);
    setDate(source?.date ?? presetDate ?? selectedDate);
    setIconKey(source?.iconKey ?? 'spark');
    setColorToken(source?.colorToken ?? 'sage');
    setIsInbox(source?.isInbox ?? Boolean(inboxMode));
    setIsAllDay(source?.isAllDay ?? false);
    setLocation(source?.location ?? '');
    setRecurrence(source?.recurrenceRule ?? { kind: 'none' });
    setReminderKind(source?.reminders[0]?.kind ?? settings.defaultReminder.kind);
    setSubtasks(source?.subtasks ?? []);
    setDirty(false);
    setAdvanced(false);
  }, [visible, existing, inboxMode, presetDate, presetStart, selectedDate, settings.defaultDurationMinutes, settings.defaultReminder.kind]);

  const suggestions = useMemo(
    () =>
      titleSuggestions(
        title,
        tasks.map((task) => task.title),
        tasks.filter((task) => task.isInbox).map((task) => task.title),
        settings.suggestionHistoryHidden,
      ),
    [title, tasks, settings.suggestionHistoryHidden],
  );

  const onTitleChange = (value: string) => {
    setTitle(value);
    setDirty(true);
    const parsed = parseNaturalLanguage(value);
    if (!existing) {
      setIconKey(suggestIcon(parsed.title || value));
      setColorToken(suggestColorToken(parsed.title || value));
    }
    if (parsed.durationMinutes) setDuration(parsed.durationMinutes);
    if (parsed.startMinutesFromMidnight != null) {
      setStart(parsed.startMinutesFromMidnight);
      setIsInbox(false);
    }
    if (parsed.recurrenceRule) setRecurrence(parsed.recurrenceRule);
    if (parsed.dateOffsetDays) setDate(addDaysKey(selectedDate, parsed.dateOffsetDays));
  };

  const persist = async () => {
    const payload = {
      title: sanitizeTitle(title),
      notes,
      durationMinutes: duration,
      startMinutesFromMidnight: isInbox || isAllDay ? null : start,
      date: isInbox ? null : date,
      iconKey,
      colorToken,
      isInbox,
      isAllDay,
      location: location || null,
      recurrenceRule: recurrence,
      subtasks,
      reminders:
        reminderKind === 'off'
          ? []
          : [{ id: createId(), kind: reminderKind, minutesBefore: reminderKind === 'minutes_before' ? 10 : undefined }],
    };
    if (existing) await updateTask(existing.id, payload);
    else await createTask(payload);
    setDirty(false);
    onClose();
  };

  const requestClose = () => {
    if (!dirty) {
      onClose();
      return;
    }
    if (Platform.OS === 'web') {
      const ok = globalThis.confirm?.('Discard unsaved edits?');
      if (ok) onClose();
      return;
    }
    Alert.alert('Discard edits?', 'Your changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  };

  const clockDate = parseDateKey(date);
  clockDate.setHours(Math.floor(start / 60), start % 60, 0, 0);

  return (
    <Sheet visible={visible} onClose={requestClose} accessibilityLabel="Task editor">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <ThemedText weight="bold" style={{ fontSize: 22, marginBottom: 12 }}>
          {existing ? 'Edit block' : isInbox ? 'Capture' : 'New block'}
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder="What are you doing?"
          placeholderTextColor={colors.text.tertiary}
          accessibilityLabel="Title"
          style={{
            fontSize: 20,
            color: colors.text.primary,
            fontFamily: fonts.regular,
            paddingVertical: 10,
          }}
        />
        {suggestions.map((item) => (
          <Pressable key={item} onPress={() => onTitleChange(item)} accessibilityRole="button">
            <ThemedText tone="secondary" style={{ paddingVertical: 6 }}>
              {item}
            </ThemedText>
          </Pressable>
        ))}

        <ThemedText tone="secondary" style={{ marginTop: 8, marginBottom: 8 }}>
          How long
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DURATION_PRESETS.map((minutes) => (
            <Pressable
              key={minutes}
              onPress={() => {
                setDuration(minutes);
                setDirty(true);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: duration === minutes }}
              style={{
                paddingHorizontal: 12,
                height: 36,
                borderRadius: 18,
                backgroundColor: duration === minutes ? colors.accent : colors.chip,
                justifyContent: 'center',
              }}
            >
              <ThemedText tone={duration === minutes ? 'inverse' : 'primary'}>
                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Pressable
            onPress={() => setPicker('date')}
            style={{ flex: 1, backgroundColor: colors.chip, borderRadius: 14, padding: 12 }}
          >
            <ThemedText tone="tertiary" style={{ fontSize: 12 }}>When</ThemedText>
            <ThemedText weight="bold">{date}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setPicker('time')}
            disabled={isInbox || isAllDay}
            style={{ flex: 1, backgroundColor: colors.chip, borderRadius: 14, padding: 12, opacity: isInbox || isAllDay ? 0.5 : 1 }}
          >
            <ThemedText tone="tertiary" style={{ fontSize: 12 }}>Start</ThemedText>
            <ThemedText weight="bold">{formatClock(start, settings.timeFormat)}</ThemedText>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => {
              setDate(addDaysKey(date, -1));
              setDirty(true);
            }}
            accessibilityLabel="Previous day"
            style={{ backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}
          >
            <ThemedText>Yesterday</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              setDate(addDaysKey(date, 1));
              setDirty(true);
            }}
            accessibilityLabel="Next day"
            style={{ backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}
          >
            <ThemedText>Tomorrow</ThemedText>
          </Pressable>
          {[start - 15, start, start + 15].filter((value, index, all) => all.indexOf(value) === index).map((value) => (
            <Pressable
              key={`nudge-${value}`}
              onPress={() => {
                setStart(Math.max(0, Math.min(24 * 60 - 15, value === start ? start : value)));
                setIsInbox(false);
                setDirty(true);
              }}
              style={{ backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}
            >
              <ThemedText>{value === start ? 'Keep' : formatClock(Math.max(0, value), settings.timeFormat)}</ThemedText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setStart(Math.max(0, start - 15));
              setDirty(true);
              setIsInbox(false);
            }}
            accessibilityLabel="Start 15 minutes earlier"
            style={{ backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}
          >
            <ThemedText>−15m</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              setStart(Math.min(24 * 60 - 15, start + 15));
              setDirty(true);
              setIsInbox(false);
            }}
            accessibilityLabel="Start 15 minutes later"
            style={{ backgroundColor: colors.chip, borderRadius: 14, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}
          >
            <ThemedText>+15m</ThemedText>
          </Pressable>
        </View>
        {picker && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={clockDate}
            mode={picker}
            display="spinner"
            onChange={(_, next) => {
              if (!next) return;
              setDirty(true);
              if (picker === 'date') {
                const y = next.getFullYear();
                const m = `${next.getMonth() + 1}`.padStart(2, '0');
                const d = `${next.getDate()}`.padStart(2, '0');
                setDate(`${y}-${m}-${d}`);
              } else {
                setStart(next.getHours() * 60 + next.getMinutes());
                setIsInbox(false);
              }
            }}
          />
        ) : null}

        <ThemedText tone="secondary" style={{ marginTop: 16, marginBottom: 8 }}>Color</ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {COLOR_TOKENS.map((token) => (
            <Pressable
              key={token}
              onPress={() => {
                setColorToken(token);
                setDirty(true);
              }}
              accessibilityLabel={`Color ${token}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: tokenColors(token, mode).dot,
                borderWidth: colorToken === token ? 3 : 0,
                borderColor: colors.text.primary,
              }}
            />
          ))}
        </View>

        <Pressable onPress={() => setAdvanced((value) => !value)} style={{ marginTop: 18, minHeight: 44, justifyContent: 'center' }}>
          <ThemedText tone="accent">{advanced ? 'Hide details' : 'More options'}</ThemedText>
        </Pressable>

        {advanced ? (
          <View>
            <ThemedText tone="secondary" style={{ marginBottom: 8 }}>Icon</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ICON_LIBRARY.map((icon) => (
                <Pressable
                  key={icon.key}
                  onPress={() => {
                    setIconKey(icon.key);
                    setDirty(true);
                  }}
                  accessibilityLabel={icon.label}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: iconKey === icon.key ? colors.accentSoft : colors.chip,
                  }}
                >
                  <Ionicons name={icon.ion as never} size={20} color={colors.text.primary} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={notes}
              onChangeText={(value) => {
                setNotes(value);
                setDirty(true);
              }}
              placeholder="Notes"
              placeholderTextColor={colors.text.tertiary}
              multiline
              style={{ marginTop: 12, minHeight: 72, color: colors.text.primary, fontFamily: fonts.regular }}
            />
            <TextInput
              value={location}
              onChangeText={(value) => {
                setLocation(value);
                setDirty(true);
              }}
              placeholder="Location"
              placeholderTextColor={colors.text.tertiary}
              style={{ marginTop: 8, color: colors.text.primary, fontFamily: fonts.regular }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <ThemedText>All day</ThemedText>
              <Switch value={isAllDay} onValueChange={setIsAllDay} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <ThemedText>Keep in Inbox</ThemedText>
              <Switch value={isInbox} onValueChange={setIsInbox} />
            </View>
            <ThemedText tone="secondary" style={{ marginTop: 12 }}>Repeat</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {(['none', 'daily', 'weekdays', 'weekly'] as const).map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => setRecurrence(kind === 'weekly' ? { kind, days: [1, 2, 3, 4, 5] } : { kind })}
                  style={{
                    paddingHorizontal: 12,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: recurrence.kind === kind ? colors.accent : colors.chip,
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText tone={recurrence.kind === kind ? 'inverse' : 'primary'}>{kind}</ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText tone="secondary" style={{ marginTop: 12 }}>Reminder</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {(['off', 'at_start', 'minutes_before'] as const).map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => setReminderKind(kind)}
                  style={{
                    paddingHorizontal: 12,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: reminderKind === kind ? colors.accent : colors.chip,
                    justifyContent: 'center',
                  }}
                >
                  <ThemedText tone={reminderKind === kind ? 'inverse' : 'primary'}>
                    {kind === 'minutes_before' ? '10 min before' : kind.replace('_', ' ')}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText tone="secondary" style={{ marginTop: 12 }}>Subtasks</ThemedText>
            {subtasks.map((item, index) => (
              <TextInput
                key={item.id}
                value={item.title}
                onChangeText={(value) => {
                  const next = [...subtasks];
                  next[index] = { ...item, title: value };
                  setSubtasks(next);
                  setDirty(true);
                }}
                style={{ color: colors.text.primary, fontFamily: fonts.regular, paddingVertical: 8 }}
              />
            ))}
            <Pressable
              onPress={() => setSubtasks([...subtasks, { id: createId(), title: '', isCompleted: false }])}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <ThemedText tone="accent">Add subtask</ThemedText>
            </Pressable>
          </View>
        ) : null}

        <PrimaryButton label="Save" onPress={persist} style={{ marginTop: 16 }} />
        {existing ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <PrimaryButton label="Duplicate" variant="secondary" onPress={() => duplicateTask(existing.id).then(onClose)} />
            <PrimaryButton label="Move to Inbox" variant="secondary" onPress={() => moveToInbox(existing.id).then(onClose)} />
            <PrimaryButton
              label="Delete"
              variant="danger"
              onPress={() => deleteTask(existing.id).then(onClose)}
            />
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
