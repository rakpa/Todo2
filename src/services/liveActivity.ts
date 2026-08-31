export interface LiveActivityBridge {
  available: boolean;
  start(title: string, remainingSeconds: number): Promise<void>;
  update(remainingSeconds: number): Promise<void>;
  end(): Promise<void>;
}

export const stubLiveActivity: LiveActivityBridge = {
  available: false,
  async start() {},
  async update() {},
  async end() {},
};
