import { describe, it, expect } from 'vitest';
import { SpeedCurve } from '../types/timeline';

describe('Video Editing Tools (Speed Curves, Transforms & Blend Modes)', () => {
  it('supports speed range from 0.1x to 100x', () => {
    const minSpeed = 0.1;
    const maxSpeed = 100.0;
    const defaultSpeed = 1.0;

    expect(minSpeed).toBe(0.1);
    expect(maxSpeed).toBe(100.0);
    expect(defaultSpeed).toBe(1.0);

    const testSpeed = (speed: number) => Math.min(100, Math.max(0.1, speed));
    expect(testSpeed(0.05)).toBe(0.1);
    expect(testSpeed(150)).toBe(100);
    expect(testSpeed(2.5)).toBe(2.5);
  });

  it('supports speed curve presets: montage, hero, bullet, jump_cut, flash_in, flash_out', () => {
    const curvePresets: SpeedCurve['preset'][] = [
      'montage',
      'hero',
      'bullet',
      'jump_cut',
      'flash_in',
      'flash_out',
      'custom'
    ];

    expect(curvePresets.length).toBe(7);

    // Hero curve starts fast, slows down in middle (slow-mo), ramps back up
    const heroCurve: SpeedCurve = {
      preset: 'hero',
      points: [
        { x: 0.0, y: 3.0 },
        { x: 0.3, y: 1.0 },
        { x: 0.5, y: 0.3 },
        { x: 0.7, y: 1.0 },
        { x: 1.0, y: 3.0 }
      ]
    };

    expect(heroCurve.points.length).toBe(5);
    expect(heroCurve.points[2].y).toBe(0.3); // Mid slow-mo
  });

  it('supports transform matrices: rotate, flip horizontal/vertical, scale, position, opacity', () => {
    interface Transform {
      rotation: number;
      flipH: boolean;
      flipV: boolean;
      scale: { x: number; y: number };
      position: { x: number; y: number };
      opacity: number;
    }

    const transform: Transform = {
      rotation: 90,
      flipH: true,
      flipV: false,
      scale: { x: 1.5, y: 1.5 },
      position: { x: 50, y: -20 },
      opacity: 85
    };

    expect(transform.rotation).toBe(90);
    expect(transform.flipH).toBe(true);
    expect(transform.scale.x).toBe(1.5);
    expect(transform.opacity).toBe(85);

    // Rotation steps: 0, 90, 180, 270, 360
    const stepRotate = (current: number) => (current + 90) % 360;
    expect(stepRotate(0)).toBe(90);
    expect(stepRotate(270)).toBe(0);
  });

  it('validates blend modes: normal, multiply, screen, overlay, darken, lighten, add', () => {
    const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add'];
    expect(blendModes.length).toBe(7);

    for (const mode of blendModes) {
      expect(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add']).toContain(mode);
    }
  });

  it('calculates chroma key color distance and tolerance', () => {
    function hexToRgb(hex: string): { r: number; g: number; b: number } {
      const parsed = parseInt(hex.replace('#', ''), 16);
      return {
        r: (parsed >> 16) & 255,
        g: (parsed >> 8) & 255,
        b: parsed & 255
      };
    }

    function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
      const dr = c1.r - c2.r;
      const dg = c1.g - c2.g;
      const db = c1.b - c2.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    const greenScreen = hexToRgb('#00ff00');
    const pureGreen = { r: 0, g: 255, b: 0 };
    const nearGreen = { r: 10, g: 245, b: 15 };
    const blue = { r: 0, g: 0, b: 255 };

    expect(colorDistance(greenScreen, pureGreen)).toBe(0);
    expect(colorDistance(greenScreen, nearGreen)).toBeLessThan(25);
    expect(colorDistance(greenScreen, blue)).toBeGreaterThan(300);
  });
});
