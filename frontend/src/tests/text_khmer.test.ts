import { describe, it, expect } from 'vitest';
import { KhmerEngine, KHMER_TEST_STRINGS, CaptionCue } from '../services/khmerEngine';

describe('KhmerEngine & Typography Verification', () => {
  it('contains at least 20 complex Khmer linguistic test strings', () => {
    expect(KHMER_TEST_STRINGS.length).toBeGreaterThanOrEqual(20);
    expect(KHMER_TEST_STRINGS.length).toBe(20);

    // Verify categories covered
    const categories = new Set(KHMER_TEST_STRINGS.map((s) => s.category));
    expect(categories.has('stacked')).toBe(true);
    expect(categories.has('diacritics')).toBe(true);
    expect(categories.has('mixed')).toBe(true);
    expect(categories.has('long_sentence')).toBe(true);
    expect(categories.has('vowels')).toBe(true);
  });

  it('verifies that each of the 20 test strings possesses valid Unicode Khmer structures', () => {
    for (const testCase of KHMER_TEST_STRINGS) {
      expect(testCase.text).toBeTruthy();
      expect(testCase.text.length).toBeGreaterThan(5);

      // Check for Khmer Unicode range (\u1780-\u17FF)
      const hasKhmer = /[\u1780-\u17FF]/.test(testCase.text);
      expect(hasKhmer).toBe(true);

      // Test segmentation on each string
      const words = KhmerEngine.segmentWords(testCase.text);
      expect(words.length).toBeGreaterThan(0);
      expect(words.join('')).toBe(testCase.text);
    }
  });

  it('validates coeng subscript clustering in stacked consonant strings', () => {
    // String 1: ស្រ្តី (contains coeng ro \u17D2\u179order + coeng ta \u17D2\u178F)
    const string1 = KHMER_TEST_STRINGS[0];
    expect(string1.text).toContain('ស្រ្តី');
    expect(string1.text.includes('\u17D2')).toBe(true); // Khmer sign coeng

    // String 2: វិទ្យាសាស្ត្រ (science - multiple coeng sequences)
    const string2 = KHMER_TEST_STRINGS[1];
    expect(string2.text).toContain('វិទ្យាសាស្ត្រ');

    // String 5: កណ្តុរ (retroflex coeng da)
    const string5 = KHMER_TEST_STRINGS[4];
    expect(string5.text).toContain('កណ្តុរ');
  });

  it('parses and generates standard SubRip (.srt) subtitle format', () => {
    const mockSrt = `1
00:00:01,000 --> 00:00:04,500
ស្វាគមន៍មកកាន់ SABYCUT

2
00:00:05,000 --> 00:00:09,000
កាត់តវីដេអូកម្រិតខ្ពស់ដោយ AI`;

    const parsed = KhmerEngine.parseSRT(mockSrt);
    expect(parsed.length).toBe(2);
    expect(parsed[0].start).toBe(1.0);
    expect(parsed[0].end).toBe(4.5);
    expect(parsed[0].text).toBe('ស្វាគមន៍មកកាន់ SABYCUT');
    expect(parsed[1].start).toBe(5.0);
    expect(parsed[1].end).toBe(9.0);

    // Round-trip generation
    const regenerated = KhmerEngine.generateSRT(parsed);
    expect(regenerated).toContain('00:00:01,000 --> 00:00:04,500');
    expect(regenerated).toContain('ស្វាគមន៍មកកាន់ SABYCUT');
    expect(regenerated).toContain('00:00:05,000 --> 00:00:09,000');
  });

  it('calculates karaoke word highlight timing progression accurately', () => {
    const cue: CaptionCue = {
      id: 'cue-1',
      start: 2.0,
      end: 6.0, // 4 seconds total
      text: 'កាត់ត វីដេអូ ស្វ័យប្រវត្តិ ខ្មែរ'
    };

    // Before start
    const before = KhmerEngine.getKaraokeHighlight(cue, 1.0);
    expect(before.activeWordIndex).toBe(-1);

    // Quarter way through (t=3.0s, progress 25%)
    const quarter = KhmerEngine.getKaraokeHighlight(cue, 3.0);
    expect(quarter.progress).toBeCloseTo(0.25);
    expect(quarter.activeWordIndex).toBeGreaterThanOrEqual(0);

    // Halfway through (t=4.0s, progress 50%)
    const mid = KhmerEngine.getKaraokeHighlight(cue, 4.0);
    expect(mid.progress).toBeCloseTo(0.5);

    // At end (t=6.0s)
    const end = KhmerEngine.getKaraokeHighlight(cue, 6.0);
    expect(end.progress).toBeCloseTo(1.0);
  });
});
