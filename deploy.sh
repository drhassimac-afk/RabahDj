#!/bin/bash

# إنهاء السكربت فوراً في حال حدوث أي خطأ أثناء التنفيذ
set -e

echo "🔄 بدء عملية تحديث وتنظيف المشروع..."

# 1. تحديث أرقام الإصدار تلقائياً في ملف app.json باستخدام Node.js
node -e "
const fs = require('fs');
const file = './app.json';
if (!fs.existsSync(file)) {
    console.error('❌ خطأ: ملف app.json غير موجود في هذا المجلد!');
    process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.expo.android.versionCode = (data.expo.android.versionCode || 0) + 1;
let v = data.expo.version.split('.');
v[v.length-1] = parseInt(v[v.length-1]) + 1;
data.expo.version = v.join('.');
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✅ تم تحديث الإصدار بنجاح إلى -> Code: ' + data.expo.android.versionCode + ' | Version: ' + data.expo.version);
"

# 2. تنظيف مخلفات البناء القديمة لتجنب الـ Cache المزعج
echo "🧹 تنظيف الملفات المؤقتة والـ Cache..."
rm -rf android/app/build
rm -rf .expo

# 3. إعداد رسالة الـ Commit التلقائية بناءً على رقم الإصدار الجديد
VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")
VERSION_NAME=$(node -p "require('./app.json').expo.version")

echo "📦 تجهيز الملفات وعمل Commit على Git..."
git add .
git commit -m "Build: Release v${VERSION_NAME} (Build ${VERSION_CODE})"

# 4. دفع الكود إلى GitHub لتشغيل الـ Workflow المبني سابقاً
echo "🚀 جاري رفع التحديثات إلى GitHub..."
git push origin main

echo "🎉 تمت العملية بنجاح! اذهب الآن لتبويب Actions أو Releases في GitHub لتحميل الـ APK الجديد."
