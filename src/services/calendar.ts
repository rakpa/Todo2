export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startMinutesFromMidnight: number;
  durationMinutes: number;
}

export interface CalendarService {
  available: boolean;
  requestAccess(): Promise<boolean>;
  readRange(fromDate: string, toDate: string): Promise<CalendarEvent[]>;
}

export const placeholderCalendar: CalendarService = {
  available: false,
  async requestAccess() {
    return false;
  },
  async readRange() {
    return [];
  },
};
