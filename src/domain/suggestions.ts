export function titleSuggestions(
  query: string,
  recentTitles: string[],
  inboxTitles: string[],
  hidden: boolean,
): string[] {
  if (hidden || query.trim().length === 0) return [];
  const needle = query.trim().toLowerCase();
  const pool = [...recentTitles, ...inboxTitles];
  const unique: string[] = [];
  for (const title of pool) {
    if (!title.toLowerCase().includes(needle)) continue;
    if (title.toLowerCase() === needle) continue;
    if (!unique.includes(title)) unique.push(title);
    if (unique.length >= 5) break;
  }
  return unique;
}
