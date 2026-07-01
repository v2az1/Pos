import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.wholesalepos.terminal',
  appName: 'Wholesale POS Terminal Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true
    }
  }
};

export default config;
