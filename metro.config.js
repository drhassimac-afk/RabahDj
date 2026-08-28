// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// استثناء مجلدات npm غير الضرورية وقت التشغيل من مراقبة Metro
// (نستخدم Expo Go، هذي المجلدات ما تخص تشغيل JS، وهذا يقلل عدد الـ file watchers بشكل كبير)
// ملاحظة: أزلنا "types" من هذه القائمة لأن بعض المكتبات (مثل @notifee/react-native)
// تضع ملفات JS حقيقية مطلوبة وقت التشغيل داخل مجلد اسمه "types" وليس فقط تعريفات TypeScript،
// وكانت هذه القاعدة تمنع Metro من العثور عليها فيفشل تجميع الحزمة (Bundle).
config.resolver.blockList = /node_modules[\/\\].*[\/\\](android|ios|windows|macos|typescript|__tests__|test|tests|example|examples|docs|\.github)[\/\\].*|\.git[\/\\].*/;

module.exports = config;
