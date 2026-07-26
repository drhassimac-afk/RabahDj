#!/data/data/com.termux/files/usr/bin/bash

# تخطي التنظيف تماماً إذا كنا على سيرفرات EAS Build أو بيئة CI
if [ "$EAS_BUILD" = "true" ] || [ "$CI" = "true" ]; then
  echo "⏩ تم تخطي التنظيف في بيئة البناء (EAS Build / CI)"
  exit 0
fi

find node_modules -mindepth 2 -maxdepth 4 -type d \
  \( -iname "windows" -o -iname "macos" \
     -o -iname "__tests__" -o -iname "test" -o -iname "tests" \
     -o -iname "docs" -o -iname "example" -o -iname "examples" \) \
  -not -path "node_modules/expo*" \
  -not -path "node_modules/@expo*" \
  -not -path "node_modules/react-native*" \
  -exec rm -rf {} + 2>/dev/null

echo "✅ تنظيف postinstall تم"
