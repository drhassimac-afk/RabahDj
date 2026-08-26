// مخزن إشعارات مركزي — إشعارات داخل التطبيق + إشعارات نظام حقيقية على الهاتف
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let items = [];
let listeners = [];
let osNotificationsReady = false;
let osNotificationsEnabled = true;

// كيف يتصرف الإشعار إذا وصل والتطبيق مفتوح على الشاشة
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TYPE_META = {
  post: { title: '📝 منشور جديد' },
  radio: { title: '🎙️ بث مباشر' },
  walkie: { title: '📻 تخاطب لاسلكي' },
  live: { title: '📡 بث مباشر' },
  file: { title: '📁 ملف جديد' },
  chat: { title: '💬 رسالة جديدة' },
  nearby: { title: '📍 قريبون مني' },
  default: { title: '🔔 RabahDj' },
};

export async function checkNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    return !!current.granted;
  } catch (e) {
    return false;
  }
}

export async function initNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات RabahDj',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#3B82F6',
        sound: 'default',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;

    if (!granted && current.canAskAgain) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }

    osNotificationsReady = !!granted;
    return osNotificationsReady;
  } catch (e) {
    osNotificationsReady = false;
    return false;
  }
}

export function setOsNotificationsEnabled(value) {
  osNotificationsEnabled = value;
}

export function getOsNotificationsEnabled() {
  return osNotificationsEnabled;
}

async function fireOsNotification(type, text) {
  if (!osNotificationsReady || !osNotificationsEnabled) return;

  try {
    const meta = TYPE_META[type] || TYPE_META.default;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: meta.title,
        body: text,
        sound: 'default',
      },
      trigger: null, // فوري
    });
  } catch (e) {
    // تجاهل بصمت إن فشل الإشعار (مثلاً صلاحية مرفوضة)
  }
}

export function addNotification(type, text) {
  const n = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    type,
    text,
    time: new Date(),
  };
  items = [n, ...items].slice(0, 100);
  listeners.forEach((cb) => cb(items));
  fireOsNotification(type, text);
}

export function getNotifications() {
  return items;
}

export function subscribe(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

export function clearNotifications() {
  items = [];
  listeners.forEach((cb) => cb(items));
}

export function removeNotification(id) {
  items = items.filter((n) => n.id !== id);
  listeners.forEach((cb) => cb(items));
}
