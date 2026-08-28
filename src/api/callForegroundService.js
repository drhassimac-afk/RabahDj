// خدمة أمامية (Foreground Service) تُبقي مكالمة الفيديو شغّالة
// حتى لو غادر المستخدم التطبيق أو فتح تطبيقاً آخر.
// أندرويد يوقف الكاميرا/المايك تلقائياً لأي تطبيق في الخلفية
// إلا إذا كان مرتبطاً بخدمة أمامية (نفس مبدأ تطبيقات المكالمات العادية).

import notifee, {
  AndroidImportance,
  AndroidColor,
  AndroidForegroundServiceType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

let channelId = null;
let running = false;

export async function prewarmCallForegroundService() {
  if (Platform.OS !== 'android') return;

  try {
    await notifee.requestPermission();

    if (!channelId) {
      channelId = await notifee.createChannel({
        id: 'video-call',
        name: 'مكالمة فيديو نشطة',
        importance: AndroidImportance.LOW,
      });
    }
  } catch (e) {
    // تجاهل بصمت
  }
}

export async function startCallForegroundService() {
  if (Platform.OS !== 'android' || running) return;

  try {
    if (!channelId) {
      channelId = await notifee.createChannel({
        id: 'video-call',
        name: 'مكالمة فيديو نشطة',
        importance: AndroidImportance.LOW,
      });
    }

    await notifee.displayNotification({
      id: 'rabahdj-call',
      title: '📹 مكالمة فيديو نشطة',
      body: 'RabahDj يستمر في البث حتى لو غادرت التطبيق',
      android: {
        channelId,
        asForegroundService: true,
        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        ],
        ongoing: true,
        autoCancel: false,
        color: AndroidColor.BLUE,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });

    running = true;
  } catch (e) {
    console.log('تعذر تشغيل خدمة المكالمة بالخلفية:', e?.message || e);
  }
}

export async function stopCallForegroundService() {
  if (!running) return;

  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification('rabahdj-call');
  } catch (e) {
    // تجاهل
  } finally {
    running = false;
  }
}
