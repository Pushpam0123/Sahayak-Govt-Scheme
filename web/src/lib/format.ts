// Small presentation helpers.

import type { Lang } from './i18n';

/** Format an integer rupee amount in the Indian numbering system. */
export function formatINR(value: number, lang: Lang = 'en'): string {
  return new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/** A stable accent index (0-4) for a category, for chart/icon colouring. */
export function categoryIndex(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return hash % 5;
}

/** Emoji glyph per known scheme category (falls back to a document icon). */
export function categoryGlyph(category: string): string {
  const map: Record<string, string> = {
    Agriculture: '🌾',
    Welfare: '🤝',
    Pension: '👵',
    Education: '📚',
    'Women & Child Development': '👶',
    Health: '🩺',
    Housing: '🏠',
    Employment: '💼',
  };
  return map[category] ?? '📄';
}
