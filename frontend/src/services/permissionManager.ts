import { Capacitor } from '@capacitor/core';

export type PermissionType = 'camera' | 'microphone' | 'photos' | 'storage';
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'limited';

export interface PermissionExplanation {
  title: string;
  description: string;
  actionText: string;
  cancelText: string;
  settingsGuide: string;
}

const EXPLANATIONS: Record<'km' | 'en', Record<PermissionType, PermissionExplanation>> = {
  km: {
    camera: {
      title: 'ការអនុញ្ញាតប្រើប្រាស់កាមេរ៉ា',
      description: 'SABYCUT ត្រូវការប្រើប្រាស់កាមេរ៉ាដើម្បីថតវីដេអូ ឬរូបភាពផ្ទាល់ចូលទៅក្នុងបន្ទាត់ពេលវេលាគម្រោង។',
      actionText: 'យល់ព្រម',
      cancelText: 'ពេលក្រោយ',
      settingsGuide: 'សូមចូលទៅកាន់ Settings > Permissions > Camera ហើយបើកការអនុញ្ញាតដើម្បីប្រើប្រាស់កាមេរ៉ា។',
    },
    microphone: {
      title: 'ការអនុញ្ញាតប្រើប្រាស់មីក្រូហ្វូន',
      description: 'SABYCUT ត្រូវការប្រើប្រាស់មីក្រូហ្វូនដើម្បីថតសំឡេងបកស្រាយ (Voiceover) ផ្ទាល់លើវីដេអូ។',
      actionText: 'យល់ព្រម',
      cancelText: 'ពេលក្រោយ',
      settingsGuide: 'សូមចូលទៅកាន់ Settings > Permissions > Microphone ហើយបើកការអនុញ្ញាតដើម្បីថតសំឡេង។',
    },
    photos: {
      title: 'ការអនុញ្ញាតចូលប្រើកម្រងរូបភាព និងវីដេអូ',
      description: 'SABYCUT ត្រូវការការអនុញ្ញាតចូលទៅកាន់រូបភាព និងវីដេអូ ដើម្បីជ្រើសរើសឯកសារមកកាត់ត និងរក្សាទុកវីដេអូនាំចេញ។',
      actionText: 'យល់ព្រម',
      cancelText: 'ពេលក្រោយ',
      settingsGuide: 'សូមចូលទៅកាន់ Settings > Permissions > Photos/Videos ហើយបើកការអនុញ្ញាត។',
    },
    storage: {
      title: 'ការអនុញ្ញាតរក្សាទុកឯកសារ',
      description: 'SABYCUT ត្រូវការចូលប្រើទំហំផ្ទុកដើម្បីរក្សាទុកឯកសារគម្រោង និងវីដេអូដែលបាននាំចេញ។',
      actionText: 'យល់ព្រម',
      cancelText: 'ពេលក្រោយ',
      settingsGuide: 'សូមចូលទៅកាន់ Settings > Permissions > Storage ហើយបើកការអនុញ្ញាត។',
    },
  },
  en: {
    camera: {
      title: 'Camera Permission Required',
      description: 'SABYCUT requires camera access to record video clips directly into your project timeline.',
      actionText: 'Allow Access',
      cancelText: 'Not Now',
      settingsGuide: 'Please open device Settings > Permissions > Camera and enable access.',
    },
    microphone: {
      title: 'Microphone Permission Required',
      description: 'SABYCUT requires microphone access to record voiceovers directly onto your video.',
      actionText: 'Allow Access',
      cancelText: 'Not Now',
      settingsGuide: 'Please open device Settings > Permissions > Microphone and enable access.',
    },
    photos: {
      title: 'Photo Library Permission Required',
      description: 'SABYCUT needs permission to access your photo library to import video clips and save exported videos.',
      actionText: 'Allow Access',
      cancelText: 'Not Now',
      settingsGuide: 'Please open device Settings > Permissions > Photos/Videos and enable access.',
    },
    storage: {
      title: 'Storage Permission Required',
      description: 'SABYCUT requires storage access to save project cache files and exported video files.',
      actionText: 'Allow Access',
      cancelText: 'Not Now',
      settingsGuide: 'Please open device Settings > Permissions > Storage and enable access.',
    },
  },
};

// Retrieve explanation text for permission modal
export function getPermissionExplanation(type: PermissionType, lang: 'km' | 'en' = 'km'): PermissionExplanation {
  const set = EXPLANATIONS[lang] || EXPLANATIONS.km;
  return set[type];
}

// Check current permission state
export async function checkPermission(type: PermissionType): Promise<PermissionState> {
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    // Web / PWA Permissions API
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        let name: PermissionName;
        if (type === 'camera') name = 'camera' as PermissionName;
        else if (type === 'microphone') name = 'microphone' as PermissionName;
        else return 'granted'; // Storage & photos handled via file inputs

        const status = await navigator.permissions.query({ name });
        if (status.state === 'granted') return 'granted';
        if (status.state === 'denied') return 'denied';
        return 'prompt';
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }

  // Native Capacitor platform check
  return 'prompt';
}

// Request permission with pre-explanation hook
export async function requestPermission(
  type: PermissionType,
  showExplanationModal: (explanation: PermissionExplanation) => Promise<boolean>,
  lang: 'km' | 'en' = 'km'
): Promise<{ state: PermissionState; message?: string }> {
  const explanation = getPermissionExplanation(type, lang);

  // Show user pre-permission explanation dialog
  const userConfirmed = await showExplanationModal(explanation);
  if (!userConfirmed) {
    return { state: 'denied', message: explanation.settingsGuide };
  }

  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    // In mobile web/PWA
    try {
      if (type === 'camera' || type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'camera',
          audio: type === 'microphone',
        });
        // Release immediate test stream
        stream.getTracks().forEach((track) => track.stop());
        return { state: 'granted' };
      }
      return { state: 'granted' };
    } catch (err) {
      console.warn(`Permission request for ${type} was denied:`, err);
      return { state: 'denied', message: explanation.settingsGuide };
    }
  }

  // Native Capacitor execution
  return { state: 'granted' };
}
