import { describe, it, expect } from 'vitest';
import { KeyframeEngine } from '../services/keyframeEngine';
import { KeyframeTrack } from '../types/timeline';

describe('KeyframeEngine (Interpolation & Easing)', () => {
  it('interpolates linearly between keyframe points', () => {
    const track: KeyframeTrack = {
      property: 'scale',
      points: [
        { time: 0.0, value: 100, easing: 'linear' },
        { time: 1.0, value: 200, easing: 'linear' }
      ]
    };

    expect(KeyframeEngine.evaluate(track, 0.0, 100)).toBe(100);
    expect(KeyframeEngine.evaluate(track, 0.5, 100)).toBe(150);
    expect(KeyframeEngine.evaluate(track, 1.0, 100)).toBe(200);
  });

  it('clamps values before first keyframe and after last keyframe', () => {
    const track: KeyframeTrack = {
      property: 'opacity',
      points: [
        { time: 0.2, value: 50 },
        { time: 0.8, value: 100 }
      ]
    };

    expect(KeyframeEngine.evaluate(track, 0.1, 0)).toBe(50);
    expect(KeyframeEngine.evaluate(track, 0.9, 0)).toBe(100);
  });

  it('applies ease-in, ease-out, and ease-in-out easing curves', () => {
    // Ease-in curves stay lower initially: t^2 at 0.5 is 0.25
    const easeInVal = KeyframeEngine.applyEasing(0.5, 'easeIn');
    expect(easeInVal).toBe(0.25);

    // Ease-out curves rise faster initially: 0.5 * (2 - 0.5) is 0.75
    const easeOutVal = KeyframeEngine.applyEasing(0.5, 'easeOut');
    expect(easeOutVal).toBe(0.75);

    // Ease-in-out symmetric at midpoint
    const easeInOutMid = KeyframeEngine.applyEasing(0.5, 'easeInOut');
    expect(easeInOutMid).toBe(0.5);
  });

  it('adds, updates and removes keyframes dynamically', () => {
    const track: KeyframeTrack = {
      property: 'volume',
      points: [{ time: 0, value: 100 }]
    };

    KeyframeEngine.setKeyframe(track, 0.5, 50, 'easeOut');
    expect(track.points.length).toBe(2);
    expect(track.points[1].value).toBe(50);

    // Update existing
    KeyframeEngine.setKeyframe(track, 0.5, 75, 'easeInOut');
    expect(track.points.length).toBe(2);
    expect(track.points[1].value).toBe(75);

    // Remove
    const removed = KeyframeEngine.removeKeyframe(track, 0.5);
    expect(removed).toBe(true);
    expect(track.points.length).toBe(1);
  });
});
