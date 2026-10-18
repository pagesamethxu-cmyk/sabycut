import { describe, it, expect } from 'vitest';
import { MaskEngine } from '../services/maskEngine';
import { ClipMask } from '../types/timeline';

describe('MaskEngine (Shapes & Clip Paths)', () => {
  it('returns none for unconfigured or disabled masks', () => {
    const mask: ClipMask = {
      shape: 'none',
      feather: 0,
      invert: false,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    expect(MaskEngine.getClipPath(mask, 1080, 1920)).toBe('none');
  });

  it('generates circular clip path based on canvas dimensions and position', () => {
    const mask: ClipMask = {
      shape: 'circle',
      feather: 10,
      invert: false,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    const path = MaskEngine.getClipPath(mask, 1000, 1000);
    expect(path).toContain('circle(');
    expect(path).toContain('350px at 500px 500px');
  });

  it('generates rectangle clip path with proper inset bounds', () => {
    const mask: ClipMask = {
      shape: 'rectangle',
      feather: 0,
      invert: false,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    const path = MaskEngine.getClipPath(mask, 1000, 1000);
    expect(path).toContain('inset(');
    expect(path).toContain('round 8px');
  });

  it('generates heart and star polygon paths', () => {
    const heartMask: ClipMask = {
      shape: 'heart',
      feather: 0,
      invert: false,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    expect(MaskEngine.getClipPath(heartMask, 1000, 1000)).toContain('polygon(');

    const starMask: ClipMask = {
      shape: 'star',
      feather: 0,
      invert: false,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    expect(MaskEngine.getClipPath(starMask, 1000, 1000)).toContain('polygon(');
  });
});
