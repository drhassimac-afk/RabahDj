#!/bin/bash
# سكريبت تنظيف مشروع RabahDj
# يحذف نسخة المشروع القديمة (v1) الميتة بالكامل + ملفات النسخ الاحتياطية المتروكة
# نفّذه من داخل مجلد المشروع (حيث يوجد App.js)

set -e

echo "🧹 بدء تنظيف المشروع..."

# 1) واجهة v1 القديمة بالكامل — غير مستخدمة إطلاقاً (App.js لا يستدعيها)
git rm -f \
  src/navigation/AppNavigator.js \
  src/screens/WelcomeScreen.js \
  src/screens/LoginScreen.js \
  src/screens/FeedScreen.js \
  src/screens/EntertainmentScreen.js \
  src/screens/ProfileScreen.js \
  src/screens/AdminScreen.js \
  src/screens/ChatScreen.js \
  src/components/PostCard.js \
  src/components/PostComposer.js \
  src/components/WalkieTalkieButton.js \
  src/components/ToastNotification.js \
  src/screens/v2/WallScreen.js

# 2) نسخ احتياطية / قديمة متروكة داخل src (كلها غير مستوردة من أي مكان)
git rm -f \
  src/api/socket.js.backup-live-v2 \
  src/components/PostCard.js.backup-post-fix \
  src/context/SocketContext.js.backup-live-v2 \
  src/context/SocketContext.js.backup-post-fix \
  src/screens/v2/V2AdminLoginScreen.js.backup \
  src/screens/v2/V2CinemaScreen.backup.js \
  src/screens/v2/V2CinemaScreen.before-3x3x2.js \
  src/screens/v2/V2CinemaScreen.before-ui-redesign.js \
  src/screens/v2/V2CinemaScreen.old.js \
  src/screens/v2/V2LiveStreamScreen.js.backup-ice \
  src/screens/v2/V2LiveStreamScreen.js.backup-live-v2 \
  src/screens/v2/V2WallScreen.js.backup-ui \
  src/screens/v2/V2WallScreen.js.before-separated \
  src/screens/v2/V2WelcomeScreen.before-3x3x2.js \
  src/screens/v2/WallScreen.js.backup-post-fix

# 3) ملفات متروكة في جذر المشروع
git rm -f \
  App.js.backup \
  rm \
  imported_packages.txt

echo "✅ تم حذف $(git status --short | grep -c '^D') ملف."
echo "الآن نفّذ:"
echo "  git commit -m 'تنظيف: حذف مشروع v1 القديم والنسخ الاحتياطية غير المستخدمة'"
echo "  git push"
