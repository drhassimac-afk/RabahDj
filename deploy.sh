#!/bin/bash
set -e

echo "🔄 بدء عملية تحديث وتنظيف مشروع Expo الحقيقي..."

# الدخول لمجلد التطبيق لتحديث النسخة الصحيحة
cd app

node -e "
const fs = require('fs');
const file = './app.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.expo.android.versionCode = (data.expo.android.versionCode || 0) + 1;
let v = data.expo.version.split('.');
v[v.length-1] = parseInt(v[v.length-1]) + 1;
data.expo.version = v.join('.');
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✅ تم تحديث الإصدار الفعلي للتطبيق -> Code: ' + data.expo.android.versionCode + ' | Version: ' + data.expo.version);
"

echo "🧹 تنظيف الملفات المؤقتة داخل مجلد app..."
rm -rf android/app/build
rm -rf .expo
cd ..

VERSION_CODE=$(node -p "require('./app/app.json').expo.android.versionCode")
VERSION_NAME=$(node -p "require('./app/app.json').expo.version")

echo "📦 عمل Commit للنسخة الحقيقية..."
git add .
git commit -m "Build: Release v${VERSION_NAME} (Build ${VERSION_CODE})"

echo "📥 جلب التحديثات الإجبارية وإصلاح التعارض تلقائياً..."
git pull origin main -X ours --no-rebase

echo "🚀 جاري الرفع النهائي النظيف إلى GitHub..."
git push origin main

