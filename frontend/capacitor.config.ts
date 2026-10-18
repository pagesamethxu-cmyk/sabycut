import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabycut.app',
  appName: 'SABYCUT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
