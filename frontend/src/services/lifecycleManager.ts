import { Capacitor, registerPlugin } from '@capacitor/core';

interface AppPlugin {
  addListener(
    eventName: 'appStateChange',
    listenerFunc: (state: { isActive: boolean }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

const CapacitorApp = registerPlugin<AppPlugin>('App');

export interface LifecycleListener {
  onBackground?: () => Promise<void> | void;
  onForeground?: () => Promise<void> | void;
  onLowMemory?: () => void;
}

export type DeviceVendor = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'huawei' | 'apple' | 'generic';

const listeners: LifecycleListener[] = [];
let initialized = false;

// Determine device vendor from User Agent
export function detectDeviceVendor(): DeviceVendor {
  if (typeof navigator === 'undefined') return 'generic';
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod|macintosh/i.test(ua)) return 'apple';
  if (/samsung|sm-[a-z0-9]+/i.test(ua)) return 'samsung';
  if (/xiaomi|redmi|poco|miui/i.test(ua)) return 'xiaomi';
  if (/oppo|cph[0-9]+/i.test(ua)) return 'oppo';
  if (/vivo|v[0-9]+/i.test(ua)) return 'vivo';
  if (/huawei|honor/i.test(ua)) return 'huawei';

  return 'generic';
}

// Get vendor battery optimization instructions in Khmer and English
export function getBatteryOptimizationGuide(lang: 'km' | 'en' = 'km'): {
  vendor: DeviceVendor;
  title: string;
  instructions: string[];
} {
  const vendor = detectDeviceVendor();

  const guides = {
    km: {
      xiaomi: {
        title: 'ការកំណត់ថាមពលថ្មសម្រាប់ទូរសព្ទ Xiaomi / Redmi / POCO',
        instructions: [
          'ចូលទៅកាន់ Settings > Apps > Manage Apps > SABYCUT',
          'បើក Autostart',
          'ចូល Battery saver ហើយជ្រើសរើស No restrictions',
        ],
      },
      samsung: {
        title: 'ការកំណត់ថាមពលថ្មសម្រាប់ទូរសព្ទ Samsung Galaxy',
        instructions: [
          'ចូលទៅកាន់ Settings > Apps > SABYCUT > Battery',
          'ជ្រើសរើស Unrestricted (គ្មានដែនកំណត់)',
          'ចូល Device Care > Battery > Background usage limits ហើយដាក់ SABYCUT ក្នុង Never sleeping apps',
        ],
      },
      oppo: {
        title: 'ការកំណត់ថាមពលថ្មសម្រាប់ទូរសព្ទ OPPO / Realme',
        instructions: [
          'ចូល Settings > Apps > App Management > SABYCUT',
          'ចូល Battery Usage ហើយបើក Allow background activity និង Allow auto-launch',
        ],
      },
      vivo: {
        title: 'ការកំណត់ថាមពលថ្មសម្រាប់ទូរសព្ទ Vivo / iQOO',
        instructions: [
          'ចូល Settings > Battery > High background power consumption',
          'បើកដំណើរការសម្រាប់ SABYCUT',
        ],
      },
      huawei: {
        title: 'ការកំណត់ថាមពលថ្មសម្រាប់ទូរសព្ទ Huawei / Honor',
        instructions: [
          'ចូល Settings > Battery > App Launch',
          'បិទ Manage Automatically សម្រាប់ SABYCUT ហើយបើក Auto-launch និង Run in background',
        ],
      },
      generic: {
        title: 'ការណែនាំអំពីការរក្សាដំណើរការនាំចេញវីដេអូ',
        instructions: [
          'សូមកុំបិទកម្មវិធីខណៈពេលកំពុងនាំចេញវីដេអូ',
          'បើកការអនុញ្ញាតដំណើរការផ្ទៃខាងក្រោយ (Background activity) នៅក្នុង Settings ប្រសិនបើប្រព័ន្ធទាមទារ',
        ],
      },
      apple: {
        title: 'ការរក្សាដំណើរការនៅលើ iOS',
        instructions: [
          'សូមកុំបិទអេក្រង់ ឬចាកចេញពីកម្មវិធីខណៈពេលកំពុងដំណើរការនាំចេញវីដេអូ',
          'SABYCUT ប្រើប្រាស់ Background Task API ដើម្បីបន្តដំណើរការនាំចេញ',
        ],
      },
    },
    en: {
      xiaomi: {
        title: 'Battery Optimization Guide for Xiaomi / Redmi / POCO',
        instructions: [
          'Go to Settings > Apps > Manage Apps > SABYCUT',
          'Enable Autostart',
          'Tap Battery saver and select No restrictions',
        ],
      },
      samsung: {
        title: 'Battery Optimization Guide for Samsung Galaxy',
        instructions: [
          'Go to Settings > Apps > SABYCUT > Battery',
          'Select Unrestricted',
          'Under Device Care > Battery > Background usage limits, add SABYCUT to Never sleeping apps',
        ],
      },
      oppo: {
        title: 'Battery Optimization Guide for OPPO / Realme',
        instructions: [
          'Go to Settings > Apps > App Management > SABYCUT',
          'Tap Battery Usage and enable Allow background activity and Allow auto-launch',
        ],
      },
      vivo: {
        title: 'Battery Optimization Guide for Vivo / iQOO',
        instructions: [
          'Go to Settings > Battery > High background power consumption',
          'Enable permission for SABYCUT',
        ],
      },
      huawei: {
        title: 'Battery Optimization Guide for Huawei / Honor',
        instructions: [
          'Go to Settings > Battery > App Launch',
          'Disable Manage Automatically for SABYCUT and enable Auto-launch and Run in background',
        ],
      },
      generic: {
        title: 'Background Export Guidance',
        instructions: [
          'Please keep the app open while exporting large videos',
          'Allow background activity in device settings if prompted by the operating system',
        ],
      },
      apple: {
        title: 'Background Process Guidance on iOS',
        instructions: [
          'Keep screen active or stay in app during high-resolution exports',
          'SABYCUT utilizes iOS Background Task API to sustain rendering',
        ],
      },
    },
  };

  const set = guides[lang] || guides.km;
  const guide = set[vendor] || set.generic;

  return { vendor, title: guide.title, instructions: guide.instructions };
}

// Global Texture and Frame Registry to ensure deterministic deallocation
class ResourceRegistry {
  private textures: Set<WebGLTexture> = new Set();
  private bitmaps: Set<ImageBitmap> = new Set();
  private objectUrls: Set<string> = new Set();

  registerTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture): void {
    this.textures.add(texture);
  }

  unregisterTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture): void {
    try {
      gl.deleteTexture(texture);
    } catch {
      // Ignore
    }
    this.textures.delete(texture);
  }

