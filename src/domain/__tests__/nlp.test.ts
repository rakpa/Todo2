import { parseNaturalLanguage } from '../nlp';

describe('natural language capture', () => {
  test('parses title, time, duration, and weekday repeat', () => {
    const parsed = parseNaturalLanguage('Deep work 90 minutes at 9am every weekday');
    expect(parsed.title.toLowerCase()).toContain('deep work');
    expect(parsed.durationMinutes).toBe(90);
    expect(parsed.startMinutesFromMidnight).toBe(9 * 60);
    expect(parsed.recurrenceRule).toEqual({ kind: 'weekdays' });
  });

  test('parses 2h and 2pm', () => {
    const parsed = parseNaturalLanguage('Design review 2h at 2pm');
    expect(parsed.durationMinutes).toBe(120);
    expect(parsed.startMinutesFromMidnight).toBe(14 * 60);
  });

  test('understands tomorrow offset', () => {
    expect(parseNaturalLanguage('Yoga tomorrow 30m').dateOffsetDays).toBe(1);
  });
});
