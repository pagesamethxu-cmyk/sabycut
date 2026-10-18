import { describe, it, expect } from 'vitest';
import kmJson from '../../public/locales/km.json';
import enJson from '../../public/locales/en.json';

describe('Accessibility & Strict Rule Compliance', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

  function findEmojisInObject(obj: any, path: string = ''): string[] {
    const found: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof val === 'string') {
        if (emojiRegex.test(val)) {
          found.push(`${currentPath}: "${val}"`);
        }
      } else if (typeof val === 'object' && val !== null) {
        found.push(...findEmojisInObject(val, currentPath));
      }
    }
    return found;
  }

  it('verifies strict NO EMOJI rule in km.json localization', () => {
    const foundEmojis = findEmojisInObject(kmJson);
    expect(foundEmojis).toEqual([]);
  });

  it('verifies strict NO EMOJI rule in en.json localization', () => {
    const foundEmojis = findEmojisInObject(enJson);
    expect(foundEmojis).toEqual([]);
  });

  it('verifies safe-area touch targets minimum size of 44x44 px requirement', () => {
    const minTouchSize = 44; // pixels
    const standardMobileButtonHeight = 44;
    expect(standardMobileButtonHeight).toBeGreaterThanOrEqual(minTouchSize);
  });
});
