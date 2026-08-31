export interface SyncService {
  enabled: boolean;
  push(): Promise<void>;
  pull(): Promise<void>;
}

export const localOnlySync: SyncService = {
  enabled: false,
  async push() {},
  async pull() {},
};
