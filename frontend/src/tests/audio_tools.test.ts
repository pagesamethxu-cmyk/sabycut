import { describe, it, expect } from 'vitest';
import { AudioEngine } from '../services/audioEngine';
import { TimelineClip, TimelineTrack, createDefaultTransform } from '../types/timeline';

describe('AudioEngine (Volume, Ducking, Keyframes & Fades)', () => {
  it('applies fade-in and fade-out to clip gain correctly', () => {
    const clip: TimelineClip = {
      id: 'clip-audio-fade',
      trackId: 'track-m1',
      title: 'Music Track',
      type: 'music',
      start: 0,
      end: 10,
      inPoint: 0,
      outPoint: 10,
      duration: 10,
      speed: 1,
      volume: 100,
      fadeIn: 2.0, // 2s fade in
      fadeOut: 2.0, // 2s fade out
      pan: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    // At t=0s, gain should be 0
    const at0 = AudioEngine.evaluateClipAudio(clip, 0, false);
    expect(at0.gain).toBeCloseTo(0);

    // At t=1s (halfway through 2s fade in), gain should be 0.5
    const at1 = AudioEngine.evaluateClipAudio(clip, 1.0, false);
    expect(at1.gain).toBeCloseTo(0.5);

    // At t=5s (middle), gain should be full 1.0
    const at5 = AudioEngine.evaluateClipAudio(clip, 5.0, false);
    expect(at5.gain).toBeCloseTo(1.0);

    // At t=9s (halfway through 2s fade out), gain should be 0.5
    const at9 = AudioEngine.evaluateClipAudio(clip, 9.0, false);
    expect(at9.gain).toBeCloseTo(0.5);

    // At t=10s, gain should be 0
    const at10 = AudioEngine.evaluateClipAudio(clip, 10.0, false);
    expect(at10.gain).toBeCloseTo(0);
  });

  it('calculates dynamic ducking attenuation when voiceover is active', () => {
    const tracks: TimelineTrack[] = [
      { id: 'track-vo', type: 'voiceover', name: 'Voiceover', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
      { id: 'track-m1', type: 'music', name: 'Music', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 }
    ];

    const voiceoverClip: TimelineClip = {
      id: 'vo-clip-1',
      trackId: 'track-vo',
      title: 'Speech',
      type: 'voiceover',
      start: 3.0,
      end: 8.0,
      inPoint: 0,
      outPoint: 5.0,
      duration: 5.0,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    // Before speech (t=1s): normal gain factor 1.0
    const duckFactorBefore = AudioEngine.calculateDuckingGain(1.0, [voiceoverClip], tracks);
    expect(duckFactorBefore).toBe(1.0);

    // During speech (t=5s): ducked gain factor 0.3
    const duckFactorDuring = AudioEngine.calculateDuckingGain(5.0, [voiceoverClip], tracks);
    expect(duckFactorDuring).toBe(0.3);

    // After speech (t=9s): normal gain factor 1.0
    const duckFactorAfter = AudioEngine.calculateDuckingGain(9.0, [voiceoverClip], tracks);
    expect(duckFactorAfter).toBe(1.0);
  });

  it('evaluates stereo panning and volume keyframes', () => {
    const clip: TimelineClip = {
      id: 'clip-pan-kf',
      trackId: 'track-a1',
      title: 'SFX Pan',
      type: 'sfx',
      start: 0,
      end: 4,
      inPoint: 0,
      outPoint: 4,
      duration: 4,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      pan: -0.8, // Left pan
      keyframes: [
        {
          property: 'volume',
          points: [
            { time: 0.0, value: 20 },
            { time: 1.0, value: 100 }
          ]
        }
      ],
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    const midAudio = AudioEngine.evaluateClipAudio(clip, 2.0, false);
    expect(midAudio.pan).toBe(-0.8);
    // normTime at t=2 is 0.5 -> volume is 60 -> gain is 0.6
    expect(midAudio.gain).toBeCloseTo(0.6);
  });
});
