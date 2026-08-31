export interface TextTones {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  accent: string;
  danger: string;
}

export interface Palette {
  background: string;
  surface: string;
  surfaceRaised: string;
  spine: string;
  hairline: string;
  overlay: string;
  accent: string;
  accentSoft: string;
  now: string;
  nowSoft: string;
  ring: string;
  ringFill: string;
  fab: string;
  fabGlyph: string;
  chip: string;
  text: TextTones;
}

export const lightPalette: Palette = {
  background: '#F5F2EA',
  surface: '#FFFCFA',
  surfaceRaised: '#FFFFFF',
  spine: '#C9C2B6',
  hairline: '#E7E0D4',
  overlay: 'rgba(28, 25, 21, 0.45)',
  accent: '#2F6F6A',
  accentSoft: '#E3F0ED',
  now: '#C45C3E',
  nowSoft: 'rgba(196, 92, 62, 0.16)',
  ring: '#C8C0B4',
  ringFill: '#2F6F6A',
  fab: '#1F3F3C',
  fabGlyph: '#F4F0E8',
  chip: '#EBE4D8',
  text: {
    primary: '#1C1915',
    secondary: '#5C564E',
    tertiary: '#8A8378',
    inverse: '#F4F0E8',
    accent: '#245E59',
    danger: '#9B2C2C',
  },
};

export const darkPalette: Palette = {
  background: '#12110F',
  surface: '#1C1B18',
  surfaceRaised: '#26251F',
  spine: '#3A372F',
  hairline: '#2F2C26',
  overlay: 'rgba(8, 7, 6, 0.62)',
  accent: '#7EC9C2',
  accentSoft: '#1E3331',
  now: '#E08A72',
  nowSoft: 'rgba(224, 138, 114, 0.18)',
  ring: '#5A554C',
  ringFill: '#7EC9C2',
  fab: '#E8E2D6',
  fabGlyph: '#1C1915',
  chip: '#2A2823',
  text: {
    primary: '#F4F0EA',
    secondary: '#B8B1A6',
    tertiary: '#8A8378',
    inverse: '#1C1915',
    accent: '#9ED9D3',
    danger: '#F0A0A0',
  },
};
