import { KeyframeTrack, KeyframePoint } from '../types/timeline';

export class KeyframeEngine {
  /**
   * Evaluates keyframed value at a normalized timestamp (0 to 1).
   */
  public static evaluate(track: KeyframeTrack, time: number, defaultValue: number): number {
    if (!track.points || track.points.length === 0) {
      return defaultValue;
    }

    const sorted = [...track.points].sort((a, b) => a.time - b.time);

    // If time is before first point
    if (time <= sorted[0].time) {
      return sorted[0].value;
    }

    // If time is after last point
    if (time >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].value;
    }

    // Find bounding keyframe points
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];

      if (time >= p1.time && time <= p2.time) {
        const span = p2.time - p1.time;
        if (span <= 0) return p1.value;

        const t = (time - p1.time) / span;
        const easedT = this.applyEasing(t, p2.easing || 'linear');
        return p1.value + (p2.value - p1.value) * easedT;
      }
    }

    return defaultValue;
  }

  public static applyEasing(t: number, easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'linear':
      default:
        return t;
    }
  }

  /**
   * Adds or updates a keyframe point on a track
   */
  public static setKeyframe(track: KeyframeTrack, time: number, value: number, easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'linear') {
    const existing = track.points.find((p) => Math.abs(p.time - time) < 0.01);
    if (existing) {
      existing.value = value;
      existing.easing = easing;
    } else {
      track.points.push({ time, value, easing });
      track.points.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Removes keyframe near timestamp
   */
  public static removeKeyframe(track: KeyframeTrack, time: number): boolean {
    const initialLen = track.points.length;
    track.points = track.points.filter((p) => Math.abs(p.time - time) >= 0.01);
    return track.points.length < initialLen;
  }
}
