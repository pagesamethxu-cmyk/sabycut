import { describe, it, expect } from 'vitest';
import { EffectsEngine, VIDEO_EFFECTS_CATALOG } from '../services/effectsEngine';
import { ColorGrading, EffectSettings, ClipTransition } from '../types/timeline';

describe('EffectsEngine (Color, Shaders, Transitions & LUT)', () => {
  it('contains complete catalog of 10 required video effects with valid FFmpeg mapping', () => {
    expect(VIDEO_EFFECTS_CATALOG.length).toBe(10);
    const ids = VIDEO_EFFECTS_CATALOG.map((e) => e.id);
    expect(ids).toContain('blur');
    expect(ids).toContain('glitch');
    expect(ids).toContain('shake');
    expect(ids).toContain('zoom_pulse');
    expect(ids).toContain('rgb_split');
    expect(ids).toContain('film_grain');
    expect(ids).toContain('light_leak');
    expect(ids).toContain('vhs');
    expect(ids).toContain('flash');
    expect(ids).toContain('mirror');

    // Every effect must have an equivalent FFmpeg filter string
    for (const effect of VIDEO_EFFECTS_CATALOG) {
      expect(effect.ffmpegFilter).toBeTruthy();
    }
  });

  it('builds CSS filter string from color grading and effect parameters', () => {
    const colorGrading: ColorGrading = {
      brightness: 20,
      contrast: -10,
      saturation: 30,
      sharpness: 0,
      highlight: 0,
      shadow: 0,
      temperature: 40,
      tint: 0,
      fade: 0,
      vignette: 0,
      grain: 0,
      preset: 'none'
    };

    const effect: EffectSettings = {
      type: 'blur',
      intensity: 50
    };

    const cssFilter = EffectsEngine.buildCssFilter(colorGrading, effect);
    expect(cssFilter).toContain('brightness(1.20)');
    expect(cssFilter).toContain('contrast(0.90)');
    expect(cssFilter).toContain('saturate(1.30)');
    expect(cssFilter).toContain('sepia(0.20)');
    expect(cssFilter).toContain('blur(6.0px)');
  });

  it('applies color presets properly', () => {
    const vibrant = EffectsEngine.buildCssFilter({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      highlight: 0,
      shadow: 0,
      temperature: 0,
      tint: 0,
      fade: 0,
      vignette: 0,
      grain: 0,
      preset: 'vibrant'
    });
    expect(vibrant).toContain('saturate(1.35)');

    const bw = EffectsEngine.buildCssFilter({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      highlight: 0,
      shadow: 0,
      temperature: 0,
      tint: 0,
      fade: 0,
      vignette: 0,
      grain: 0,
      preset: 'bw'
    });
    expect(bw).toContain('grayscale(1)');
  });

  it('calculates transition transforms across clip cut points', () => {
    const fadeTrans: ClipTransition = { type: 'fade', duration: 1.0 };
    const midFade = EffectsEngine.calculateTransitionTransform(fadeTrans, 0.5);
    expect(midFade.opacityA).toBeCloseTo(0.5);
    expect(midFade.opacityB).toBeCloseTo(0.5);

    const slideLeft: ClipTransition = { type: 'slide_left', duration: 1.0 };
    const midSlide = EffectsEngine.calculateTransitionTransform(slideLeft, 0.5);
    expect(midSlide.transformA).toBe('translateX(-50.0%)');
    expect(midSlide.transformB).toBe('translateX(50.0%)');
  });

  it('parses .cube 3D LUT format', () => {
    const mockCube = `
# Sample Cube 3D LUT
TITLE "Sample Cinematic"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;
    const parsed = EffectsEngine.parseCubeLut(mockCube);
    expect(parsed.size).toBe(2);
    expect(parsed.table.length).toBe(24); // 8 triplets = 24 floats
    expect(parsed.table[0]).toBe(0.0);
    expect(parsed.table[3]).toBe(1.0);
  });
});
