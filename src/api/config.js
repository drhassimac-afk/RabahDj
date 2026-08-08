import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const PORT = 4000;
const STORAGE_KEY = 'rabahdj_server_ip';

const CACHED_PING_TIMEOUT = 900;
const SCAN_PING_TIMEOUT = 350;
const SCAN_BATCH_SIZE = 40;

export let SERVER_URL = 'http://192.168.100.2:4000';
export let SOCKET_URL = SERVER_URL;

function applyServerIp(ip) {
  SERVER_URL = `http://${ip}:${PORT}`;
  SOCKET_URL = SERVER_URL;
}

async function pingHost(ip, timeoutMs) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(
      `http://${ip}:${PORT}/ping`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data?.app === 'RabahDj';
  } catch (error) {
    clearTimeout(timer);
    return false;
  }
}

async function scanSubnet(prefix) {
  for (
    let start = 1;
    start <= 254;
    start += SCAN_BATCH_SIZE
  ) {
    const end = Math.min(
      start + SCAN_BATCH_SIZE,
      255
    );

    const batch = [];

    for (let i = start; i < end; i++) {
      const ip = `${prefix}.${i}`;

      batch.push(
        pingHost(ip, SCAN_PING_TIMEOUT).then(
          ok => (ok ? ip : null)
        )
      );
    }

    const results = await Promise.all(batch);
    const found = results.find(Boolean);

    if (found) {
      return found;
    }
  }

  return null;
}

export async function setManualServerIp(ip) {
  const clean = String(ip || '').trim();

  if (!clean) {
    return {
      ok: false,
      ip: null,
    };
  }

  const ok = await pingHost(clean, 2000);

  if (!ok) {
    return {
      ok: false,
      ip: null,
    };
  }

  applyServerIp(clean);

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      clean
    );
  } catch (error) {}

  return {
    ok: true,
    ip: clean,
  };
}

export async function discoverServer() {
  // تجربة آخر IP محفوظ
  try {
    const cachedIp =
      await AsyncStorage.getItem(STORAGE_KEY);

    if (
      cachedIp &&
      (await pingHost(
        cachedIp,
        CACHED_PING_TIMEOUT
      ))
    ) {
      applyServerIp(cachedIp);

      return {
        ip: cachedIp,
        cached: true,
      };
    }
  } catch (error) {}

  // الحصول على IP الهاتف
  try {
    const myIp =
      await Network.getIpAddressAsync();

    if (
      !myIp ||
      myIp === '0.0.0.0' ||
      !myIp.includes('.')
    ) {
      return {
        ip: null,
        cached: false,
      };
    }

    const prefix = myIp
      .split('.')
      .slice(0, 3)
      .join('.');

    // البحث عن سيرفر RabahDj
    const found = await scanSubnet(prefix);

    if (!found) {
      return {
        ip: null,
        cached: false,
      };
    }

    applyServerIp(found);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        found
      );
    } catch (error) {}

    return {
      ip: found,
      cached: false,
    };
  } catch (error) {
    return {
      ip: null,
      cached: false,
    };
  }
}
