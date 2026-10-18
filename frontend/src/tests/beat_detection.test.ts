import { describe, it, expect } from 'vitest';
import { BeatDetector } from '../services/beatDetector';

describe('BeatDetector (Peak Tracking & Cut to Beat)', () => {
  it('generates accurate beat timestamps for a given BPM tempo', () => {
    // 120 BPM = 2 beats per second = every 0.5s
    const beats120 = BeatDetector.generateBeatsForBpm(120, 3.0, 0);
    expect(beats120).toEqual([0, 0.5, 1.0, 1.5, 2.0, 2.5]);

    // 60 BPM = 1 beat per second = every 1.0s
    const beats60 = BeatDetector.generateBeatsForBpm(60, 4.0, 0);
    expect(beats60).toEqual([0, 1.0, 2.0, 3.0]);
  });

  it('snaps playhead or clip boundary to closest beat within magnetic threshold', () => {
    const beats = [1.0, 2.0, 3.0, 4.0];

    // Close to 2.0 (1.95s, within 0.15 threshold)
    const snappedNear = BeatDetector.snapToBeat(1.95, beats, 0.15);
    expect(snappedNear).toBe(2.0);

    // Far from any beat (2.5s, outside 0.15 threshold)
    const snappedFar = BeatDetector.snapToBeat(2.5, beats, 0.15);
    expect(snappedFar).toBe(2.5);
  });

  it('detects peaks from synthetic audio buffer waveform', () => {
    const sampleRate = 44100;
    const duration = 2.0;
    const buffer = new Float32Array(sampleRate * duration);

    // Inject pulses at 0.5s and 1.5s
    const pulse1 = Math.floor(0.5 * sampleRate);
    const pulse2 = Math.floor(1.5 * sampleRate);

    for (let i = -500; i < 500; i++) {
      const amp = (1 - Math.abs(i) / 500) * 0.95;
      buffer[pulse1 + i] = amp;
      buffer[pulse2 + i] = amp;
    }

    const detected = BeatDetector.detectBeatsFromBuffer(buffer, sampleRate);
    expect(detected.length).toBeGreaterThanOrEqual(2);
    expect(detected.some((b) => Math.abs(b - 0.5) < 0.08)).toBe(true);
    expect(detected.some((b) => Math.abs(b - 1.5) < 0.08)).toBe(true);
  });
});
