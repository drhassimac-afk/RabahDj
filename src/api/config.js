import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const PORT = 4000;
const STORAGE_KEY = 'rabahdj_server_ip';
const CACHED_PING_TIMEOUT = 900;   // مهلة فحص آخر IP معروف (سريع)
const SCAN_PING_TIMEOUT = 350;     // مهلة فحص كل جهاز أثناء المسح
const SCAN_BATCH_SIZE = 40;        // كام جهاز يتفحصوا مع بعض بالتوازي

// قيمة افتراضية احتياطية لحد ما الاكتشاف يخلص
export let SERVER_URL = 'http://192.168.100.2:4000';
export let SOCKET_URL = SERVER_URL;

function applyServerIp(ip) {
  SERVER_URL = `http://${ip}:${PORT}`;
  SOCKET_URL = SERVER_URL;
}

async function pingHost(ip, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${ip}:${PORT}/ping`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.app === 'RabahDj';
  } catch (err) {
    clearTimeout(timer);
    return false;
  }
}

async function scanSubnet(prefix) {
  for (let start = 1; start <= 254; start += SCAN_BATCH_SIZE) {
    const end = Math.min(start + SCAN_BATCH_SIZE, 255);
    const batch = [];
    for (let i = start; i < end; i++) {
      const ip = `${prefix}.${i}`;
      batch.push(pingHost(ip, SCAN_PING_TIMEOUT).then((ok) => (ok ? ip : null)));
    }
    const results = await Promise.all(batch);
    const found = results.find(Boolean);
    if (found) return found;
  }
  return null;
}

/**
 * يدور على سيرفر RabahDj في نفس الشبكة المحلية تلقائيًا:
 * 1) يجرب آخر IP نجح فيه قبل كده (سريع جدًا لو الشبكة متغيرتش)
 * 2) لو فشل، يمسح باقي الشبكة (نفس أول 3 أجزاء من IP الجهاز) لحد ما يلاقي السيرفر
 * 3) يحفظ الـ IP اللي نجح فيه عشان المرة الجاية
 */
export async function setManualServerIp(ip) {
  const clean = (ip || '').trim();
  if (!clean) return { ok: false };
  const ok = await pingHost(clean, 2000);
  if (!ok) return { ok: false };
  applyServerIp(clean);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, clean);
  } catch (err) {
    // تجاهل
  }
  return { ok: true, ip: clean };
}

export async function discoverServer() {
  try {
    const cachedIp = await AsyncStorage.getItem(STORAGE_KEY);
    if (cachedIp && (await pingHost(cachedIp, CACHED_PING_TIMEOUT))) {
      applyServerIp(cachedIp);
      return { ip: cachedIp, cached: true };
    }
  } catch (err) {
    // تجاهل، هنكمل على المسح
  }

  try {
    const myIp = await Network.getIpAddressAsync();
    if (myIp && myIp !== '0.0.0.0') {
      const prefix = myIp.split('.').slice(0, 3).join('.');
      const found = await scanSubnet(prefix);
      if (found) {
        applyServerIp(found);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, found);
        } catch (err) {
          // فشل الحفظ مش خطير، هيدور تاني المرة الجاية
        }
        return { ip: found, cached: false };
      }
    }
  } catch (err) {
    // تجاهل — مفيش IP، هنرجع فشل
  }

  return { ip: null, cached: false };
}
