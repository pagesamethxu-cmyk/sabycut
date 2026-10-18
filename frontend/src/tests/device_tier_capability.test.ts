import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectDeviceCapabilities,
  getActiveQualityProfile,
  getPerformanceMode,
  setPerformanceMode,
  isFeatureAllowed,
  clearCapabilityStorage,
  DeviceCapabilityReport,
} from '../services/deviceCapability';

describe('Device Capability and Adaptive Quality Engine', () => {
  beforeEach(() => {
    clearCapabilityStorage();
  });

  it('detects default capabilities and assigns tier', async () => {
    const report = await detectDeviceCapabilities(true);
    expect(report).toBeDefined();
    expect(['low', 'mid', 'high']).toContain(report.assignedTier);
    expect(report.cpuCores).toBeGreaterThan(0);
    expect(['webgl2', 'webgl1', 'canvas2d']).toContain(report.webglVersion);
  });

  it('adapts quality profile accurately based on assigned tier', () => {
    const lowReport: DeviceCapabilityReport = {
      ramGB: 2,
      cpuCores: 2,
      webglVersion: 'webgl1',
      gpuRenderer: 'Mali-400 MP',
      maxTextureSize: 2048,
      webcodecsSupported: false,
      webaudioSupported: true,
      storage: { quotaMB: 1024, usageMB: 100, availableMB: 924 },
      screenWidth: 360,
      screenHeight: 640,
      pixelRatio: 1.5,
      touchSupported: true,
      isOldAndroidWebView: false,
      androidWebViewVersion: 85,
      inAppBrowser: null,
      batteryLevel: 0.8,
      isCharging: false,
      assignedTier: 'low',
    };

    const lowProfile = getActiveQualityProfile(lowReport);
    expect(lowProfile.tier).toBe('low');
    expect(lowProfile.previewWidth).toBe(640);
    expect(lowProfile.previewHeight).toBe(360);
    expect(lowProfile.previewFps).toBe(24);
    expect(lowProfile.maxConcurrentVideoLayers).toBe(2);
    expect(lowProfile.maxUndoHistory).toBe(20);
    expect(lowProfile.allow4kExport).toBe(false);

    const highReport: DeviceCapabilityReport = {
      ...lowReport,
      ramGB: 12,
      cpuCores: 8,
      webglVersion: 'webgl2',
      gpuRenderer: 'Apple A17 Pro GPU',
      maxTextureSize: 16384,
      webcodecsSupported: true,
      assignedTier: 'high',
    };

    setPerformanceMode('auto');
    const highProfile = getActiveQualityProfile(highReport);
    expect(highProfile.tier).toBe('high');
    expect(highProfile.previewWidth).toBe(1280);
    expect(highProfile.previewHeight).toBe(720);
    expect(highProfile.previewFps).toBe(60);
    expect(highProfile.maxConcurrentVideoLayers).toBe(8);
    expect(highProfile.maxUndoHistory).toBe(100);
    expect(highProfile.allow4kExport).toBe(true);
  });

  it('allows manual performance mode override regardless of hardware tier', () => {
    expect(getPerformanceMode()).toBe('auto');

    const profileLow = setPerformanceMode('low');
    expect(getPerformanceMode()).toBe('low');
    expect(profileLow.tier).toBe('low');
    expect(profileLow.previewFps).toBe(24);

    const profileHigh = setPerformanceMode('high');
    expect(getPerformanceMode()).toBe('high');
    expect(profileHigh.tier).toBe('high');
    expect(profileHigh.previewFps).toBe(60);

    const profileMid = setPerformanceMode('mid');
    expect(getPerformanceMode()).toBe('mid');
    expect(profileMid.tier).toBe('mid');
    expect(profileMid.previewFps).toBe(30);
  });

  it('validates feature flags per device profile constraints', () => {
    setPerformanceMode('low');
    const check4kLow = isFeatureAllowed('4k_export');
    expect(check4kLow.allowed).toBe(false);
    expect(check4kLow.reason).toBeDefined();

    setPerformanceMode('high');
    const check4kHigh = isFeatureAllowed('4k_export');
    expect(check4kHigh.allowed).toBe(true);
    expect(check4kHigh.reason).toBeUndefined();
  });
});
