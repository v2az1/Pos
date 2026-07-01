import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

export const isNativePlatform = Capacitor.isNativePlatform();

export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  try {
    if (!isNativePlatform) return;

    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch (err) {
    console.debug('Haptics not available or failed:', err);
  }
};

export const initCapacitorNative = async (isDarkTheme: boolean, onBackNavigation?: () => boolean) => {
  if (!isNativePlatform) {
    console.log('Running in Standard Web / PWA mode');
    return;
  }

  console.log('Initializing Capacitor Native Android Kiosk Mode...');

  try {
    // 1. Configure Android StatusBar
    await StatusBar.setStyle({ style: isDarkTheme ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDarkTheme ? '#0f172a' : '#1e1b4b' });

    // 2. Configure Android Soft Keyboard
    Keyboard.addListener('keyboardWillShow', info => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`;
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px';
    });

    // 3. Handle Android Hardware Back Button
    App.addListener('backButton', ({ canGoBack }) => {
      if (onBackNavigation && onBackNavigation()) {
        // Handled internal modal or back navigation
        return;
      }
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

  } catch (err) {
    console.error('Failed to initialize native Capacitor plugins:', err);
  }
};
