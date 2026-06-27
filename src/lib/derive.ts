import type { Visit } from '../db/db';

/** 訪問を日付昇順に並べる */
export function sortByDate(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => a.visitedOn.localeCompare(b.visitedOn));
}

/** 2つの日付（YYYY-MM-DD）の差を日数で返す */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 前回からの間隔を人が読みやすいラベルにする */
export function intervalLabel(days: number): string {
  if (days <= 0) return '同日';
  if (days < 31) return `${days}日ぶり`;
  if (days < 365) return `約${Math.round(days / 30)}ヶ月ぶり`;
  const years = days / 365;
  return years < 10 ? `約${years.toFixed(1)}年ぶり` : `約${Math.round(years)}年ぶり`;
}
