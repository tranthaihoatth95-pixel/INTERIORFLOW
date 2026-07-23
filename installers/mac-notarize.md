# Mac .dmg Notarize — Checklist

> **CHỜ USER** cấp Apple Developer credential trước khi thực thi.

## Prerequisites

- [ ] Apple Developer Program active ($99/năm) — user đăng ký tại https://developer.apple.com/programs/enroll
- [ ] Developer ID Application certificate installed trong Keychain (Xcode → Settings → Accounts → Manage Certificates → + → Developer ID Application)
- [ ] Team ID (10-char) từ https://developer.apple.com/account → Membership
- [ ] App-specific password tạo tại https://appleid.apple.com → Sign-In and Security → App-Specific Passwords (đặt tên `notarize-interiorflow`)
- [ ] Xcode command line tools: `xcode-select --install`
- [ ] `notarytool` khả dụng: `xcrun notarytool --help`

## Env vars agent cần

```bash
export APPLE_ID="user@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"
```

## Bước agent thực hiện

### 1. Cài `@electron/notarize`
```bash
npm i -D @electron/notarize
```

### 2. Tạo `electron/entitlements.mac.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.network.client</key><true/>
  <key>com.apple.security.network.server</key><true/>
  <key>com.apple.security.files.user-selected.read-write</key><true/>
  <key>com.apple.security.inherit</key><true/>
</dict>
</plist>
```

### 3. Tạo `scripts/notarize.js` (afterSign hook)
```js
require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    appBundleId: 'com.ttt.interiorflow',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
    tool: 'notarytool',
  });
};
```

### 4. Cập nhật `package.json` `build.mac`
```json
"mac": {
  "target": [{ "target": "dmg", "arch": ["arm64", "x64"] }],
  "icon": "electron/icons/icon.png",
  "category": "public.app-category.graphics-design",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "electron/entitlements.mac.plist",
  "entitlementsInherit": "electron/entitlements.mac.plist"
},
"afterSign": "scripts/notarize.js"
```

### 5. Thêm script `package.json`
```json
"electron:build:mac:notarize": "next build && electron-builder --mac"
```

### 6. Chạy build test
```bash
npm run electron:build:mac:notarize
# Chờ 5-15 phút (notarize upload + Apple server verify)
```

### 7. Verify
```bash
# Ký OK?
codesign --verify --deep --strict --verbose=2 "dist/mac-arm64/InteriorFlow.app"

# Notarize ticket stapled?
xcrun stapler validate "dist/InteriorFlow-0.1.0-arm64.dmg"

# Gatekeeper OK?
spctl -a -vv "dist/mac-arm64/InteriorFlow.app"
# Kỳ vọng: "accepted" + "source=Notarized Developer ID"
```

## Rủi ro

- **Blender spawn**: `lib/server/blender.ts` spawn `/Applications/Blender.app/Contents/MacOS/Blender` — với `com.apple.security.cs.disable-library-validation` + `com.apple.security.cs.allow-jit` PLUS **KHÔNG SANDBOX** (Developer ID build không bật sandbox), spawn hoạt động OK. Nếu sau này muốn Mac App Store → phải viết lại kiến trúc (xem `docs/RESEARCH-MOBILE-DISTRIBUTION.md` mục 4).
- **First notarize thường mất 10-15 phút**; sau đó cached ~2-5 phút.
- **Upload key size**: build .dmg universal (arm64+x64) ~300MB, notarize upload có thể timeout — chia arch build riêng nếu vấn đề.
- **`identity: null` hiện tại** trong `package.json` — phải xoá để electron-builder tự tìm Developer ID trong Keychain.
