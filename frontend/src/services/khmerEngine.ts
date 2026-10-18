export interface CaptionCue {
  id: string;
  start: number; // in seconds
  end: number;
  text: string;
}

export const KHMER_TEST_STRINGS: { id: number; title: string; text: string; category: string }[] = [
  { id: 1, title: 'Triple stacked consonants', text: 'ស្រ្តីខ្មែរមានភាពក្លាហាន និងឧស្សាហ៍ព្យាយាម', category: 'stacked' },
  { id: 2, title: 'Complex coeng combination', text: 'វិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យាទំនើបជឿនលឿន', category: 'stacked' },
  { id: 3, title: 'Double sub-consonant clusters', text: 'សង្គ្រាម និងសន្តិភាពក្នុងប្រវត្តិសាស្ត្រពិភពលោក', category: 'stacked' },
  { id: 4, title: 'Stacked nasal and stop', text: 'សម្បត្តិធម្មជាតិ និងរតនសម្បត្តិវប្បធម៌ខ្មែរ', category: 'stacked' },
  { id: 5, title: 'Retroflex coeng da', text: 'កណ្តុររត់កាត់វាលស្រែពេលព្រលប់', category: 'stacked' },
  { id: 6, title: 'Coeng ro with vowel signs', text: 'ប្រទេសកម្ពុជាជាទឹកដីសុវណ្ណភូមិដ៏ស្រស់បំព្រង', category: 'stacked' },
  { id: 7, title: 'Combined bantok and reahmuk', text: 'សិស្សានុសិស្សខិតខំរៀនសូត្រដើម្បីអនាគតរុងរឿង', category: 'diacritics' },
  { id: 8, title: 'Mixed Khmer and English tech terms', text: 'កាត់តវីដេអូ 4K 60FPS ដោយប្រើ AI Auto Cut Engine', category: 'mixed' },
  { id: 9, title: 'Mixed Khmer numerals and symbols', text: 'ថ្ងៃទី១៨ ខែតុលា ឆ្នាំ២០២៦ វេលាម៉ោង ២១:៣០ នាទី', category: 'mixed' },
  { id: 10, title: 'Currency and percentage mixed', text: 'តម្លៃ $150.00 បញ្ចុះតម្លៃ 25% សម្រាប់សមាជិក VIP', category: 'mixed' },
  { id: 11, title: 'Long sentence narrative part 1', text: 'ព្រះរាជាណាចក្រកម្ពុជាមានប្រាង្គប្រាសាទបុរាណរាប់ពាន់ដែលបង្កប់នូវកេរដំណែលដូនតា', category: 'long_sentence' },
  { id: 12, title: 'Long sentence narrative part 2', text: 'ការអភិវឌ្ឍន៍សេដ្ឋកិច្ចឌីជីថលទាមទារនូវការចូលរួមពីយុវជនជំនាន់ក្រោយប្រកបដោយភាពច្នៃប្រឌិត', category: 'long_sentence' },
  { id: 13, title: 'Independent vowels review', text: 'ឩបករណ៏ ឪពុក ឫស្សី ឮសូរ ឭសេចក្តី ឯករាជ្យ ឱកាស', category: 'vowels' },
  { id: 14, title: 'Bantok on stacked clusters', text: 'កុំភ័យតក់ស្លុតចំពោះឧបសគ្គដែលកើតមានឡើង', category: 'diacritics' },
  { id: 15, title: 'Robat diacritic consonant', text: 'កិច្ចការងាររដ្ឋបាលសាធារណៈ និងធម៌វិន័យ', category: 'diacritics' },
  { id: 16, title: 'Triisap and muusikatoan', text: 'ស៊ុបមាន់ក្តៅៗ ប៉ះពាល់ត្រជាក់ចិត្ត', category: 'diacritics' },
  { id: 17, title: 'Compound title hook', text: 'កម្មវិធីកាត់តវីដេអូ SABYCUT កម្រិតខ្ពស់សម្រាប់ទូរស័ព្ទ', category: 'hook' },
  { id: 18, title: 'Fast paced subtitle line', text: 'ចុច Like និង Share ដើម្បីទទួលបានគន្លឹះថ្មីៗជារៀងរាល់ថ្ងៃ!', category: 'social' },
  { id: 19, title: 'Technical render specification', text: 'នាំចេញវីដេអូកម្រិត 1080p 60fps Bitrate 12Mbps H.264', category: 'specs' },
  { id: 20, title: 'Philosophical conclusion quote', text: 'ចំណេះវិជ្ជាគឺជាទ្រព្យសម្បត្តិដែលចោរមិនអាចលួចប្លន់បានឡើយ', category: 'quote' }
];

export class KhmerEngine {
  /**
   * Word segmentation for Khmer using ICU Intl.Segmenter.
   * Ensures natural line wrapping at word boundaries without breaking subscript clusters.
   */
  public static segmentWords(text: string): string[] {
    if (!text) return [];

    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        const segmenter = new (Intl as any).Segmenter('km', { granularity: 'word' });
        const words: string[] = [];
        for (const s of segmenter.segment(text)) {
          words.push(s.segment);
        }
        return words;
      } catch {
        // Fallback below
      }
    }

    // Fallback: split by whitespace or zero-width space
    return text.split(/(\s+|\u200B)/).filter(Boolean);
  }

  /**
   * Wraps Khmer text into lines fitting within a max pixel width on an HTML5 Canvas
   */
  public static wrapKhmerText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = this.segmentWords(text);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word.trimStart();
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Parses SubRip (.srt) subtitle formatted string into structured cues
   */
  public static parseSRT(srt: string): CaptionCue[] {
    const cues: CaptionCue[] = [];
    const normalized = srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      let timeLineIdx = 1;
      if (lines[0].includes('-->')) {
        timeLineIdx = 0;
      }

      const timeLine = lines[timeLineIdx];
      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
      if (!timeMatch) continue;

      const start =
        parseInt(timeMatch[1], 10) * 3600 +
        parseInt(timeMatch[2], 10) * 60 +
        parseInt(timeMatch[3], 10) +
        parseInt(timeMatch[4], 10) / 1000;

      const end =
        parseInt(timeMatch[5], 10) * 3600 +
        parseInt(timeMatch[6], 10) * 60 +
        parseInt(timeMatch[7], 10) +
        parseInt(timeMatch[8], 10) / 1000;

      const text = lines.slice(timeLineIdx + 1).join('\n').trim();

      cues.push({
        id: `cue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        start,
        end,
        text
      });
    }

    return cues;
  }

  /**
   * Serializes cues array into standard .srt format
   */
  public static generateSRT(cues: CaptionCue[]): string {
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
      return `${h}:${m}:${s},${ms}`;
    };

    return cues
      .map((cue, idx) => {
        return `${idx + 1}\n${formatTime(cue.start)} --> ${formatTime(cue.end)}\n${cue.text}\n`;
      })
      .join('\n');
  }

  /**
   * Calculates karaoke word highlight index at given timestamp
   */
  public static getKaraokeHighlight(
    cue: CaptionCue,
    currentTime: number
  ): { activeWordIndex: number; progress: number } {
    if (currentTime < cue.start || currentTime > cue.end) {
      return { activeWordIndex: -1, progress: 0 };
    }

    const duration = cue.end - cue.start;
    if (duration <= 0) return { activeWordIndex: 0, progress: 1 };

    const words = this.segmentWords(cue.text).filter((w) => w.trim().length > 0);
    if (words.length === 0) return { activeWordIndex: -1, progress: 0 };

    const elapsed = currentTime - cue.start;
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

    return { activeWordIndex, progress };
  }
}
