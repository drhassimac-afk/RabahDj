// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// استثناء مجلدات npm غير الضرورية وقت التشغيل من مراقبة Metro
// (نستخدم Expo Go، هذي المجلدات ما تخص تشغيل JS، وهذا يقلل عدد الـ file watchers بشكل كبير)
config.resolver.blockList = /node_modules[\/\\].*[\/\\](android|ios|windows|macos|typescript|types|__tests__|test|tests|example|examples|docs|\.github)[\/\\].*|\.git[\/\\].*/;

module.exports = config;
