// بلجن مخصص: يضيف تصريح نوع الخدمة الأمامية (Foreground Service) الخاصة بـ
// Notifee في AndroidManifest.xml مع النوعين camera + microphone.
// هذا مطلوب إلزامياً على أندرويد 14 (API 34) وما فوق، وإلا يرفض النظام
// تشغيل الخدمة الأمامية بصمت.

const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withNotifeeForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    mainApplication.service = mainApplication.service || [];

    // احذف أي تصريح سابق لنفس الخدمة تجنباً للتكرار عند إعادة البناء
    mainApplication.service = mainApplication.service.filter(
      (s) => s.$['android:name'] !== 'app.notifee.core.ForegroundService'
    );

    mainApplication.service.push({
      $: {
        'android:name': 'app.notifee.core.ForegroundService',
        'android:foregroundServiceType': 'camera|microphone',
        'tools:replace': 'android:foregroundServiceType',
      },
    });

    return config;
  });
};