  registerBitmap(bitmap: ImageBitmap): void {
    this.bitmaps.add(bitmap);
  }

  unregisterBitmap(bitmap: ImageBitmap): void {
    try {
      bitmap.close();
    } catch {
      // Ignore
    }
    this.bitmaps.delete(bitmap);
  }

  registerUrl(url: string): void {
    this.objectUrls.add(url);
  }

  unregisterUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
    this.objectUrls.delete(url);
  }

  disposeAll(): void {
    this.bitmaps.forEach((b) => {
      try {
        b.close();
      } catch {}
    });
    this.bitmaps.clear();

    this.objectUrls.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    this.objectUrls.clear();

    this.textures.clear();
  }
}

export const resources = new ResourceRegistry();

// Subscribe to app lifecycle events
export function registerLifecycleListener(listener: LifecycleListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

// Initialize native and web lifecycle handlers
export function initLifecycleManager(onAutoSaveSnapshot: () => Promise<void> | void): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const handleBackground = async () => {
    try {
      await onAutoSaveSnapshot();
    } catch (err) {
      console.warn('Auto-save snapshot on backgrounding failed:', err);
    }

    for (const l of listeners) {
      if (l.onBackground) {
        try {
          await l.onBackground();
        } catch (err) {
          console.warn('Lifecycle onBackground error:', err);
        }
      }
    }
  };

  const handleForeground = async () => {
    for (const l of listeners) {
      if (l.onForeground) {
        try {
          await l.onForeground();
        } catch (err) {
          console.warn('Lifecycle onForeground error:', err);
        }
      }
    }
  };

  // Browser standard visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleBackground();
    } else if (document.visibilityState === 'visible') {
      handleForeground();
    }
  });

  // Page freeze / hide
  window.addEventListener('pagehide', () => {
    handleBackground();
  });

  // Capacitor Native AppState change
  if (Capacitor.isNativePlatform()) {
    try {
      CapacitorApp.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          handleBackground();
        } else {
          handleForeground();
        }
      }).catch(() => {
        // Fallback for native platform edge cases
      });
    } catch {
      // Ignore
    }
  }
}
