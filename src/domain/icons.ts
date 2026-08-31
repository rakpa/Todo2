export interface IconSpec {
  key: string;
  ion: string;
  label: string;
  keywords: string[];
}

export const ICON_LIBRARY: IconSpec[] = [
  { key: 'alarm', ion: 'alarm-outline', label: 'Alarm', keywords: ['wake', 'wakeup', 'alarm', 'morning', 'rise'] },
  { key: 'sun', ion: 'sunny-outline', label: 'Sun', keywords: ['morning', 'sunrise'] },
  { key: 'book', ion: 'book-outline', label: 'Book', keywords: ['read', 'book', 'study', 'class', 'learn'] },
  { key: 'bike', ion: 'bicycle-outline', label: 'Bike', keywords: ['bike', 'cycle', 'commute', 'ride'] },
  { key: 'car', ion: 'car-outline', label: 'Car', keywords: ['drive', 'car', 'commute'] },
  { key: 'train', ion: 'train-outline', label: 'Train', keywords: ['train', 'transit', 'subway'] },
  { key: 'shower', ion: 'water-outline', label: 'Shower', keywords: ['shower', 'bath', 'wash'] },
  { key: 'meal', ion: 'restaurant-outline', label: 'Meal', keywords: ['lunch', 'dinner', 'breakfast', 'eat', 'meal', 'food'] },
  { key: 'coffee', ion: 'cafe-outline', label: 'Coffee', keywords: ['coffee', 'cafe', 'tea'] },
  { key: 'laptop', ion: 'laptop-outline', label: 'Laptop', keywords: ['work', 'deep', 'design', 'code', 'laptop', 'review', 'write'] },
  { key: 'mail', ion: 'mail-outline', label: 'Mail', keywords: ['admin', 'email', 'inbox', 'slack'] },
  { key: 'people', ion: 'people-outline', label: 'People', keywords: ['meeting', 'call', 'sync', '1:1'] },
  { key: 'fitness', ion: 'barbell-outline', label: 'Workout', keywords: ['workout', 'gym', 'lift', 'run', 'exercise'] },
  { key: 'yoga', ion: 'body-outline', label: 'Yoga', keywords: ['yoga', 'stretch', 'meditate'] },
  { key: 'moon', ion: 'moon-outline', label: 'Moon', keywords: ['sleep', 'wind', 'bed', 'night'] },
  { key: 'home', ion: 'home-outline', label: 'Home', keywords: ['home', 'chores', 'house'] },
  { key: 'walk', ion: 'walk-outline', label: 'Walk', keywords: ['walk', 'stroll'] },
  { key: 'music', ion: 'musical-notes-outline', label: 'Music', keywords: ['music', 'practice', 'piano'] },
  { key: 'heart', ion: 'heart-outline', label: 'Care', keywords: ['doctor', 'health', 'therapy'] },
  { key: 'spark', ion: 'sparkles-outline', label: 'Spark', keywords: ['plan', 'idea'] },
  { key: 'flag', ion: 'flag-outline', label: 'Flag', keywords: ['deadline', 'ship'] },
  { key: 'leaf', ion: 'leaf-outline', label: 'Leaf', keywords: ['garden', 'nature'] },
  { key: 'game', ion: 'game-controller-outline', label: 'Play', keywords: ['game', 'play'] },
  { key: 'cart', ion: 'cart-outline', label: 'Errand', keywords: ['shop', 'groceries', 'errand'] },
];

export const DEFAULT_ICON = 'spark';

export function suggestIcon(title: string): string {
  const haystack = title.toLowerCase();
  let best: { key: string; score: number } | null = null;
  for (const icon of ICON_LIBRARY) {
    for (const keyword of icon.keywords) {
      if (haystack.includes(keyword)) {
        const score = keyword.length;
        if (!best || score > best.score) best = { key: icon.key, score };
      }
    }
  }
  return best?.key ?? DEFAULT_ICON;
}

export function iconIon(key: string): string {
  return ICON_LIBRARY.find((icon) => icon.key === key)?.ion ?? 'ellipse-outline';
}

export function iconLabel(key: string): string {
  return ICON_LIBRARY.find((icon) => icon.key === key)?.label ?? 'Block';
}
