import { Platform } from 'react-native';

let NativeModule = null;

if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line global-require
    const { requireNativeModule } = require('expo-modules-core');
    NativeModule = requireNativeModule('ForegroundCallService');
  } catch (e) {
    NativeModule = null;
  }
}

export function startCallForegroundService() {
  try {
    NativeModule?.startService();
  } catch (e) {
    // تجاهل بصمت — المكالمة تستمر عادي بدون الحماية الإضافية
  }
}

export function stopCallForegroundService() {
  try {
    NativeModule?.stopService();
  } catch (e) {
    // تجاهل بصمت
  }
}
