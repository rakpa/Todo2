import type { ColorToken } from './types';

export interface TokenColors {
  fill: string;
  ink: string;
  dot: string;
}

export const LIGHT_TOKENS: Record<ColorToken, TokenColors> = {
  sage: { fill: '#D7E6DF', ink: '#1C332C', dot: '#3F7A6E' },
  sky: { fill: '#D5E4F4', ink: '#1B3348', dot: '#3D6FA3' },
  apricot: { fill: '#F4E0CE', ink: '#5A3416', dot: '#C77B45' },
  lilac: { fill: '#E5DCF2', ink: '#3A2A55', dot: '#7A62A8' },
  rose: { fill: '#F1D6D8', ink: '#5A2228', dot: '#C46B73' },
  sand: { fill: '#EDE3CF', ink: '#4A3B22', dot: '#B3945C' },
  slate: { fill: '#DDE2E9', ink: '#252A33', dot: '#5B6573' },
  mint: { fill: '#D2EEE6', ink: '#1A3D34', dot: '#3D9A84' },
};

export const DARK_TOKENS: Record<ColorToken, TokenColors> = {
  sage: { fill: '#243832', ink: '#D7EDE4', dot: '#7EC9B8' },
  sky: { fill: '#223544', ink: '#D5E7F8', dot: '#7FB0DC' },
  apricot: { fill: '#3C2C20', ink: '#F6E2D0', dot: '#E0A574' },
  lilac: { fill: '#32283F', ink: '#E8DFF6', dot: '#B49AD4' },
  rose: { fill: '#3A2427', ink: '#F6DCDF', dot: '#E39AA0' },
  sand: { fill: '#3A3326', ink: '#F1E6D0', dot: '#D2B784' },
  slate: { fill: '#2B3038', ink: '#E3E8EF', dot: '#9AA6B5' },
  mint: { fill: '#1E3A34', ink: '#D4F3EA', dot: '#74C9B4' },
};

const TOKEN_CYCLE: ColorToken[] = ['sage', 'sky', 'apricot', 'lilac', 'rose', 'sand', 'mint', 'slate'];

export function suggestColorToken(title: string): ColorToken {
  const map: Array<[RegExp, ColorToken]> = [
    [/wake|yoga|stretch|garden/i, 'mint'],
    [/shower|water|swim/i, 'sky'],
    [/commute|drive|admin/i, 'slate'],
    [/deep|design|code|work|review/i, 'sage'],
    [/lunch|dinner|breakfast|meal/i, 'apricot'],
    [/workout|gym|run/i, 'rose'],
    [/wind|sleep|night/i, 'lilac'],
  ];
  for (const [pattern, token] of map) {
    if (pattern.test(title)) return token;
  }
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash + title.charCodeAt(i) * (i + 1)) % TOKEN_CYCLE.length;
  return TOKEN_CYCLE[hash];
}

export function tokenColors(token: ColorToken, mode: 'light' | 'dark'): TokenColors {
  return (mode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS)[token];
}
