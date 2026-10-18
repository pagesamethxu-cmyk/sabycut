export type SupportedLanguage = 'km' | 'en';

let currentLanguage: SupportedLanguage = 'km';
let translations: Record<string, unknown> = {};

export async function initI18n(lang: SupportedLanguage = 'km'): Promise<void> {
  currentLanguage = lang;
  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
    translations = await res.json();
    document.documentElement.lang = lang;
  } catch (err) {
    console.error('Failed to load locale:', err);
  }
}

export function setLanguage(lang: SupportedLanguage): Promise<void> {
  localStorage.setItem('sabycut_lang', lang);
  return initI18n(lang);
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function t(keyPath: string, fallback?: string): string {
  const parts = keyPath.split('.');
  let current: unknown = translations;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return fallback || keyPath;
    }
  }

  return typeof current === 'string' ? current : fallback || keyPath;
}

// ICU Word Segmenter helper for Khmer text line wrapping
export function segmentKhmerText(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new (Intl as unknown as { Segmenter: new (lang: string, options: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter('km', { granularity: 'word' });
    const segments: string[] = [];
    for (const seg of segmenter.segment(text)) {
      segments.push(seg.segment);
    }
    return segments;
  }
  return text.split(/(\s+)/);
}
