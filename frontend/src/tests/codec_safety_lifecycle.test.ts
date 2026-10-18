import { describe, it, expect, vi } from 'vitest';
import {
  probeCodecSupport,
  applySdrToneMapping,
  platformQuirks,
} from '../services/codecSafety';
import {
  detectDeviceVendor,
  getBatteryOptimizationGuide,
  registerLifecycleListener,
  resources,
} from '../services/lifecycleManager';

describe('Codec Safety and Platform Quirks Engine', () => {
  it('probes browser codec support safely without exceptions', () => {
    const report = probeCodecSupport();
    expect(report).toBeDefined();
    expect(typeof report.h264).toBe('boolean');
    expect(typeof report.hevc).toBe('boolean');
    expect(typeof report.vp9).toBe('boolean');
    expect(typeof report.av1).toBe('boolean');
  });

  it('runs tone mapping on SDR buffer without crashing', () => {
    const mockCtx = {
      getImageData: () => ({
        data: new Uint8ClampedArray([255, 128, 0, 255, 100, 50, 20, 255]),
      }),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    expect(() => applySdrToneMapping(mockCtx, 2, 1)).not.toThrow();
  });

  it('initializes platform quirks listeners safely', () => {
    expect(() => platformQuirks.init()).not.toThrow();
  });
});

describe('Lifecycle and Vendor Battery Optimization Manager', () => {
  it('detects device vendor accurately', () => {
    const vendor = detectDeviceVendor();
    expect(['xiaomi', 'samsung', 'oppo', 'vivo', 'huawei', 'apple', 'generic']).toContain(vendor);
  });

  it('returns vendor battery optimization guide in Khmer and English', () => {
    const guideKm = getBatteryOptimizationGuide('km');
    expect(guideKm.title).toBeDefined();
    expect(guideKm.instructions.length).toBeGreaterThan(0);

    const guideEn = getBatteryOptimizationGuide('en');
    expect(guideEn.title).toBeDefined();
    expect(guideEn.instructions.length).toBeGreaterThan(0);
  });

  it('tracks resources in ResourceRegistry and disposes cleanly', () => {
    const url = 'blob:http://localhost/test-media-123';
    resources.registerUrl(url);
    expect(() => resources.unregisterUrl(url)).not.toThrow();
    expect(() => resources.disposeAll()).not.toThrow();
  });

  it('registers and unregisters lifecycle listeners', () => {
    const listener = {
      onBackground: vi.fn(),
      onForeground: vi.fn(),
    };
    const unregister = registerLifecycleListener(listener);
    expect(typeof unregister).toBe('function');
    unregister();
  });
});
